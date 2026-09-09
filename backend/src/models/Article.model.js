const pool = require('../config/database');

class ArticleModel {
  /**
   * Format row to proper types
   */
  static formatArticle(row) {
    if (!row) return null;
    return {
      ...row,
      is_published: Boolean(row.is_published),
      published_at: row.published_at
        ? new Date(row.published_at).toISOString()
        : null,
    };
  }

  /**
   * Generate slug from title (unique check handled separately)
   */
  static generateSlug(title) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 200);
  }

  /**
   * Ensure slug is unique — appends -2, -3, ... if collision
   */
  static async ensureUniqueSlug(baseSlug, excludeId = null) {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const query = excludeId
        ? 'SELECT COUNT(*) as cnt FROM articles WHERE slug = ? AND id != ?'
        : 'SELECT COUNT(*) as cnt FROM articles WHERE slug = ?';
      const params = excludeId ? [slug, excludeId] : [slug];
      const [rows] = await pool.execute(query, params);
      if (rows[0].cnt === 0) break;
      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }

    return slug;
  }

  /**
   * Find all articles with optional filters + pagination
   */
  static async findAll(filters = {}, pagination = null) {
    try {
      let query = `
        SELECT a.*, u.username AS author_name
        FROM articles a
        LEFT JOIN users u ON a.author_id = u.id
        WHERE 1=1
      `;
      const params = [];

      if (filters.is_published !== undefined) {
        query += ' AND a.is_published = ?';
        params.push(filters.is_published);
      }

      if (filters.category) {
        query += ' AND a.category = ?';
        params.push(filters.category);
      }

      if (filters.search) {
        query += ' AND (a.title LIKE ? OR a.excerpt LIKE ?)';
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      query += ' ORDER BY a.published_at DESC, a.created_at DESC';

      if (pagination) {
        query += ' LIMIT ? OFFSET ?';
        params.push(pagination.limit, pagination.offset);
      }

      const [rows] = await pool.execute(query, params);
      return rows.map(row => this.formatArticle(row));
    } catch (error) {
      throw new Error(`Failed to fetch articles: ${error.message}`);
    }
  }

  /**
   * Find article by ID
   */
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        `SELECT a.*, u.username AS author_name
         FROM articles a
         LEFT JOIN users u ON a.author_id = u.id
         WHERE a.id = ?`,
        [id]
      );
      return this.formatArticle(rows[0]);
    } catch (error) {
      throw new Error(`Failed to fetch article: ${error.message}`);
    }
  }

  /**
   * Find article by slug
   */
  static async findBySlug(slug) {
    try {
      const [rows] = await pool.execute(
        `SELECT a.*, u.username AS author_name
         FROM articles a
         LEFT JOIN users u ON a.author_id = u.id
         WHERE a.slug = ?`,
        [slug]
      );
      return this.formatArticle(rows[0]);
    } catch (error) {
      throw new Error(`Failed to fetch article by slug: ${error.message}`);
    }
  }

  /**
   * Create new article
   */
  static async create(data) {
    try {
      const baseSlug = this.generateSlug(data.title);
      const slug = await this.ensureUniqueSlug(baseSlug);

      const publishedAt = data.is_published ? new Date() : null;

      const query = `
        INSERT INTO articles (
          id, title, slug, excerpt, content, thumbnail,
          category, author_id, published_at, is_published
        ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await pool.execute(query, [
        data.title,
        slug,
        data.excerpt || null,
        data.content || null,
        data.thumbnail || null,
        data.category || null,
        data.author_id || null,
        publishedAt,
        data.is_published !== undefined ? data.is_published : false,
      ]);

      const [newRows] = await pool.execute(
        'SELECT * FROM articles ORDER BY created_at DESC LIMIT 1'
      );
      return this.formatArticle(newRows[0]);
    } catch (error) {
      throw new Error(`Failed to create article: ${error.message}`);
    }
  }

  /**
   * Update article
   */
  static async update(id, data) {
    try {
      const fields = [];
      const values = [];

      if (data.title !== undefined) {
        fields.push('title = ?');
        values.push(data.title);

        // Regenerate slug when title changes
        const baseSlug = this.generateSlug(data.title);
        const newSlug = await this.ensureUniqueSlug(baseSlug, id);
        fields.push('slug = ?');
        values.push(newSlug);
      }

      if (data.excerpt !== undefined)   { fields.push('excerpt = ?');   values.push(data.excerpt); }
      if (data.content !== undefined)   { fields.push('content = ?');   values.push(data.content); }
      if (data.thumbnail !== undefined) { fields.push('thumbnail = ?'); values.push(data.thumbnail); }
      if (data.category !== undefined)  { fields.push('category = ?');  values.push(data.category); }

      if (data.is_published !== undefined) {
        fields.push('is_published = ?');
        values.push(data.is_published);

        // Set published_at when first published, clear when unpublished
        fields.push('published_at = ?');
        values.push(data.is_published ? new Date() : null);
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');

      if (fields.length === 1) {
        return await this.findById(id);
      }

      values.push(id);
      const query = `UPDATE articles SET ${fields.join(', ')} WHERE id = ?`;
      await pool.execute(query, values);

      return await this.findById(id);
    } catch (error) {
      throw new Error(`Failed to update article: ${error.message}`);
    }
  }

  /**
   * Delete article
   */
  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM articles WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Failed to delete article: ${error.message}`);
    }
  }

  /**
   * Count articles with optional filters
   */
  static async count(filters = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM articles WHERE 1=1';
      const params = [];

      if (filters.is_published !== undefined) {
        query += ' AND is_published = ?';
        params.push(filters.is_published);
      }

      if (filters.category) {
        query += ' AND category = ?';
        params.push(filters.category);
      }

      if (filters.search) {
        query += ' AND (title LIKE ? OR excerpt LIKE ?)';
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      const [rows] = await pool.execute(query, params);
      return rows[0].total;
    } catch (error) {
      throw new Error(`Failed to count articles: ${error.message}`);
    }
  }
}

module.exports = ArticleModel;
