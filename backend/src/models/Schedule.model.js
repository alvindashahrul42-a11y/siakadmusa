const pool = require('../config/database');

class ScheduleModel {
  static async create(data) {
    const { class_subject_id, day_of_week, start_time, end_time, room = null } = data;

    await pool.execute(
      `INSERT INTO schedules (id, class_subject_id, day_of_week, start_time, end_time, room)
       VALUES (UUID(), ?, ?, ?, ?, ?)`,
      [class_subject_id, day_of_week, start_time, end_time, room || null]
    );

    const [rows] = await pool.execute(
      `SELECT sc.*,
              s.code  AS subject_code,
              s.name  AS subject_name,
              t.full_name AS teacher_name,
              c.name  AS class_name,
              c.id    AS class_id
       FROM schedules sc
       LEFT JOIN class_subjects cs ON sc.class_subject_id = cs.id
       LEFT JOIN subjects  s ON cs.subject_id = s.id
       LEFT JOIN teachers  t ON cs.teacher_id = t.id
       LEFT JOIN classes   c ON cs.class_id   = c.id
       WHERE sc.class_subject_id = ? AND sc.day_of_week = ? AND sc.start_time = ?`,
      [class_subject_id, day_of_week, start_time]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT sc.*,
              s.code  AS subject_code,
              s.name  AS subject_name,
              t.full_name AS teacher_name,
              c.name  AS class_name,
              c.id    AS class_id
       FROM schedules sc
       LEFT JOIN class_subjects cs ON sc.class_subject_id = cs.id
       LEFT JOIN subjects  s ON cs.subject_id = s.id
       LEFT JOIN teachers  t ON cs.teacher_id = t.id
       LEFT JOIN classes   c ON cs.class_id   = c.id
       WHERE sc.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Get schedules by class_id (via class_subjects join)
   */
  static async findByClass(class_id, filters = {}) {
    const where = ['cs.class_id = ?'];
    const params = [class_id];

    if (filters.day_of_week) {
      where.push('sc.day_of_week = ?');
      params.push(filters.day_of_week);
    }

    const whereClause = 'WHERE ' + where.join(' AND ');

    const [rows] = await pool.execute(
      `SELECT sc.*,
              s.code  AS subject_code,
              s.name  AS subject_name,
              t.full_name AS teacher_name,
              c.name  AS class_name,
              c.id    AS class_id
       FROM schedules sc
       LEFT JOIN class_subjects cs ON sc.class_subject_id = cs.id
       LEFT JOIN subjects  s ON cs.subject_id = s.id
       LEFT JOIN teachers  t ON cs.teacher_id = t.id
       LEFT JOIN classes   c ON cs.class_id   = c.id
       ${whereClause}
       ORDER BY sc.day_of_week ASC, sc.start_time ASC`,
      params
    );
    return rows;
  }

  /**
   * Get schedules for a student — hanya kelas aktif tempat siswa terdaftar
   */
  static async findByStudent(student_id, filters = {}) {
    const where = ['cst.student_id = ?'];
    const params = [student_id];

    if (filters.day_of_week) {
      where.push('sc.day_of_week = ?');
      params.push(filters.day_of_week);
    }

    const whereClause = 'WHERE ' + where.join(' AND ');

    const [rows] = await pool.execute(
      `SELECT sc.*,
              s.code        AS subject_code,
              s.name        AS subject_name,
              t.full_name   AS teacher_name,
              c.name        AS class_name,
              c.id          AS class_id,
              ay.name       AS academic_year_name
       FROM schedules sc
       JOIN class_subjects  cs  ON sc.class_subject_id = cs.id
       JOIN class_students  cst ON cst.class_id        = cs.class_id
       JOIN subjects        s   ON cs.subject_id       = s.id
       JOIN classes         c   ON cs.class_id         = c.id
       JOIN academic_years  ay  ON c.academic_year_id  = ay.id
       LEFT JOIN teachers   t   ON cs.teacher_id       = t.id
       ${whereClause}
       ORDER BY sc.day_of_week ASC, sc.start_time ASC`,
      params
    );
    return rows;
  }

  /**
   * Get schedules by class_subject_id
   */
  static async findByClassSubject(class_subject_id) {    const [rows] = await pool.execute(
      `SELECT sc.*,
              s.code  AS subject_code,
              s.name  AS subject_name,
              t.full_name AS teacher_name,
              c.name  AS class_name,
              c.id    AS class_id
       FROM schedules sc
       LEFT JOIN class_subjects cs ON sc.class_subject_id = cs.id
       LEFT JOIN subjects  s ON cs.subject_id = s.id
       LEFT JOIN teachers  t ON cs.teacher_id = t.id
       LEFT JOIN classes   c ON cs.class_id   = c.id
       WHERE sc.class_subject_id = ?
       ORDER BY sc.day_of_week ASC, sc.start_time ASC`,
      [class_subject_id]
    );
    return rows;
  }

  static async update(id, data) {
    const fields = [];
    const params = [];
    const allowed = ['day_of_week', 'start_time', 'end_time', 'room'];

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
      `UPDATE schedules SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.execute(
      `DELETE FROM schedules WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = ScheduleModel;
