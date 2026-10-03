const pool = require('../config/database');

class AcademicYearModel {
  static async create(data) {
    const { name, start_date, end_date, is_active = false } = data;
    await pool.execute(
      `INSERT INTO academic_years (id, name, start_date, end_date, is_active)
       VALUES (UUID(), ?, ?, ?, ?)`,
      [name, start_date, end_date, is_active]
    );
    const [rows] = await pool.execute(
      `SELECT * FROM academic_years WHERE name = ?`,
      [name]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT * FROM academic_years WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async findByName(name) {
    const [rows] = await pool.execute(
      `SELECT * FROM academic_years WHERE name = ?`,
      [name]
    );
    return rows[0] || null;
  }

  static async findAll(filters = {}, { limit = 10, offset = 0 } = {}) {
    const where = [];
    const params = [];

    if (filters.search) {
      where.push('name LIKE ?');
      params.push(`%${filters.search}%`);
    }
    if (filters.is_active !== undefined) {
      where.push('is_active = ?');
      params.push(filters.is_active);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [rows] = await pool.execute(
      `SELECT * FROM academic_years ${whereClause}
       ORDER BY start_date DESC
       LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      params
    );
    return rows;
  }

  static async count(filters = {}) {
    const where = [];
    const params = [];

    if (filters.search) {
      where.push('name LIKE ?');
      params.push(`%${filters.search}%`);
    }
    if (filters.is_active !== undefined) {
      where.push('is_active = ?');
      params.push(filters.is_active);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM academic_years ${whereClause}`,
      params
    );
    return rows[0].total;
  }

  static async update(id, data) {
    const fields = [];
    const params = [];
    const allowed = ['name', 'start_date', 'end_date', 'is_active'];

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
      `UPDATE academic_years SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    return this.findById(id);
  }

  /**
   * Deactivate all years then activate one (only one active at a time)
   */
  static async setActive(id) {
    await pool.execute(`UPDATE academic_years SET is_active = FALSE`);
    await pool.execute(`UPDATE academic_years SET is_active = TRUE WHERE id = ?`, [id]);
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.execute(
      `DELETE FROM academic_years WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = AcademicYearModel;
