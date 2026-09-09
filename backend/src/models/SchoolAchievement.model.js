const pool = require('../config/database');

class SchoolAchievementModel {
  /**
   * Convert database row to proper format (boolean conversion)
   */
  static formatAchievement(row) {
    if (!row) return null;
    return {
      ...row,
      is_published: Boolean(row.is_published)
    };
  }

  /**
   * Get all achievements (with optional filter and pagination)
   */
  static async findAll(filters = {}, pagination = null) {
    try {
      let query = 'SELECT * FROM school_achievements WHERE 1=1';
      const params = [];

      if (filters.is_published !== undefined) {
        query += ' AND is_published = ?';
        params.push(filters.is_published);
      }

      if (filters.category) {
        query += ' AND category = ?';
        params.push(filters.category);
      }

      if (filters.level) {
        query += ' AND level = ?';
        params.push(filters.level);
      }

      query += ' ORDER BY sort_order ASC, achievement_date DESC, created_at DESC';

      if (pagination) {
        query += ' LIMIT ? OFFSET ?';
        params.push(pagination.limit, pagination.offset);
      }

      const [rows] = await pool.execute(query, params);
      return rows.map(row => this.formatAchievement(row));
    } catch (error) {
      throw new Error(`Failed to fetch achievements: ${error.message}`);
    }
  }

  /**
   * Get achievement by ID
   */
  static async findById(id) {
    try {
      const query = 'SELECT * FROM school_achievements WHERE id = ?';
      const [rows] = await pool.execute(query, [id]);
      return this.formatAchievement(rows[0]);
    } catch (error) {
      throw new Error(`Failed to fetch achievement: ${error.message}`);
    }
  }

  /**
   * Create new achievement
   */
  static async create(data) {
    try {
      const query = `
        INSERT INTO school_achievements (
          id, title, description, category, level,
          student_name, achievement_date, image, sort_order, is_published
        ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await pool.execute(query, [
        data.title,
        data.description || null,
        data.category || null,
        data.level || null,
        data.student_name || null,
        data.achievement_date || null,
        data.image || null,
        data.sort_order !== undefined ? data.sort_order : 0,
        data.is_published !== undefined ? data.is_published : true
      ]);

      const [newRows] = await pool.execute(
        'SELECT * FROM school_achievements ORDER BY created_at DESC LIMIT 1'
      );
      return this.formatAchievement(newRows[0]);
    } catch (error) {
      throw new Error(`Failed to create achievement: ${error.message}`);
    }
  }

  /**
   * Update achievement
   */
  static async update(id, data) {
    try {
      const fields = [];
      const values = [];

      if (data.title !== undefined)            { fields.push('title = ?');            values.push(data.title); }
      if (data.description !== undefined)      { fields.push('description = ?');      values.push(data.description); }
      if (data.category !== undefined)         { fields.push('category = ?');         values.push(data.category); }
      if (data.level !== undefined)            { fields.push('level = ?');            values.push(data.level); }
      if (data.student_name !== undefined)     { fields.push('student_name = ?');     values.push(data.student_name); }
      if (data.achievement_date !== undefined) { fields.push('achievement_date = ?'); values.push(data.achievement_date); }
      if (data.image !== undefined)            { fields.push('image = ?');            values.push(data.image); }
      if (data.sort_order !== undefined)       { fields.push('sort_order = ?');       values.push(data.sort_order); }
      if (data.is_published !== undefined)     { fields.push('is_published = ?');     values.push(data.is_published); }

      fields.push('updated_at = CURRENT_TIMESTAMP');

      if (fields.length === 1) {
        return await this.findById(id);
      }

      values.push(id);
      const query = `UPDATE school_achievements SET ${fields.join(', ')} WHERE id = ?`;
      await pool.execute(query, values);

      return await this.findById(id);
    } catch (error) {
      throw new Error(`Failed to update achievement: ${error.message}`);
    }
  }

  /**
   * Delete achievement
   */
  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM school_achievements WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Failed to delete achievement: ${error.message}`);
    }
  }

  /**
   * Check if achievement exists
   */
  static async exists(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT COUNT(*) as count FROM school_achievements WHERE id = ?', [id]
      );
      return rows[0].count > 0;
    } catch (error) {
      throw new Error(`Failed to check achievement existence: ${error.message}`);
    }
  }

  /**
   * Get total count
   */
  static async count(filters = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM school_achievements WHERE 1=1';
      const params = [];

      if (filters.is_published !== undefined) {
        query += ' AND is_published = ?';
        params.push(filters.is_published);
      }

      if (filters.category) {
        query += ' AND category = ?';
        params.push(filters.category);
      }

      if (filters.level) {
        query += ' AND level = ?';
        params.push(filters.level);
      }

      const [rows] = await pool.execute(query, params);
      return rows[0].total;
    } catch (error) {
      throw new Error(`Failed to count achievements: ${error.message}`);
    }
  }
}

module.exports = SchoolAchievementModel;
