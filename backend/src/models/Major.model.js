const pool = require('../config/database');

class MajorModel {
  static async create(data) {
    const { code, name, description = null, is_active = true } = data;
    await pool.execute(
      `INSERT INTO majors (id, code, name, description, is_active)
       VALUES (UUID(), ?, ?, ?, ?)`,
      [code, name, description, is_active]
    );
    const [rows] = await pool.execute(
      `SELECT * FROM majors WHERE code = ?`,
      [code]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT * FROM majors WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async findByCode(code) {
    const [rows] = await pool.execute(
      `SELECT * FROM majors WHERE code = ?`,
      [code]
    );
    return rows[0] || null;
  }

  static async findAll(filters = {}, { limit = 10, offset = 0 } = {}) {
    const where = [];
    const params = [];

    if (filters.search) {
      where.push('(code LIKE ? OR name LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    if (filters.is_active !== undefined) {
      where.push('is_active = ?');
      params.push(filters.is_active);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [rows] = await pool.execute(
      `SELECT * FROM majors ${whereClause}
       ORDER BY name ASC
       LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      params
    );
    return rows;
  }

  static async count(filters = {}) {
    const where = [];
    const params = [];

    if (filters.search) {
      where.push('(code LIKE ? OR name LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    if (filters.is_active !== undefined) {
      where.push('is_active = ?');
      params.push(filters.is_active);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM majors ${whereClause}`,
      params
    );
    return rows[0].total;
  }

  static async update(id, data) {
    const fields = [];
    const params = [];
    const allowed = ['code', 'name', 'description', 'is_active'];

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
      `UPDATE majors SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.execute(
      `DELETE FROM majors WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = MajorModel;
