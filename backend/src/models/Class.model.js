const pool = require('../config/database');

class ClassModel {
  static async create(data) {
    const {
      academic_year_id, major_id = null, homeroom_teacher_id = null,
      name, grade_level, capacity = null, is_active = true
    } = data;

    await pool.execute(
      `INSERT INTO classes (id, academic_year_id, major_id, homeroom_teacher_id, name, grade_level, capacity, is_active)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)`,
      [academic_year_id, major_id, homeroom_teacher_id, name, grade_level, capacity, is_active]
    );

    const [rows] = await pool.execute(
      `SELECT c.*,
              ay.name AS academic_year_name,
              m.code  AS major_code,
              m.name  AS major_name,
              t.full_name AS homeroom_teacher_name
       FROM classes c
       LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
       LEFT JOIN majors m ON c.major_id = m.id
       LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
       WHERE c.academic_year_id = ? AND c.name = ?`,
      [academic_year_id, name]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT c.*,
              ay.name AS academic_year_name,
              m.code  AS major_code,
              m.name  AS major_name,
              t.full_name AS homeroom_teacher_name
       FROM classes c
       LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
       LEFT JOIN majors m ON c.major_id = m.id
       LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
       WHERE c.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async findByYearAndName(academic_year_id, name) {
    const [rows] = await pool.execute(
      `SELECT * FROM classes WHERE academic_year_id = ? AND name = ?`,
      [academic_year_id, name]
    );
    return rows[0] || null;
  }

  static async findAll(filters = {}, { limit = 10, offset = 0 } = {}) {
    const where = [];
    const params = [];

    if (filters.search) {
      where.push('c.name LIKE ?');
      params.push(`%${filters.search}%`);
    }
    if (filters.academic_year_id) {
      where.push('c.academic_year_id = ?');
      params.push(filters.academic_year_id);
    }
    if (filters.major_id) {
      where.push('c.major_id = ?');
      params.push(filters.major_id);
    }
    if (filters.grade_level) {
      where.push('c.grade_level = ?');
      params.push(filters.grade_level);
    }
    if (filters.is_active !== undefined) {
      where.push('c.is_active = ?');
      params.push(filters.is_active);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [rows] = await pool.execute(
      `SELECT c.*,
              ay.name AS academic_year_name,
              m.code  AS major_code,
              m.name  AS major_name,
              t.full_name AS homeroom_teacher_name,
              (SELECT COUNT(*) FROM class_students cs WHERE cs.class_id = c.id) AS student_count
       FROM classes c
       LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
       LEFT JOIN majors m ON c.major_id = m.id
       LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
       ${whereClause}
       ORDER BY c.grade_level ASC, c.name ASC
       LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      params
    );
    return rows;
  }

  static async count(filters = {}) {
    const where = [];
    const params = [];

    if (filters.search) {
      where.push('c.name LIKE ?');
      params.push(`%${filters.search}%`);
    }
    if (filters.academic_year_id) {
      where.push('c.academic_year_id = ?');
      params.push(filters.academic_year_id);
    }
    if (filters.major_id) {
      where.push('c.major_id = ?');
      params.push(filters.major_id);
    }
    if (filters.grade_level) {
      where.push('c.grade_level = ?');
      params.push(filters.grade_level);
    }
    if (filters.is_active !== undefined) {
      where.push('c.is_active = ?');
      params.push(filters.is_active);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM classes c ${whereClause}`,
      params
    );
    return rows[0].total;
  }

  static async update(id, data) {
    const fields = [];
    const params = [];
    const allowed = [
      'academic_year_id', 'major_id', 'homeroom_teacher_id',
      'name', 'grade_level', 'capacity', 'is_active'
    ];

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
      `UPDATE classes SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.execute(
      `DELETE FROM classes WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = ClassModel;
