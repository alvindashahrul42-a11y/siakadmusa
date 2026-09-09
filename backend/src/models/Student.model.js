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
      class_name,
      major,
      enrollment_year
    } = studentData;
    
    const [result] = await pool.execute(
      `INSERT INTO students (
        id, user_id, student_number, full_name, gender, 
        birth_place, birth_date, phone, address,
        class_name, major, enrollment_year
      ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id, student_number, full_name, gender,
        birth_place, birth_date, phone, address,
        class_name, major, enrollment_year
      ]
    );
    
    // Get the created student ID
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
   * Find student by id
   */
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT 
        s.*,
        u.email,
        u.username,
        u.is_active,
        r.name AS role_name
       FROM students s
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE s.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Get all students with pagination and optional filters
   */
  static async findAll(filters = {}, { limit = 10, offset = 0 } = {}) {
    let where = [];
    let params = [];

    if (filters.search) {
      where.push('(s.full_name LIKE ? OR s.student_number LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    if (filters.class_name) {
      where.push('s.class_name = ?');
      params.push(filters.class_name);
    }
    if (filters.major) {
      where.push('s.major = ?');
      params.push(filters.major);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [rows] = await pool.execute(
      `SELECT 
        s.*,
        u.email,
        u.username,
        u.is_active,
        r.name AS role_name
       FROM students s
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN roles r ON u.role_id = r.id
       ${whereClause}
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
    let where = [];
    let params = [];

    if (filters.search) {
      where.push('(s.full_name LIKE ? OR s.student_number LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    if (filters.class_name) {
      where.push('s.class_name = ?');
      params.push(filters.class_name);
    }
    if (filters.major) {
      where.push('s.major = ?');
      params.push(filters.major);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM students s
       LEFT JOIN users u ON s.user_id = u.id
       ${whereClause}`,
      params
    );
    return rows[0].total;
  }

  /**
   * Update student profile
   */
  static async update(id, data) {
    const fields = [];
    const params = [];

    const allowed = [
      'student_number','full_name','gender','birth_place',
      'birth_date','phone','address','class_name','major','enrollment_year'
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
   * Delete student (will also cascade-delete user)
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
