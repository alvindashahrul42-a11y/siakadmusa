const pool = require('../config/database');

class ClassSubjectModel {
  /**
   * Assign a subject (+ optional teacher) to a class
   */
  static async create(data) {
    const { class_id, subject_id, teacher_id = null } = data;

    await pool.execute(
      `INSERT INTO class_subjects (id, class_id, subject_id, teacher_id)
       VALUES (UUID(), ?, ?, ?)`,
      [class_id, subject_id, teacher_id || null]
    );

    const [rows] = await pool.execute(
      `SELECT cs.*,
              s.code  AS subject_code,
              s.name  AS subject_name,
              t.full_name AS teacher_name,
              c.name  AS class_name
       FROM class_subjects cs
       LEFT JOIN subjects  s ON cs.subject_id = s.id
       LEFT JOIN teachers  t ON cs.teacher_id = t.id
       LEFT JOIN classes   c ON cs.class_id   = c.id
       WHERE cs.class_id = ? AND cs.subject_id = ?`,
      [class_id, subject_id]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT cs.*,
              s.code  AS subject_code,
              s.name  AS subject_name,
              t.full_name AS teacher_name,
              c.name  AS class_name
       FROM class_subjects cs
       LEFT JOIN subjects  s ON cs.subject_id = s.id
       LEFT JOIN teachers  t ON cs.teacher_id = t.id
       LEFT JOIN classes   c ON cs.class_id   = c.id
       WHERE cs.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async findByClassAndSubject(class_id, subject_id) {
    const [rows] = await pool.execute(
      `SELECT * FROM class_subjects WHERE class_id = ? AND subject_id = ?`,
      [class_id, subject_id]
    );
    return rows[0] || null;
  }

  static async findAllByClass(class_id, filters = {}, { limit = 100, offset = 0 } = {}) {
    const where = ['cs.class_id = ?'];
    const params = [class_id];

    if (filters.search) {
      where.push('(s.name LIKE ? OR s.code LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const whereClause = 'WHERE ' + where.join(' AND ');

    const [rows] = await pool.execute(
      `SELECT cs.*,
              s.code  AS subject_code,
              s.name  AS subject_name,
              t.full_name AS teacher_name,
              t.teacher_number,
              c.name  AS class_name,
              (SELECT COUNT(*) FROM grades g WHERE g.class_subject_id = cs.id) AS grade_count,
              (SELECT COUNT(*) FROM schedules sc WHERE sc.class_subject_id = cs.id) AS schedule_count
       FROM class_subjects cs
       LEFT JOIN subjects  s ON cs.subject_id = s.id
       LEFT JOIN teachers  t ON cs.teacher_id = t.id
       LEFT JOIN classes   c ON cs.class_id   = c.id
       ${whereClause}
       ORDER BY s.name ASC
       LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      params
    );
    return rows;
  }

  static async countByClass(class_id, filters = {}) {
    const where = ['class_id = ?'];
    const params = [class_id];

    if (filters.search) {
      where.push('(s.name LIKE ? OR s.code LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const whereClause = 'WHERE ' + where.join(' AND ');

    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM class_subjects cs
       LEFT JOIN subjects s ON cs.subject_id = s.id
       ${whereClause}`,
      params
    );
    return rows[0].total;
  }

  static async update(id, data) {
    const fields = [];
    const params = [];

    if (data.teacher_id !== undefined) {
      fields.push('teacher_id = ?');
      params.push(data.teacher_id || null);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await pool.execute(
      `UPDATE class_subjects SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.execute(
      `DELETE FROM class_subjects WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = ClassSubjectModel;
