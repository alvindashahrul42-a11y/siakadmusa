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
   * Find role by name
   */
  static async findRoleByName(roleName) {
    const [rows] = await pool.execute(
      `SELECT id, name, description FROM roles WHERE name = ?`,
      [roleName]
    );
    
    return rows[0];
  }
}

module.exports = UserModel;
