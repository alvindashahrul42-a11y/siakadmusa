const pool = require('../config/database');

class SchoolProfileModel {
  /**
   * Get school profile (there should be only one record)
   */
  static async get() {
    try {
      const query = 'SELECT * FROM school_profile LIMIT 1';
      const [rows] = await pool.execute(query);
      
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to fetch school profile: ${error.message}`);
    }
  }

  /**
   * Create school profile
   */
  static async create(data) {
    try {
      const query = `
        INSERT INTO school_profile (
          id,
          school_name,
          tagline,
          description,
          logo,
          address,
          phone,
          email,
          website,
          vision,
          mission,
          instagram,
          facebook,
          youtube
        ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await pool.execute(query, [
        data.school_name,
        data.tagline || null,
        data.description || null,
        data.logo || null,
        data.address || null,
        data.phone || null,
        data.email || null,
        data.website || null,
        data.vision || null,
        data.mission || null,
        data.instagram || null,
        data.facebook || null,
        data.youtube || null
      ]);

      // Get the created record
      return await this.get();
    } catch (error) {
      throw new Error(`Failed to create school profile: ${error.message}`);
    }
  }

  /**
   * Update school profile
   */
  static async update(id, data) {
    try {
      const fields = [];
      const values = [];

      if (data.school_name !== undefined) {
        fields.push('school_name = ?');
        values.push(data.school_name);
      }
      if (data.tagline !== undefined) {
        fields.push('tagline = ?');
        values.push(data.tagline);
      }
      if (data.description !== undefined) {
        fields.push('description = ?');
        values.push(data.description);
      }
      if (data.logo !== undefined) {
        fields.push('logo = ?');
        values.push(data.logo);
      }
      if (data.address !== undefined) {
        fields.push('address = ?');
        values.push(data.address);
      }
      if (data.phone !== undefined) {
        fields.push('phone = ?');
        values.push(data.phone);
      }
      if (data.email !== undefined) {
        fields.push('email = ?');
        values.push(data.email);
      }
      if (data.website !== undefined) {
        fields.push('website = ?');
        values.push(data.website);
      }
      if (data.vision !== undefined) {
        fields.push('vision = ?');
        values.push(data.vision);
      }
      if (data.mission !== undefined) {
        fields.push('mission = ?');
        values.push(data.mission);
      }
      if (data.instagram !== undefined) {
        fields.push('instagram = ?');
        values.push(data.instagram);
      }
      if (data.facebook !== undefined) {
        fields.push('facebook = ?');
        values.push(data.facebook);
      }
      if (data.youtube !== undefined) {
        fields.push('youtube = ?');
        values.push(data.youtube);
      }

      // Always update updated_at
      fields.push('updated_at = CURRENT_TIMESTAMP');

      if (fields.length === 1) { // Only updated_at
        return await this.get();
      }

      values.push(id);

      const query = `
        UPDATE school_profile
        SET ${fields.join(', ')}
        WHERE id = ?
      `;

      await pool.execute(query, values);

      return await this.get();
    } catch (error) {
      throw new Error(`Failed to update school profile: ${error.message}`);
    }
  }

  /**
   * Delete school profile
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM school_profile WHERE id = ?';
      const [result] = await pool.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Failed to delete school profile: ${error.message}`);
    }
  }

  /**
   * Check if school profile exists
   */
  static async exists() {
    try {
      const query = 'SELECT COUNT(*) as count FROM school_profile';
      const [rows] = await pool.execute(query);
      return rows[0].count > 0;
    } catch (error) {
      throw new Error(`Failed to check school profile existence: ${error.message}`);
    }
  }
}

module.exports = SchoolProfileModel;
