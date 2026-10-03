const pool = require('../config/database');

class StudentModel {
  /**
   * Create new student profile
   */
  static async create(studentData) {
    const {
      user_id,
      student_number,
      full_name,
      gender,
      birth_place,
      birth_date,
      phone,
      address,
      enrollment_year
    } = studentData;

    await pool.execute(
      `INSERT INTO students (
        id, user_id, student_number, full_name, gender,
        birth_place, birth_date, phone, address, enrollment_year
      ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id, student_number, full_name, gender,
        birth_place, birth_date, phone, address, enrollment_year
      ]
    );

    const [rows] = await pool.execute(
      `SELECT id FROM students WHERE user_id = ?`,
      [user_id]
    );
    return rows[0].id;
  }

  /**
   * Find student by student number
   */
  static async findByStudentNumber(studentNumber) {
    const [rows] = await pool.execute(
      `SELECT * FROM students WHERE student_number = ?`,
      [studentNumber]
    );
    return rows[0];
  }

  /**
   * Find student by user_id
   */
  static async findByUserId(userId) {
    const [rows] = await pool.execute(
      `SELECT * FROM students WHERE user_id = ?`,
      [userId]
    );
    return rows[0];
  }

  /**
   * Find student by id — joins most recent class (active year preferred)
   */
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT
        s.*,
        u.email,
        u.username,
        u.is_active,
        r.name  AS role_name,
        c.name  AS class_name,
        c.grade_level,
        m.code  AS major_code,
        m.name  AS major_name,
        ay.name AS academic_year_name,
        ay.is_active AS year_is_active
       FROM students s
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN roles r ON u.role_id  = r.id
       LEFT JOIN (
         SELECT cs_inner.student_id, cs_inner.class_id
         FROM class_students cs_inner
         INNER JOIN classes c_inner ON c_inner.id = cs_inner.class_id
         INNER JOIN academic_years ay_inner ON ay_inner.id = c_inner.academic_year_id
         WHERE (cs_inner.student_id, ay_inner.is_active, ay_inner.start_date) IN (
           SELECT cs2.student_id,
                  MAX(ay2.is_active),
                  MAX(ay2.start_date)
           FROM class_students cs2
           INNER JOIN classes c2 ON c2.id = cs2.class_id
           INNER JOIN academic_years ay2 ON ay2.id = c2.academic_year_id
           GROUP BY cs2.student_id
         )
       ) latest ON latest.student_id = s.id
       LEFT JOIN class_students cs ON cs.student_id = s.id AND cs.class_id = latest.class_id
       LEFT JOIN classes c  ON c.id  = cs.class_id
       LEFT JOIN majors m   ON m.id  = c.major_id
       LEFT JOIN academic_years ay ON ay.id = c.academic_year_id
       WHERE s.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Get all students with pagination and optional filters
   * Joins the most recent class for each student (active year first, fallback to latest)
   */
  static async findAll(filters = {}, { limit = 10, offset = 0 } = {}) {
    const where = [];
    const params = [];

    if (filters.search) {
      where.push('(s.full_name LIKE ? OR s.student_number LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    if (filters.class_id) {
      where.push('c.id = ?');
      params.push(filters.class_id);
    }
    if (filters.major_id) {
      where.push('c.major_id = ?');
      params.push(filters.major_id);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [rows] = await pool.execute(
      `SELECT
        s.*,
        u.email,
        u.username,
        u.is_active,
        r.name  AS role_name,
        c.name  AS class_name,
        c.grade_level,
        m.code  AS major_code,
        m.name  AS major_name,
        ay.name AS academic_year_name,
        ay.is_active AS year_is_active
       FROM students s
       LEFT JOIN users u  ON s.user_id = u.id
       LEFT JOIN roles r  ON u.role_id  = r.id
       LEFT JOIN (
         -- Pick ONE class per student: prefer active year, fallback to latest start_date
         SELECT cs_inner.student_id, cs_inner.class_id
         FROM class_students cs_inner
         INNER JOIN classes c_inner ON c_inner.id = cs_inner.class_id
         INNER JOIN academic_years ay_inner ON ay_inner.id = c_inner.academic_year_id
         WHERE (cs_inner.student_id, ay_inner.is_active, ay_inner.start_date) IN (
           SELECT cs2.student_id,
                  MAX(ay2.is_active),
                  MAX(ay2.start_date)
           FROM class_students cs2
           INNER JOIN classes c2 ON c2.id = cs2.class_id
           INNER JOIN academic_years ay2 ON ay2.id = c2.academic_year_id
           GROUP BY cs2.student_id
         )
       ) latest ON latest.student_id = s.id
       LEFT JOIN class_students cs ON cs.student_id = s.id AND cs.class_id = latest.class_id
       LEFT JOIN classes c  ON c.id  = cs.class_id
       LEFT JOIN majors m   ON m.id  = c.major_id
       LEFT JOIN academic_years ay ON ay.id = c.academic_year_id
       ${whereClause}
       GROUP BY s.id
       ORDER BY s.full_name ASC
       LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      params
    );
    return rows;
  }

  /**
   * Count students with filters
   */
  static async count(filters = {}) {
    const where = [];
    const params = [];

    if (filters.search) {
      where.push('(s.full_name LIKE ? OR s.student_number LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    if (filters.class_id) {
      where.push('c.id = ?');
      params.push(filters.class_id);
    }
    if (filters.major_id) {
      where.push('c.major_id = ?');
      params.push(filters.major_id);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [rows] = await pool.execute(
      `SELECT COUNT(DISTINCT s.id) AS total
       FROM students s
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN (
         SELECT cs_inner.student_id, cs_inner.class_id
         FROM class_students cs_inner
         INNER JOIN classes c_inner ON c_inner.id = cs_inner.class_id
         INNER JOIN academic_years ay_inner ON ay_inner.id = c_inner.academic_year_id
         WHERE (cs_inner.student_id, ay_inner.is_active, ay_inner.start_date) IN (
           SELECT cs2.student_id,
                  MAX(ay2.is_active),
                  MAX(ay2.start_date)
           FROM class_students cs2
           INNER JOIN classes c2 ON c2.id = cs2.class_id
           INNER JOIN academic_years ay2 ON ay2.id = c2.academic_year_id
           GROUP BY cs2.student_id
         )
       ) latest ON latest.student_id = s.id
       LEFT JOIN class_students cs ON cs.student_id = s.id AND cs.class_id = latest.class_id
       LEFT JOIN classes c ON c.id = cs.class_id
       ${whereClause}`,
      params
    );
    return rows[0].total;
  }

  /**
   * Update student profile (no class_name/major — those are in class_students)
   */
  static async update(id, data) {
    const fields = [];
    const params = [];

    const allowed = [
      'student_number', 'full_name', 'gender', 'birth_place',
      'birth_date', 'phone', 'address', 'enrollment_year'
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
      `UPDATE students SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    return this.findById(id);
  }

  /**
   * Delete student
   */
  static async delete(id) {
    const [result] = await pool.execute(
      `DELETE FROM students WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = StudentModel;
