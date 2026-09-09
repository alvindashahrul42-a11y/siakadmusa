const pool = require('../config/database');

class SchoolActivityModel {
  /**
   * Convert database row to proper format
   */
  static formatActivity(row) {
    if (!row) return null;
    return {
      ...row,
      is_published: Boolean(row.is_published),
      activity_date: row.activity_date
        ? new Date(row.activity_date).toISOString().split('T')[0]
        : null,
    };
  }

  /**
   * Get all activities (with optional filter and pagination)
   */
  static async findAll(filters = {}, pagination = null) {
    try {
      let query = 'SELECT * FROM school_activities WHERE 1=1';
      const params = [];

      if (filters.is_published !== undefined) {
        query += ' AND is_published = ?';
        params.push(filters.is_published);
      }

      query += ' ORDER BY sort_order ASC, activity_date DESC, created_at DESC';

      if (pagination) {
        query += ' LIMIT ? OFFSET ?';
        params.push(pagination.limit, pagination.offset);
      }

      const [rows] = await pool.execute(query, params);
      return rows.map(row => this.formatActivity(row));
    } catch (error) {
      throw new Error(`Failed to fetch activities: ${error.message}`);
    }
  }

  /**
   * Get activity by ID
   */
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM school_activities WHERE id = ?',
        [id]
      );
      return this.formatActivity(rows[0]);
    } catch (error) {
      throw new Error(`Failed to fetch activity: ${error.message}`);
    }
  }

  /**
   * Create new activity
   */
  static async create(data) {
    try {
      const query = `
        INSERT INTO school_activities (
          id, title, description, image, activity_date, sort_order, is_published
        ) VALUES (UUID(), ?, ?, ?, ?, ?, ?)
      `;

      await pool.execute(query, [
        data.title,
        data.description || null,
        data.image || null,
        data.activity_date || null,
        data.sort_order !== undefined ? data.sort_order : 0,
        data.is_published !== undefined ? data.is_published : true,
      ]);

      const [newRows] = await pool.execute(
        'SELECT * FROM school_activities ORDER BY created_at DESC LIMIT 1'
      );
      return this.formatActivity(newRows[0]);
    } catch (error) {
      throw new Error(`Failed to create activity: ${error.message}`);
    }
  }

  /**
   * Update activity
   */
  static async update(id, data) {
    try {
      const fields = [];
      const values = [];

      if (data.title !== undefined)         { fields.push('title = ?');         values.push(data.title); }
      if (data.description !== undefined)   { fields.push('description = ?');   values.push(data.description); }
      if (data.image !== undefined)         { fields.push('image = ?');         values.push(data.image); }
      if (data.activity_date !== undefined) { fields.push('activity_date = ?'); values.push(data.activity_date || null); }
      if (data.sort_order !== undefined)    { fields.push('sort_order = ?');    values.push(data.sort_order); }
      if (data.is_published !== undefined)  { fields.push('is_published = ?');  values.push(data.is_published); }

      fields.push('updated_at = CURRENT_TIMESTAMP');

      if (fields.length === 1) {
        return await this.findById(id);
      }

      values.push(id);
      const query = `UPDATE school_activities SET ${fields.join(', ')} WHERE id = ?`;
      await pool.execute(query, values);

      return await this.findById(id);
    } catch (error) {
      throw new Error(`Failed to update activity: ${error.message}`);
    }
  }

  /**
   * Delete activity
   */
  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM school_activities WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Failed to delete activity: ${error.message}`);
    }
  }

  /**
   * Get total count
   */
  static async count(filters = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM school_activities WHERE 1=1';
      const params = [];

      if (filters.is_published !== undefined) {
        query += ' AND is_published = ?';
        params.push(filters.is_published);
      }

      const [rows] = await pool.execute(query, params);
      return rows[0].total;
    } catch (error) {
      throw new Error(`Failed to count activities: ${error.message}`);
    }
  }
}

module.exports = SchoolActivityModel;
