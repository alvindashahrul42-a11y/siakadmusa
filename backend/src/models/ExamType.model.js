const pool = require('../config/database');

class ExamTypeModel {
  static async create(data) {
    const { code, name, description = null, is_active = true } = data;

    await pool.execute(
      `INSERT INTO exam_types (id, code, name, description, is_active)
       VALUES (UUID(), ?, ?, ?, ?)`,
      [code.trim().toUpperCase(), name.trim(), description || null, is_active ? 1 : 0]
    );

    const [rows] = await pool.execute(
      `SELECT * FROM exam_types WHERE code = ?`,
      [code.trim().toUpperCase()]
    );
    return rows[0];
  }

  static async findAll({ limit = 50, offset = 0, search = '' } = {}) {
    const params = [];
    let where = '';
    if (search) {
      where = 'WHERE (code LIKE ? OR name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [rows] = await pool.execute(
      `SELECT * FROM exam_types
       ${where}
       ORDER BY name ASC
       LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      params
    );
    return rows;
  }

  static async countAll({ search = '' } = {}) {
    const params = [];
    let where = '';
    if (search) {
      where = 'WHERE (code LIKE ? OR name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM exam_types ${where}`,
      params
    );
    return rows[0].total;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT * FROM exam_types WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async findByCode(code) {
    const [rows] = await pool.execute(
      `SELECT * FROM exam_types WHERE code = ?`,
      [code.trim().toUpperCase()]
    );
    return rows[0] || null;
  }

  static async findAllActive() {
    const [rows] = await pool.execute(
      `SELECT * FROM exam_types WHERE is_active = TRUE ORDER BY name ASC`
    );
    return rows;
  }

  static async update(id, data) {
    const fields = [];
    const params = [];
    const allowed = ['code', 'name', 'description', 'is_active'];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        if (key === 'code') params.push(data[key].trim().toUpperCase());
        else if (key === 'name') params.push(data[key].trim());
        else params.push(data[key]);
      }
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await pool.execute(
      `UPDATE exam_types SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.execute(
      `DELETE FROM exam_types WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = ExamTypeModel;
