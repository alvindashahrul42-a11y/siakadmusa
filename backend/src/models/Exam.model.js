const pool = require('../config/database');

class ExamModel {
  static async create(data) {
    const {
      academic_year_id, exam_type_id, name,
      semester, start_date, end_date,
      is_published = false, notes = null,
    } = data;

    await pool.execute(
      `INSERT INTO exams
         (id, academic_year_id, exam_type_id, name, semester, start_date, end_date, is_published, notes)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)`,
      [academic_year_id, exam_type_id, name.trim(), semester, start_date, end_date,
       is_published ? 1 : 0, notes || null]
    );

    const [rows] = await pool.execute(
      `SELECT e.id, e.academic_year_id, e.exam_type_id, e.name, e.semester,
              DATE_FORMAT(e.start_date, '%Y-%m-%d') AS start_date,
              DATE_FORMAT(e.end_date,   '%Y-%m-%d') AS end_date,
              e.is_published, e.notes, e.created_at, e.updated_at,
              ay.name  AS academic_year_name,
              et.code  AS exam_type_code,
              et.name  AS exam_type_name
       FROM exams e
       LEFT JOIN academic_years ay ON e.academic_year_id = ay.id
       LEFT JOIN exam_types     et ON e.exam_type_id     = et.id
       WHERE e.academic_year_id = ? AND e.exam_type_id = ? AND e.semester = ?
       ORDER BY e.created_at DESC LIMIT 1`,
      [academic_year_id, exam_type_id, semester]
    );
    return rows[0];
  }

  static async findAll({ limit = 20, offset = 0, search = '', academic_year_id = '', semester = '' } = {}) {
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push('(e.name LIKE ? OR et.name LIKE ? OR et.code LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (academic_year_id) {
      conditions.push('e.academic_year_id = ?');
      params.push(academic_year_id);
    }
    if (semester) {
      conditions.push('e.semester = ?');
      params.push(semester);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const [rows] = await pool.execute(
      `SELECT e.id, e.academic_year_id, e.exam_type_id, e.name, e.semester,
              DATE_FORMAT(e.start_date, '%Y-%m-%d') AS start_date,
              DATE_FORMAT(e.end_date,   '%Y-%m-%d') AS end_date,
              e.is_published, e.notes, e.created_at, e.updated_at,
              ay.name  AS academic_year_name,
              et.code  AS exam_type_code,
              et.name  AS exam_type_name,
              (SELECT COUNT(*) FROM exam_schedules es WHERE es.exam_id = e.id) AS schedule_count
       FROM exams e
       LEFT JOIN academic_years ay ON e.academic_year_id = ay.id
       LEFT JOIN exam_types     et ON e.exam_type_id     = et.id
       ${where}
       ORDER BY e.start_date DESC, e.name ASC
       LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      params
    );
    return rows;
  }

  static async countAll({ search = '', academic_year_id = '', semester = '' } = {}) {
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push('(e.name LIKE ? OR et.name LIKE ? OR et.code LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (academic_year_id) {
      conditions.push('e.academic_year_id = ?');
      params.push(academic_year_id);
    }
    if (semester) {
      conditions.push('e.semester = ?');
      params.push(semester);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM exams e
       LEFT JOIN exam_types et ON e.exam_type_id = et.id
       ${where}`,
      params
    );
    return rows[0].total;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT e.id, e.academic_year_id, e.exam_type_id, e.name, e.semester,
              DATE_FORMAT(e.start_date, '%Y-%m-%d') AS start_date,
              DATE_FORMAT(e.end_date,   '%Y-%m-%d') AS end_date,
              e.is_published, e.notes, e.created_at, e.updated_at,
              ay.name  AS academic_year_name,
              et.code  AS exam_type_code,
              et.name  AS exam_type_name,
              (SELECT COUNT(*) FROM exam_schedules es WHERE es.exam_id = e.id) AS schedule_count
       FROM exams e
       LEFT JOIN academic_years ay ON e.academic_year_id = ay.id
       LEFT JOIN exam_types     et ON e.exam_type_id     = et.id
       WHERE e.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async update(id, data) {
    const fields = [];
    const params = [];
    const allowed = ['name', 'semester', 'start_date', 'end_date', 'is_published', 'notes',
                     'academic_year_id', 'exam_type_id'];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(key === 'name' ? data[key].trim() : data[key]);
      }
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await pool.execute(
      `UPDATE exams SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.execute(
      `DELETE FROM exams WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  static async togglePublished(id) {
    await pool.execute(
      `UPDATE exams SET is_published = NOT is_published, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );
    return this.findById(id);
  }
}

module.exports = ExamModel;
