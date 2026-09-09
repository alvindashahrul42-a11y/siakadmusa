const pool = require('../config/database');

class SchoolFacilityModel {
  /**
   * Convert database row to proper format (boolean conversion)
   */
  static formatFacility(row) {
    if (!row) return null;
    return {
      ...row,
      is_active: Boolean(row.is_active)
    };
  }

  /**
   * Get all facilities (with optional filter and pagination)
   */
  static async findAll(filters = {}, pagination = null) {
    try {
      let query = 'SELECT * FROM school_facilities WHERE 1=1';
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
      return rows.map(row => this.formatFacility(row));
    } catch (error) {
      throw new Error(`Failed to fetch facilities: ${error.message}`);
    }
  }

  /**
   * Get facility by ID
   */
  static async findById(id) {
    try {
      const query = 'SELECT * FROM school_facilities WHERE id = ?';
      const [rows] = await pool.execute(query, [id]);
      return this.formatFacility(rows[0]);
    } catch (error) {
      throw new Error(`Failed to fetch facility: ${error.message}`);
    }
  }

  /**
   * Create new facility
   */
  static async create(data) {
    try {
      const query = `
        INSERT INTO school_facilities (
          id, name, description, image, sort_order, is_active
        ) VALUES (UUID(), ?, ?, ?, ?, ?)
      `;

      await pool.execute(query, [
        data.name,
        data.description || null,
        data.image || null,
        data.sort_order || 0,
        data.is_active !== undefined ? data.is_active : true
      ]);

      const [newRows] = await pool.execute(
        'SELECT * FROM school_facilities ORDER BY created_at DESC LIMIT 1'
      );
      return this.formatFacility(newRows[0]);
    } catch (error) {
      throw new Error(`Failed to create facility: ${error.message}`);
    }
  }

  /**
   * Update facility
   */
  static async update(id, data) {
    try {
      const fields = [];
      const values = [];

      if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
      if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
      if (data.image !== undefined) { fields.push('image = ?'); values.push(data.image); }
      if (data.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(data.sort_order); }
      if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active); }

      fields.push('updated_at = CURRENT_TIMESTAMP');

      if (fields.length === 1) {
        return await this.findById(id);
      }

      values.push(id);
      const query = `UPDATE school_facilities SET ${fields.join(', ')} WHERE id = ?`;
      await pool.execute(query, values);

      return await this.findById(id);
    } catch (error) {
      throw new Error(`Failed to update facility: ${error.message}`);
    }
  }

  /**
   * Delete facility
   */
  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM school_facilities WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Failed to delete facility: ${error.message}`);
    }
  }

  /**
   * Check if facility exists
   */
  static async exists(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT COUNT(*) as count FROM school_facilities WHERE id = ?', [id]
      );
      return rows[0].count > 0;
    } catch (error) {
      throw new Error(`Failed to check facility existence: ${error.message}`);
    }
  }

  /**
   * Get total count
   */
  static async count(filters = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM school_facilities WHERE 1=1';
      const params = [];

      if (filters.is_active !== undefined) {
        query += ' AND is_active = ?';
        params.push(filters.is_active);
      }

      const [rows] = await pool.execute(query, params);
      return rows[0].total;
    } catch (error) {
      throw new Error(`Failed to count facilities: ${error.message}`);
    }
  }
}

module.exports = SchoolFacilityModel;
