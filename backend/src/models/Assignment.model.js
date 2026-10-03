const pool = require('../config/database');

class AssignmentModel {
  static async create(data) {
    const {
      class_subject_id, title, description = null,
      due_date = null, attachment = null, is_active = true
    } = data;

    await pool.execute(
      `INSERT INTO assignments (id, class_subject_id, title, description, due_date, attachment, is_active)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?)`,
      [class_subject_id, title.trim(), description || null, due_date || null, attachment || null, is_active ? 1 : 0]
    );

    const [rows] = await pool.execute(
      `SELECT a.*,
              s.name  AS subject_name,
              s.code  AS subject_code,
              c.name  AS class_name
       FROM assignments a
       LEFT JOIN class_subjects cs ON a.class_subject_id = cs.id
       LEFT JOIN subjects  s ON cs.subject_id = s.id
       LEFT JOIN classes   c ON cs.class_id   = c.id
       WHERE a.class_subject_id = ? AND a.title = ?
       ORDER BY a.created_at DESC LIMIT 1`,
      [class_subject_id, title.trim()]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT a.*,
              s.name  AS subject_name,
              s.code  AS subject_code,
              c.name  AS class_name
       FROM assignments a
       LEFT JOIN class_subjects cs ON a.class_subject_id = cs.id
       LEFT JOIN subjects  s ON cs.subject_id = s.id
       LEFT JOIN classes   c ON cs.class_id   = c.id
       WHERE a.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async findByClassSubject(class_subject_id, { limit = 50, offset = 0 } = {}) {
    const [rows] = await pool.execute(
      `SELECT a.*,
              s.name AS subject_name,
              s.code AS subject_code,
              c.name AS class_name
       FROM assignments a
       LEFT JOIN class_subjects cs ON a.class_subject_id = cs.id
       LEFT JOIN subjects s ON cs.subject_id = s.id
       LEFT JOIN classes  c ON cs.class_id   = c.id
       WHERE a.class_subject_id = ?
       ORDER BY a.due_date ASC, a.created_at DESC
       LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      [class_subject_id]
    );
    return rows;
  }

  static async countByClassSubject(class_subject_id) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM assignments WHERE class_subject_id = ?`,
      [class_subject_id]
    );
    return rows[0].total;
  }

  static async update(id, data) {
    const fields = [];
    const params = [];
    const allowed = ['title', 'description', 'due_date', 'attachment', 'is_active'];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(key === 'title' ? data[key].trim() : data[key]);
      }
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await pool.execute(
      `UPDATE assignments SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.execute(
      `DELETE FROM assignments WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = AssignmentModel;
