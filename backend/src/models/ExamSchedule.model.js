const pool = require('../config/database');

// Shared SELECT columns — returns DATE/TIME as formatted strings so JSON serialises cleanly
const SELECT_COLS = `
  es.id, es.exam_id, es.class_subject_id, es.question_set_id,
  DATE_FORMAT(es.exam_date, '%Y-%m-%d')  AS exam_date,
  TIME_FORMAT(es.start_time, '%H:%i')    AS start_time,
  TIME_FORMAT(es.end_time,   '%H:%i')    AS end_time,
  es.room, es.notes, es.created_at, es.updated_at,
  s.name      AS subject_name,
  s.code      AS subject_code,
  c.name      AS class_name,
  c.grade_level,
  t.full_name AS teacher_name,
  qs.title    AS question_set_title,
  qs.duration_minutes,
  qs.status   AS question_set_status,
  (SELECT COUNT(*) FROM exam_supervisors sv WHERE sv.exam_schedule_id = es.id) AS supervisor_count,
  (SELECT COUNT(*) FROM exam_attempts   at WHERE at.exam_schedule_id  = es.id) AS attempt_count`;

const SELECT_COLS_FULL = `
  ${SELECT_COLS},
  e.name      AS exam_name,
  et.code     AS exam_type_code,
  et.name     AS exam_type_name,
  qs.passing_score,
  qs.show_result,
  qs.shuffle_questions,
  qs.shuffle_options`;

const JOINS = `
  FROM exam_schedules es
  LEFT JOIN class_subjects cs ON es.class_subject_id = cs.id
  LEFT JOIN subjects       s  ON cs.subject_id = s.id
  LEFT JOIN classes        c  ON cs.class_id   = c.id
  LEFT JOIN teachers       t  ON cs.teacher_id = t.id
  LEFT JOIN question_sets  qs ON es.question_set_id = qs.id`;

const JOINS_FULL = `
  FROM exam_schedules es
  LEFT JOIN class_subjects cs ON es.class_subject_id = cs.id
  LEFT JOIN subjects       s  ON cs.subject_id = s.id
  LEFT JOIN classes        c  ON cs.class_id   = c.id
  LEFT JOIN teachers       t  ON cs.teacher_id = t.id
  LEFT JOIN question_sets  qs ON es.question_set_id = qs.id
  LEFT JOIN exams      e  ON es.exam_id      = e.id
  LEFT JOIN exam_types et ON e.exam_type_id  = et.id`;

class ExamScheduleModel {
  static async create(data) {
    const {
      exam_id, class_subject_id, question_set_id = null,
      exam_date, start_time, end_time,
      room = null, notes = null,
    } = data;

    await pool.execute(
      `INSERT INTO exam_schedules
         (id, exam_id, class_subject_id, question_set_id, exam_date, start_time, end_time, room, notes)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)`,
      [exam_id, class_subject_id, question_set_id || null,
       exam_date, start_time, end_time, room || null, notes || null]
    );

    return this.findByExamAndClassSubject(exam_id, class_subject_id);
  }

  static async findByExamAndClassSubject(exam_id, class_subject_id) {
    const [rows] = await pool.execute(
      `SELECT ${SELECT_COLS} ${JOINS}
       WHERE es.exam_id = ? AND es.class_subject_id = ?`,
      [exam_id, class_subject_id]
    );
    return rows[0] || null;
  }

  static async findByExam(exam_id, { limit = 100, offset = 0, search = '' } = {}) {
    const params = [exam_id];
    let extra = '';
    if (search) {
      extra = 'AND (s.name LIKE ? OR s.code LIKE ? OR c.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [rows] = await pool.execute(
      `SELECT ${SELECT_COLS} ${JOINS}
       WHERE es.exam_id = ? ${extra}
       ORDER BY es.exam_date ASC, es.start_time ASC
       LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      params
    );
    return rows;
  }

  static async countByExam(exam_id, { search = '' } = {}) {
    const params = [exam_id];
    let extra = '';
    if (search) {
      extra = 'AND (s.name LIKE ? OR s.code LIKE ? OR c.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM exam_schedules es
       LEFT JOIN class_subjects cs ON es.class_subject_id = cs.id
       LEFT JOIN subjects       s  ON cs.subject_id = s.id
       LEFT JOIN classes        c  ON cs.class_id   = c.id
       WHERE es.exam_id = ? ${extra}`,
      params
    );
    return rows[0].total;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT ${SELECT_COLS_FULL} ${JOINS_FULL}
       WHERE es.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  // For student — find schedules available to take (published exam)
  static async findForStudent(student_id) {
    const [rows] = await pool.execute(
      `SELECT
         es.id,
         es.exam_id,
         es.class_subject_id,
         es.question_set_id,
         DATE_FORMAT(es.exam_date, '%Y-%m-%d') AS exam_date,
         TIME_FORMAT(es.start_time, '%H:%i')   AS start_time,
         TIME_FORMAT(es.end_time,   '%H:%i')   AS end_time,
         es.room,
         s.name      AS subject_name,
         s.code      AS subject_code,
         c.name      AS class_name,
         e.name      AS exam_name,
         et.code     AS exam_type_code,
         qs.title    AS question_set_title,
         qs.duration_minutes,
         lat.id           AS attempt_id,
         lat.status        AS attempt_status,
         lat.total_score,
         lat.submitted_at
       FROM exam_schedules es
       JOIN exams          e   ON es.exam_id          = e.id  AND e.is_published = TRUE
       JOIN exam_types     et  ON e.exam_type_id       = et.id
       JOIN class_subjects cs  ON es.class_subject_id  = cs.id
       JOIN subjects       s   ON cs.subject_id        = s.id
       JOIN classes        c   ON cs.class_id          = c.id
       JOIN class_students cst ON cst.class_id         = c.id AND cst.student_id = ?
       LEFT JOIN question_sets qs ON es.question_set_id = qs.id AND qs.status = 'ready'
       -- Ambil 1 attempt paling relevan per jadwal: prioritaskan status terminal
       LEFT JOIN exam_attempts lat ON lat.id = (
         SELECT a.id FROM exam_attempts a
         WHERE a.exam_schedule_id = es.id AND a.student_id = ?
         ORDER BY
           CASE a.status
             WHEN 'graded'      THEN 0
             WHEN 'submitted'   THEN 1
             WHEN 'timed_out'   THEN 2
             WHEN 'in_progress' THEN 3
             ELSE 4
           END ASC,
           a.created_at DESC
         LIMIT 1
       )
       ORDER BY es.exam_date ASC, es.start_time ASC`,
      [student_id, student_id]
    );
    return rows;
  }

  static async update(id, data) {
    const fields = [];
    const params = [];
    const allowed = ['exam_date', 'start_time', 'end_time', 'room', 'notes',
                     'class_subject_id', 'question_set_id'];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key]);
      }
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await pool.execute(
      `UPDATE exam_schedules SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.execute(
      `DELETE FROM exam_schedules WHERE id = ?`, [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = ExamScheduleModel;
