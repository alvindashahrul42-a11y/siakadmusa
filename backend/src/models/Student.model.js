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
}

module.exports = StudentModel;
