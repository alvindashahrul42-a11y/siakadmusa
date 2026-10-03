const pool = require('../config/database');

// Helper: waktu lokal server dalam format 'YYYY-MM-DD HH:MM:SS'
// Konsisten dengan kolom DATETIME MariaDB yang tidak menyimpan timezone
function localNow() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function localDate() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
}

// Shared column list — DATETIME columns formatted as strings for clean JSON serialisation
// Sertakan timezone offset agar browser parse sebagai waktu lokal server, bukan UTC
const ATTEMPT_COLS = `
  ea.id, ea.exam_schedule_id, ea.student_id, ea.status,
  CONCAT(DATE_FORMAT(ea.started_at,   '%Y-%m-%dT%H:%i:%s'), IFNULL(TIME_FORMAT(TIMEDIFF(NOW(), UTC_TIMESTAMP()), '+%H:%i'), '+00:00')) AS started_at,
  CONCAT(DATE_FORMAT(ea.deadline_at,  '%Y-%m-%dT%H:%i:%s'), IFNULL(TIME_FORMAT(TIMEDIFF(NOW(), UTC_TIMESTAMP()), '+%H:%i'), '+00:00')) AS deadline_at,
  CONCAT(DATE_FORMAT(ea.submitted_at, '%Y-%m-%dT%H:%i:%s'), IFNULL(TIME_FORMAT(TIMEDIFF(NOW(), UTC_TIMESTAMP()), '+%H:%i'), '+00:00')) AS submitted_at,
  ea.question_order, ea.objective_score, ea.essay_score, ea.total_score,
  ea.tab_switch_count, ea.ip_address, ea.user_agent,
  ea.created_at, ea.updated_at`;

class ExamAttemptModel {
  static async start(data) {
    const { exam_schedule_id, student_id, deadline_at, question_order = null, ip_address = null, user_agent = null } = data;

    const started_at = localNow();

    await pool.execute(
      `INSERT INTO exam_attempts
         (id, exam_schedule_id, student_id, status, started_at, deadline_at,
          question_order, ip_address, user_agent)
       VALUES (UUID(), ?, ?, 'in_progress', ?, ?, ?, ?, ?)`,
      [exam_schedule_id, student_id, started_at, deadline_at,
       question_order ? JSON.stringify(question_order) : null,
       ip_address || null, user_agent || null]
    );

    return this.findByScheduleAndStudent(exam_schedule_id, student_id);
  }

  static async findByScheduleAndStudent(exam_schedule_id, student_id) {
    const [rows] = await pool.execute(
      `SELECT ${ATTEMPT_COLS},
              st.full_name AS student_name,
              st.student_number
       FROM exam_attempts ea
       LEFT JOIN students st ON ea.student_id = st.id
       WHERE ea.exam_schedule_id = ? AND ea.student_id = ?`,
      [exam_schedule_id, student_id]
    );
    return rows[0] || null;
  }

  /**
   * Cari attempt yang relevan untuk hari ini:
   * - Prioritas: submitted/graded/timed_out (sudah selesai) DULU
   * - Fallback: in_progress (bisa dilanjutkan)
   * - Attempt timed_out atau finished dari hari LAIN diabaikan agar bisa mulai baru
   */
  static async findRelevantByScheduleAndStudent(exam_schedule_id, student_id) {
    const today = localDate();
    const [rows] = await pool.execute(
      `SELECT ${ATTEMPT_COLS},
              st.full_name AS student_name,
              st.student_number
       FROM exam_attempts ea
       LEFT JOIN students st ON ea.student_id = st.id
       WHERE ea.exam_schedule_id = ?
         AND ea.student_id       = ?
         AND (
           ea.status = 'in_progress'
           OR (ea.status IN ('submitted', 'graded', 'timed_out') AND DATE(ea.started_at) = ?)
         )
       ORDER BY
         CASE ea.status
           WHEN 'graded'    THEN 0
           WHEN 'submitted' THEN 1
           WHEN 'timed_out' THEN 2
           WHEN 'in_progress' THEN 3
           ELSE 4
         END ASC,
         ea.created_at DESC
       LIMIT 1`,
      [exam_schedule_id, student_id, today]
    );
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT ${ATTEMPT_COLS},
              st.full_name AS student_name,
              st.student_number,
              DATE_FORMAT(es.exam_date,  '%Y-%m-%d') AS exam_date,
              TIME_FORMAT(es.start_time, '%H:%i')    AS start_time,
              TIME_FORMAT(es.end_time,   '%H:%i')    AS end_time,
              es.question_set_id,
              qs.duration_minutes,
              qs.show_result,
              qs.passing_score,
              qs.shuffle_questions,
              qs.shuffle_options
       FROM exam_attempts ea
       LEFT JOIN students       st ON ea.student_id        = st.id
       LEFT JOIN exam_schedules es ON ea.exam_schedule_id  = es.id
       LEFT JOIN question_sets  qs ON es.question_set_id   = qs.id
       WHERE ea.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async findBySchedule(exam_schedule_id) {
    const [rows] = await pool.execute(
      `SELECT ${ATTEMPT_COLS},
              st.full_name    AS student_name,
              st.student_number,
              st.gender
       FROM exam_attempts ea
       LEFT JOIN students st ON ea.student_id = st.id
       WHERE ea.exam_schedule_id = ?
       ORDER BY st.full_name ASC`,
      [exam_schedule_id]
    );
    return rows;
  }

  static async submit(id) {
    const submitted_at = localNow();
    await pool.execute(
      `UPDATE exam_attempts
       SET status = 'submitted', submitted_at = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'in_progress'`,
      [submitted_at, id]
    );
    return this.findById(id);
  }

  static async timeout(id) {
    const submitted_at = localNow();
    await pool.execute(
      `UPDATE exam_attempts
       SET status = 'timed_out', submitted_at = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'in_progress'`,
      [submitted_at, id]
    );
    return this.findById(id);
  }

  static async updateScores(id, { objective_score, essay_score, total_score }) {
    await pool.execute(
      `UPDATE exam_attempts
       SET objective_score = ?, essay_score = ?, total_score = ?,
           status = 'graded', updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [objective_score ?? null, essay_score ?? null, total_score ?? null, id]
    );
    return this.findById(id);
  }

  static async incrementTabSwitch(id) {
    await pool.execute(
      `UPDATE exam_attempts
       SET tab_switch_count = tab_switch_count + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [id]
    );
  }
}

module.exports = ExamAttemptModel;
