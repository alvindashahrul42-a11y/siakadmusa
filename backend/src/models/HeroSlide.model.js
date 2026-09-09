const pool = require('../config/database');

class HeroSlideModel {
  /**
   * Convert database row to proper format (boolean conversion)
   */
  static formatHeroSlide(row) {
    if (!row) return null;
    
    return {
      ...row,
      is_active: Boolean(row.is_active) // Convert 1/0 to true/false
    };
  }

  /**
   * Get all hero slides (with optional filter and pagination)
   * @param {Object} filters - Filter options { is_active }
   * @param {Object} pagination - Pagination options { limit, offset }
   */
  static async findAll(filters = {}, pagination = null) {
    try {
      let query = 'SELECT * FROM hero_slides WHERE 1=1';
      const params = [];

      if (filters.is_active !== undefined) {
        query += ' AND is_active = ?';
        params.push(filters.is_active);
      }

      query += ' ORDER BY sort_order ASC, created_at DESC';

      // Add pagination if provided
      if (pagination) {
        query += ` LIMIT ? OFFSET ?`;
        params.push(pagination.limit, pagination.offset);
      }

      const [rows] = await pool.execute(query, params);
      
      // Convert is_active from 1/0 to true/false
      return rows.map(row => this.formatHeroSlide(row));
    } catch (error) {
      throw new Error(`Failed to fetch hero slides: ${error.message}`);
    }
  }

  /**
   * Get hero slide by ID
   */
  static async findById(id) {
    try {
      const query = 'SELECT * FROM hero_slides WHERE id = ?';
      const [rows] = await pool.execute(query, [id]);
      
      return this.formatHeroSlide(rows[0]);
    } catch (error) {
      throw new Error(`Failed to fetch hero slide: ${error.message}`);
    }
  }

  /**
   * Create new hero slide
   */
  static async create(data) {
    try {
      const query = `
        INSERT INTO hero_slides (
          id,
          title,
          subtitle,
          description,
          image,
          sort_order,
          is_active
        ) VALUES (UUID(), ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await pool.execute(query, [
        data.title,
        data.subtitle || null,
        data.description || null,
        data.image,
        data.sort_order || 0,
        data.is_active !== undefined ? data.is_active : true
      ]);

      // Get the created record (using UUID, get by latest created_at)
      const [newRows] = await pool.execute(
        'SELECT * FROM hero_slides ORDER BY created_at DESC LIMIT 1'
      );

      return this.formatHeroSlide(newRows[0]);
    } catch (error) {
      throw new Error(`Failed to create hero slide: ${error.message}`);
    }
  }

  /**
   * Update hero slide
   */
  static async update(id, data) {
    try {
      const fields = [];
      const values = [];

      if (data.title !== undefined) {
        fields.push('title = ?');
        values.push(data.title);
      }
      if (data.subtitle !== undefined) {
        fields.push('subtitle = ?');
        values.push(data.subtitle);
      }
      if (data.description !== undefined) {
        fields.push('description = ?');
        values.push(data.description);
      }
      if (data.image !== undefined) {
        fields.push('image = ?');
        values.push(data.image);
      }
      if (data.sort_order !== undefined) {
        fields.push('sort_order = ?');
        values.push(data.sort_order);
      }
      if (data.is_active !== undefined) {
        fields.push('is_active = ?');
        values.push(data.is_active);
      }

      // Always update updated_at
      fields.push('updated_at = CURRENT_TIMESTAMP');

      if (fields.length === 1) { // Only updated_at
        return await this.findById(id);
      }

      values.push(id);

      const query = `
        UPDATE hero_slides
        SET ${fields.join(', ')}
        WHERE id = ?
      `;

      await pool.execute(query, values);

      return await this.findById(id);
    } catch (error) {
      throw new Error(`Failed to update hero slide: ${error.message}`);
    }
  }

  /**
   * Delete hero slide
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM hero_slides WHERE id = ?';
      const [result] = await pool.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Failed to delete hero slide: ${error.message}`);
    }
  }

  /**
   * Check if hero slide exists
   */
  static async exists(id) {
    try {
      const query = 'SELECT COUNT(*) as count FROM hero_slides WHERE id = ?';
      const [rows] = await pool.execute(query, [id]);
      return rows[0].count > 0;
    } catch (error) {
      throw new Error(`Failed to check hero slide existence: ${error.message}`);
    }
  }

  /**
   * Get total count
   */
  static async count(filters = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM hero_slides WHERE 1=1';
      const params = [];

      if (filters.is_active !== undefined) {
        query += ' AND is_active = ?';
        params.push(filters.is_active);
      }

      const [rows] = await pool.execute(query, params);
      return rows[0].total;
    } catch (error) {
      throw new Error(`Failed to count hero slides: ${error.message}`);
    }
  }
}

module.exports = HeroSlideModel;
