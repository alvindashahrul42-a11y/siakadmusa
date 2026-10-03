const pool = require('../config/database');

class AttendanceModel {
  static async upsert(data) {
    const { class_subject_id, student_id, attendance_date, status, notes = null } = data;

    // Use INSERT ... ON DUPLICATE KEY UPDATE for upsert
    await pool.execute(
      `INSERT INTO attendance (id, class_subject_id, student_id, attendance_date, status, notes)
       VALUES (UUID(), ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status), notes = VALUES(notes),
       updated_at = CURRENT_TIMESTAMP`,
      [class_subject_id, student_id, attendance_date, status, notes || null]
    );

    const [rows] = await pool.execute(
      `SELECT a.*,
              st.full_name AS student_name,
              st.student_number,
              s.name  AS subject_name,
              s.code  AS subject_code
       FROM attendance a
       LEFT JOIN students st ON a.student_id = st.id
       LEFT JOIN class_subjects cs ON a.class_subject_id = cs.id
       LEFT JOIN subjects s ON cs.subject_id = s.id
       WHERE a.class_subject_id = ? AND a.student_id = ? AND a.attendance_date = ?`,
      [class_subject_id, student_id, attendance_date]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT a.*,
              st.full_name AS student_name,
              st.student_number,
              s.name  AS subject_name,
              s.code  AS subject_code,
              c.name  AS class_name
       FROM attendance a
       LEFT JOIN students st ON a.student_id = st.id
       LEFT JOIN class_subjects cs ON a.class_subject_id = cs.id
       LEFT JOIN subjects s ON cs.subject_id = s.id
       LEFT JOIN classes  c ON cs.class_id = c.id
       WHERE a.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Get attendance for a class_subject on a specific date
   */
  static async findByClassSubjectAndDate(class_subject_id, attendance_date) {
    const [rows] = await pool.execute(
      `SELECT a.*,
              st.full_name AS student_name,
              st.student_number,
              st.gender
       FROM attendance a
       LEFT JOIN students st ON a.student_id = st.id
       WHERE a.class_subject_id = ? AND a.attendance_date = ?
       ORDER BY st.full_name ASC`,
      [class_subject_id, attendance_date]
    );
    return rows;
  }

  /**
   * Get attendance history for a class_subject (all dates)
   */
  static async findByClassSubject(class_subject_id, filters = {}, { limit = 50, offset = 0 } = {}) {
    const where = ['a.class_subject_id = ?'];
    const params = [class_subject_id];

    if (filters.student_id) {
      where.push('a.student_id = ?');
      params.push(filters.student_id);
    }
    if (filters.attendance_date) {
      where.push('a.attendance_date = ?');
      params.push(filters.attendance_date);
    }
    if (filters.status) {
      where.push('a.status = ?');
      params.push(filters.status);
    }

    const whereClause = 'WHERE ' + where.join(' AND ');

    const [rows] = await pool.execute(
      `SELECT a.*,
              st.full_name AS student_name,
              st.student_number,
              st.gender
       FROM attendance a
       LEFT JOIN students st ON a.student_id = st.id
       ${whereClause}
       ORDER BY a.attendance_date DESC, st.full_name ASC
       LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      params
    );
    return rows;
  }

  static async countByClassSubject(class_subject_id, filters = {}) {
    const where = ['a.class_subject_id = ?'];
    const params = [class_subject_id];

    if (filters.student_id) {
      where.push('a.student_id = ?');
      params.push(filters.student_id);
    }
    if (filters.attendance_date) {
      where.push('a.attendance_date = ?');
      params.push(filters.attendance_date);
    }
    if (filters.status) {
      where.push('a.status = ?');
      params.push(filters.status);
    }

    const whereClause = 'WHERE ' + where.join(' AND ');

    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM attendance a ${whereClause}`,
      params
    );
    return rows[0].total;
  }

  /**
   * Summary of attendance per student for a class_subject
   */
  static async summaryByClassSubject(class_subject_id) {
    const [rows] = await pool.execute(
      `SELECT
         st.id AS student_id,
         st.full_name AS student_name,
         st.student_number,
         COUNT(a.id) AS total_meetings,
         SUM(a.status = 'present')    AS present_count,
         SUM(a.status = 'late')       AS late_count,
         SUM(a.status = 'sick')       AS sick_count,
         SUM(a.status = 'permission') AS permission_count,
         SUM(a.status = 'absent')     AS absent_count
       FROM students st
       LEFT JOIN class_students cs_link ON cs_link.student_id = st.id
       LEFT JOIN class_subjects cs ON cs.class_id = cs_link.class_id
       LEFT JOIN attendance a ON a.student_id = st.id AND a.class_subject_id = cs.id
       WHERE cs.id = ?
       GROUP BY st.id, st.full_name, st.student_number
       ORDER BY st.full_name ASC`,
      [class_subject_id]
    );
    return rows;
  }

  static async delete(id) {
    const [result] = await pool.execute(
      `DELETE FROM attendance WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = AttendanceModel;
