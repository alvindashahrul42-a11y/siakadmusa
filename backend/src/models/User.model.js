const pool = require('../config/database');
const bcrypt = require('bcrypt');

class UserModel {
  /**
   * Convert database row to proper format (boolean conversion)
   */
  static formatUser(row) {
    if (!row) return null;
    
    return {
      ...row,
      is_active: Boolean(row.is_active) // Convert 1/0 to true/false
    };
  }

  /**
   * Create new user
   */
  static async create(userData) {
    const { role_id, username, email, password } = userData;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.execute(
      `INSERT INTO users (id, role_id, username, email, password) 
       VALUES (UUID(), ?, ?, ?, ?)`,
      [role_id, username, email, hashedPassword]
    );
    
    // Get the created user ID
    const [rows] = await pool.execute(
      `SELECT id FROM users WHERE email = ?`,
      [email]
    );
    
    return rows[0].id;
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const [rows] = await pool.execute(
      `SELECT 
        u.id, 
        u.role_id, 
        u.username, 
        u.email, 
        u.password, 
        u.is_active,
        u.last_login_at,
        r.name as role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.email = ?`,
      [email]
    );
    
    return this.formatUser(rows[0]);
  }

  /**
   * Find user by id
   */
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT 
        u.id, 
        u.role_id, 
        u.username, 
        u.email, 
        u.is_active,
        u.last_login_at,
        u.created_at,
        r.name as role_name,
        r.description as role_description
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [id]
    );
    
    return this.formatUser(rows[0]);
  }

  /**
   * Find user by username
   */
  static async findByUsername(username) {
    const [rows] = await pool.execute(
      `SELECT 
        u.id, 
        u.role_id, 
        u.username, 
        u.email, 
        u.password, 
        u.is_active,
        r.name as role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.username = ?`,
      [username]
    );
    
    return this.formatUser(rows[0]);
  }

  /**
   * Update last login
   */
  static async updateLastLogin(userId) {
    await pool.execute(
      `UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [userId]
    );
  }

  /**
   * Compare password
   */
  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Get user with related data (student/teacher)
   */
  static async findByIdWithRelations(userId) {
    const user = await this.findById(userId);
    
    if (!user) return null;

    // Check if user is a student
    if (user.role_name === 'student') {
      const [students] = await pool.execute(
        `SELECT 
          id,
          student_number,
          full_name,
          gender,
          birth_place,
          birth_date,
          phone,
          address,
          class_name,
          major,
          enrollment_year
         FROM students 
         WHERE user_id = ?`,
        [userId]
      );
      
      if (students[0]) {
        user.profile = students[0];
      }
    }

    // Check if user is a teacher
    if (user.role_name === 'teacher') {
      const [teachers] = await pool.execute(
        `SELECT 
          id,
          teacher_number,
          full_name,
          gender,
          birth_place,
          birth_date,
          phone,
          address,
          subject
         FROM teachers 
         WHERE user_id = ?`,
        [userId]
      );
      
      if (teachers[0]) {
        user.profile = teachers[0];
      }
    }

    return user;
  }

  /**
   * Get all users with pagination and filters
   */
  static async findAll(filters = {}, { limit = 10, offset = 0 } = {}) {
    let where = ["r.name != 'superuser'"];
    let params = [];

    if (filters.role) {
      where.push('r.name = ?');
      params.push(filters.role);
    }
    if (filters.is_active !== undefined) {
      where.push('u.is_active = ?');
      params.push(filters.is_active ? 1 : 0);
    }
    if (filters.search) {
      where.push('(u.username LIKE ? OR u.email LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const whereClause = 'WHERE ' + where.join(' AND ');

    const [rows] = await pool.execute(
      `SELECT 
        u.id,
        u.username,
        u.email,
        u.is_active,
        u.last_login_at,
        u.created_at,
        u.updated_at,
        r.name AS role_name,
        r.description AS role_description
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      params
    );

    return rows.map(r => this.formatUser(r));
  }

  /**
   * Count users with filters
   */
  static async count(filters = {}) {
    let where = ["r.name != 'superuser'"];
    let params = [];

    if (filters.role) {
      where.push('r.name = ?');
      params.push(filters.role);
    }
    if (filters.is_active !== undefined) {
      where.push('u.is_active = ?');
      params.push(filters.is_active ? 1 : 0);
    }
    if (filters.search) {
      where.push('(u.username LIKE ? OR u.email LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const whereClause = 'WHERE ' + where.join(' AND ');

    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       ${whereClause}`,
      params
    );

    return rows[0].total;
  }

  /**
   * Update user
   */
  static async update(id, data) {
    const fields = [];
    const params = [];

    if (data.username !== undefined) { fields.push('username = ?'); params.push(data.username); }
    if (data.email !== undefined)    { fields.push('email = ?');    params.push(data.email); }
    if (data.password !== undefined) {
      const hashed = await bcrypt.hash(data.password, 10);
      fields.push('password = ?');
      params.push(hashed);
    }
    if (data.role_id !== undefined)  { fields.push('role_id = ?');  params.push(data.role_id); }
    if (data.is_active !== undefined){ fields.push('is_active = ?');params.push(data.is_active ? 1 : 0); }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await pool.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    return this.findById(id);
  }

  /**
   * Delete user
   */
  static async delete(id) {
    const [result] = await pool.execute(
      `DELETE FROM users WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Find role by name
   */
  static async findRoleByName(roleName) {
    const [rows] = await pool.execute(
      `SELECT id, name, description FROM roles WHERE name = ?`,
      [roleName]
    );
    
    return rows[0];
  }

  /**
   * Get all roles
   */
  static async findAllRoles() {
    const [rows] = await pool.execute(
      `SELECT id, name, description FROM roles ORDER BY name`
    );
    return rows;
  }
}

module.exports = UserModel;
