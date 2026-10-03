const pool = require('../config/database');

class GradeModel {
  /**
   * Upsert grade — create or update if student+class_subject exists
   */
  static async upsert(data) {
    const {
      class_subject_id, student_id,
      assignment_score = null, midterm_score = null,
      final_exam_score = null, final_score = null, notes = null
    } = data;

    await pool.execute(
      `INSERT INTO grades
         (id, class_subject_id, student_id, assignment_score, midterm_score, final_exam_score, final_score, notes)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         assignment_score  = VALUES(assignment_score),
         midterm_score     = VALUES(midterm_score),
         final_exam_score  = VALUES(final_exam_score),
         final_score       = VALUES(final_score),
         notes             = VALUES(notes),
         updated_at        = CURRENT_TIMESTAMP`,
      [class_subject_id, student_id,
       assignment_score, midterm_score, final_exam_score, final_score, notes]
    );

    const [rows] = await pool.execute(
      `SELECT g.*,
              st.full_name AS student_name,
              st.student_number,
              s.name  AS subject_name,
              s.code  AS subject_code
       FROM grades g
       LEFT JOIN students st ON g.student_id = st.id
       LEFT JOIN class_subjects cs ON g.class_subject_id = cs.id
       LEFT JOIN subjects s ON cs.subject_id = s.id
       WHERE g.class_subject_id = ? AND g.student_id = ?`,
      [class_subject_id, student_id]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT g.*,
              st.full_name AS student_name,
              st.student_number,
              s.name  AS subject_name,
              s.code  AS subject_code,
              c.name  AS class_name
       FROM grades g
       LEFT JOIN students st ON g.student_id = st.id
       LEFT JOIN class_subjects cs ON g.class_subject_id = cs.id
       LEFT JOIN subjects s ON cs.subject_id = s.id
       LEFT JOIN classes  c ON cs.class_id = c.id
       WHERE g.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async findByClassSubjectAndStudent(class_subject_id, student_id) {
    const [rows] = await pool.execute(
      `SELECT g.*,
              st.full_name AS student_name,
              st.student_number
       FROM grades g
       LEFT JOIN students st ON g.student_id = st.id
       WHERE g.class_subject_id = ? AND g.student_id = ?`,
      [class_subject_id, student_id]
    );
    return rows[0] || null;
  }

  /**
   * Get all grades for a class_subject
   */
  static async findByClassSubject(class_subject_id, { limit = 100, offset = 0 } = {}) {
    const [rows] = await pool.execute(
      `SELECT g.*,
              st.full_name AS student_name,
              st.student_number,
              st.gender
       FROM grades g
       LEFT JOIN students st ON g.student_id = st.id
       WHERE g.class_subject_id = ?
       ORDER BY st.full_name ASC
       LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      [class_subject_id]
    );
    return rows;
  }

  static async countByClassSubject(class_subject_id) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM grades WHERE class_subject_id = ?`,
      [class_subject_id]
    );
    return rows[0].total;
  }

  /**
   * Get grades for a student across all subjects in a class
   */
  static async findByStudentAndClass(student_id, class_id) {
    const [rows] = await pool.execute(
      `SELECT g.*,
              s.name  AS subject_name,
              s.code  AS subject_code,
              t.full_name AS teacher_name
       FROM grades g
       LEFT JOIN class_subjects cs ON g.class_subject_id = cs.id
       LEFT JOIN subjects  s ON cs.subject_id = s.id
       LEFT JOIN teachers  t ON cs.teacher_id = t.id
       WHERE g.student_id = ? AND cs.class_id = ?
       ORDER BY s.name ASC`,
      [student_id, class_id]
    );
    return rows;
  }

  static async update(id, data) {
    const fields = [];
    const params = [];
    const allowed = ['assignment_score', 'midterm_score', 'final_exam_score', 'final_score', 'notes'];

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
      `UPDATE grades SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.execute(
      `DELETE FROM grades WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = GradeModel;
