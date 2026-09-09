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
}

module.exports = TeacherModel;
