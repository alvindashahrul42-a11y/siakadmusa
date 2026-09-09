const pool = require('../config/database');

class TeacherModel {
  /**
   * Create new teacher profile
   */
  static async create(teacherData) {
    const {
      user_id,
      teacher_number,
      full_name,
      gender,
      birth_place,
      birth_date,
      phone,
      address,
      subject
    } = teacherData;
    
    const [result] = await pool.execute(
      `INSERT INTO teachers (
        id, user_id, teacher_number, full_name, gender,
        birth_place, birth_date, phone, address, subject
      ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id, teacher_number, full_name, gender,
        birth_place, birth_date, phone, address, subject
      ]
    );
    
    // Get the created teacher ID
    const [rows] = await pool.execute(
      `SELECT id FROM teachers WHERE user_id = ?`,
      [user_id]
    );
    
    return rows[0].id;
  }

  /**
   * Find teacher by teacher number
   */
  static async findByTeacherNumber(teacherNumber) {
    const [rows] = await pool.execute(
      `SELECT * FROM teachers WHERE teacher_number = ?`,
      [teacherNumber]
    );
    
    return rows[0];
  }

  /**
   * Find teacher by user_id
   */
  static async findByUserId(userId) {
    const [rows] = await pool.execute(
      `SELECT * FROM teachers WHERE user_id = ?`,
      [userId]
    );
    
    return rows[0];
  }

  /**
   * Find teacher by id
   */
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT 
        t.*,
        u.email,
        u.username,
        u.is_active,
        r.name AS role_name
       FROM teachers t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE t.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Get all teachers with pagination and optional filters
   */
  static async findAll(filters = {}, { limit = 10, offset = 0 } = {}) {
    let where = [];
    let params = [];

    if (filters.search) {
      where.push('(t.full_name LIKE ? OR t.teacher_number LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    if (filters.subject) {
      where.push('t.subject LIKE ?');
      params.push(`%${filters.subject}%`);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [rows] = await pool.execute(
      `SELECT 
        t.*,
        u.email,
        u.username,
        u.is_active,
        r.name AS role_name
       FROM teachers t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN roles r ON u.role_id = r.id
       ${whereClause}
       ORDER BY t.full_name ASC
       LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      params
    );
    return rows;
  }

  /**
   * Count teachers with filters
   */
  static async count(filters = {}) {
    let where = [];
    let params = [];

    if (filters.search) {
      where.push('(t.full_name LIKE ? OR t.teacher_number LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    if (filters.subject) {
      where.push('t.subject LIKE ?');
      params.push(`%${filters.subject}%`);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM teachers t
       LEFT JOIN users u ON t.user_id = u.id
       ${whereClause}`,
      params
    );
    return rows[0].total;
  }

  /**
   * Update teacher profile
   */
  static async update(id, data) {
    const fields = [];
    const params = [];

    const allowed = [
      'teacher_number','full_name','gender','birth_place',
      'birth_date','phone','address','subject'
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
      `UPDATE teachers SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    return this.findById(id);
  }

  /**
   * Delete teacher
   */
  static async delete(id) {
    const [result] = await pool.execute(
      `DELETE FROM teachers WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = TeacherModel;
