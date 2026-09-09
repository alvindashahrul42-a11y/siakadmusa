const pool = require('../config/database');

class ExtracurricularModel {
  /**
   * Convert database row to proper format (boolean conversion)
   */
  static formatExtracurricular(row) {
    if (!row) return null;
    return {
      ...row,
      is_active: Boolean(row.is_active)
    };
  }

  /**
   * Get all extracurriculars (with optional filter and pagination)
   */
  static async findAll(filters = {}, pagination = null) {
    try {
      let query = 'SELECT * FROM extracurriculars WHERE 1=1';
      const params = [];

      if (filters.is_active !== undefined) {
        query += ' AND is_active = ?';
        params.push(filters.is_active);
      }

      query += ' ORDER BY sort_order ASC, created_at DESC';

      if (pagination) {
        query += ' LIMIT ? OFFSET ?';
        params.push(pagination.limit, pagination.offset);
      }

      const [rows] = await pool.execute(query, params);
      return rows.map(row => this.formatExtracurricular(row));
    } catch (error) {
      throw new Error(`Failed to fetch extracurriculars: ${error.message}`);
    }
  }

  /**
   * Get extracurricular by ID
   */
  static async findById(id) {
    try {
      const query = 'SELECT * FROM extracurriculars WHERE id = ?';
      const [rows] = await pool.execute(query, [id]);
      return this.formatExtracurricular(rows[0]);
    } catch (error) {
      throw new Error(`Failed to fetch extracurricular: ${error.message}`);
    }
  }

  /**
   * Create new extracurricular
   */
  static async create(data) {
    try {
      const query = `
        INSERT INTO extracurriculars (
          id, name, image, sort_order, is_active
        ) VALUES (UUID(), ?, ?, ?, ?)
      `;

      await pool.execute(query, [
        data.name,
        data.image,
        data.sort_order || 0,
        data.is_active !== undefined ? data.is_active : true
      ]);

      const [newRows] = await pool.execute(
        'SELECT * FROM extracurriculars ORDER BY created_at DESC LIMIT 1'
      );
      return this.formatExtracurricular(newRows[0]);
    } catch (error) {
      throw new Error(`Failed to create extracurricular: ${error.message}`);
    }
  }

  /**
   * Update extracurricular
   */
  static async update(id, data) {
    try {
      const fields = [];
      const values = [];

      if (data.name !== undefined)       { fields.push('name = ?');       values.push(data.name); }
      if (data.image !== undefined)      { fields.push('image = ?');      values.push(data.image); }
      if (data.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(data.sort_order); }
      if (data.is_active !== undefined)  { fields.push('is_active = ?');  values.push(data.is_active); }

      fields.push('updated_at = CURRENT_TIMESTAMP');

      if (fields.length === 1) {
        return await this.findById(id);
      }

      values.push(id);
      const query = `UPDATE extracurriculars SET ${fields.join(', ')} WHERE id = ?`;
      await pool.execute(query, values);

      return await this.findById(id);
    } catch (error) {
      throw new Error(`Failed to update extracurricular: ${error.message}`);
    }
  }

  /**
   * Delete extracurricular
   */
  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM extracurriculars WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Failed to delete extracurricular: ${error.message}`);
    }
  }

  /**
   * Check if extracurricular exists
   */
  static async exists(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT COUNT(*) as count FROM extracurriculars WHERE id = ?', [id]
      );
      return rows[0].count > 0;
    } catch (error) {
      throw new Error(`Failed to check extracurricular existence: ${error.message}`);
    }
  }

  /**
   * Get total count
   */
  static async count(filters = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM extracurriculars WHERE 1=1';
      const params = [];

      if (filters.is_active !== undefined) {
        query += ' AND is_active = ?';
        params.push(filters.is_active);
      }

      const [rows] = await pool.execute(query, params);
      return rows[0].total;
    } catch (error) {
      throw new Error(`Failed to count extracurriculars: ${error.message}`);
    }
  }
}

module.exports = ExtracurricularModel;
