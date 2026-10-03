const pool = require('../config/database');

class ClassStudentModel {
  /**
   * Add a student to a class
   */
  static async addStudent(class_id, student_id) {
    await pool.execute(
      `INSERT INTO class_students (id, class_id, student_id) VALUES (UUID(), ?, ?)`,
      [class_id, student_id]
    );
    const [rows] = await pool.execute(
      `SELECT cs.*,
              s.student_number, s.full_name AS student_name, s.gender,
              u.email
       FROM class_students cs
       JOIN students s ON cs.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE cs.class_id = ? AND cs.student_id = ?`,
      [class_id, student_id]
    );
    return rows[0];
  }

  /**
   * Check if student is already in this class
   */
  static async findByClassAndStudent(class_id, student_id) {
    const [rows] = await pool.execute(
      `SELECT * FROM class_students WHERE class_id = ? AND student_id = ?`,
      [class_id, student_id]
    );
    return rows[0] || null;
  }

  /**
   * Get students enrolled in a class (with pagination)
   */
  static async findStudentsByClass(class_id, filters = {}, { limit = 10, offset = 0 } = {}) {
    const where = ['cs.class_id = ?'];
    const params = [class_id];

    if (filters.search) {
      where.push('(s.full_name LIKE ? OR s.student_number LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const whereClause = 'WHERE ' + where.join(' AND ');

    const [rows] = await pool.execute(
      `SELECT cs.id, cs.class_id, cs.student_id, cs.created_at,
              s.student_number, s.full_name AS student_name, s.gender, s.enrollment_year,
              u.email, u.is_active
       FROM class_students cs
       JOIN students s ON cs.student_id = s.id
       JOIN users u ON s.user_id = u.id
       ${whereClause}
       ORDER BY s.full_name ASC
       LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      params
    );
    return rows;
  }

  static async countStudentsByClass(class_id, filters = {}) {
    const where = ['cs.class_id = ?'];
    const params = [class_id];

    if (filters.search) {
      where.push('(s.full_name LIKE ? OR s.student_number LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const whereClause = 'WHERE ' + where.join(' AND ');

    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM class_students cs
       JOIN students s ON cs.student_id = s.id
       ${whereClause}`,
      params
    );
    return rows[0].total;
  }

  /**
   * Get classes a student is enrolled in
   */
  static async findClassesByStudent(student_id) {
    const [rows] = await pool.execute(
      `SELECT cs.*,
              c.name AS class_name, c.grade_level,
              ay.name AS academic_year_name,
              m.code AS major_code, m.name AS major_name
       FROM class_students cs
       JOIN classes c ON cs.class_id = c.id
       JOIN academic_years ay ON c.academic_year_id = ay.id
       LEFT JOIN majors m ON c.major_id = m.id
       WHERE cs.student_id = ?
       ORDER BY ay.start_date DESC`,
      [student_id]
    );
    return rows;
  }

  /**
   * Get students NOT yet in a given class (available to add)
   */
  static async findAvailableStudents(class_id, search = '') {
    const params = [class_id];
    let searchClause = '';

    if (search) {
      searchClause = 'AND (s.full_name LIKE ? OR s.student_number LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [rows] = await pool.execute(
      `SELECT s.id AS student_id, s.student_number, s.full_name AS student_name,
              s.gender, s.enrollment_year, u.email
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.id NOT IN (
         SELECT student_id FROM class_students WHERE class_id = ?
       )
       ${searchClause}
       ORDER BY s.full_name ASC
       LIMIT 50`,
      params
    );
    return rows;
  }

  /**
   * Remove a student from a class (by class_students.id)
   */
  static async removeById(id) {
    const [result] = await pool.execute(
      `DELETE FROM class_students WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Remove a student from a class (by class_id + student_id)
   */
  static async removeByClassAndStudent(class_id, student_id) {
    const [result] = await pool.execute(
      `DELETE FROM class_students WHERE class_id = ? AND student_id = ?`,
      [class_id, student_id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = ClassStudentModel;
