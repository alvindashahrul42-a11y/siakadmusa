const UserModel = require('../models/User.model');
const StudentModel = require('../models/Student.model');
const TeacherModel = require('../models/Teacher.model');
const { generateToken } = require('../utils/jwtHelper');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { validateRegister, validateLogin } = require('../validators/auth.validator');

class AuthController {
  /**
   * Register new user
   * POST /api/auth/register
   */
  static async register(req, res) {
    try {
      const { 
        email, 
        password, 
        username, 
        role,
        // Optional profile data
        full_name,
        student_number,
        teacher_number,
        gender,
        birth_place,
        birth_date,
        phone,
        address,
        class_name,
        major,
        enrollment_year,
        subject
      } = req.body;

      // Validate input
      const validation = validateRegister(req.body);
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      // Check if email already exists
      const existingUserByEmail = await UserModel.findByEmail(email);
      if (existingUserByEmail) {
        return errorResponse(res, 409, 'Email already registered');
      }

      // Check if username already exists (if provided)
      if (username) {
        const existingUserByUsername = await UserModel.findByUsername(username);
        if (existingUserByUsername) {
          return errorResponse(res, 409, 'Username already taken');
        }
      }

      // Get role_id from role name
      const roleData = await UserModel.findRoleByName(role);
      if (!roleData) {
        return errorResponse(res, 400, 'Invalid role');
      }

      // Create user
      const userId = await UserModel.create({
        role_id: roleData.id,
        username: username || null,
        email,
        password
      });

      // Create profile based on role
      if (role === 'student' && student_number && full_name) {
        // Check if student number already exists
        const existingStudent = await StudentModel.findByStudentNumber(student_number);
        if (existingStudent) {
          return errorResponse(res, 409, 'Student number already exists');
        }

        await StudentModel.create({
          user_id: userId,
          student_number,
          full_name,
          gender: gender || null,
          birth_place: birth_place || null,
          birth_date: birth_date || null,
          phone: phone || null,
          address: address || null,
          class_name: class_name || null,
          major: major || null,
          enrollment_year: enrollment_year || null
        });
      }

      if (role === 'teacher' && teacher_number && full_name) {
        // Check if teacher number already exists
        const existingTeacher = await TeacherModel.findByTeacherNumber(teacher_number);
        if (existingTeacher) {
          return errorResponse(res, 409, 'Teacher number already exists');
        }

        await TeacherModel.create({
          user_id: userId,
          teacher_number,
          full_name,
          gender: gender || null,
          birth_place: birth_place || null,
          birth_date: birth_date || null,
          phone: phone || null,
          address: address || null,
          subject: subject || null
        });
      }

      // Get user data with relations
      const user = await UserModel.findByIdWithRelations(userId);

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role_name
      });

      return successResponse(res, 201, 'Registration successful', {
        token
      });

    } catch (error) {
      console.error('Register error:', error);
      return errorResponse(res, 500, 'Registration failed', error.message);
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate input
      const validation = validateLogin(req.body);
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      // Find user by email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return errorResponse(res, 401, 'Invalid email or password');
      }

      // Check if user is active
      if (!user.is_active) {
        return errorResponse(res, 403, 'Your account is inactive. Please contact administrator.');
      }

      // Verify password
      const isPasswordValid = await UserModel.comparePassword(password, user.password);
      if (!isPasswordValid) {
        return errorResponse(res, 401, 'Invalid email or password');
      }

      // Update last login
      await UserModel.updateLastLogin(user.id);

      // Get user with relations
      const userWithRelations = await UserModel.findByIdWithRelations(user.id);

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role_name
      });

      return successResponse(res, 200, 'Login successful', {
        token
      });

    } catch (error) {
      console.error('Login error:', error);
      return errorResponse(res, 500, 'Login failed', error.message);
    }
  }

  /**
   * Get current authenticated user
   * GET /api/auth/me
   */
  static async getCurrentUser(req, res) {
    try {
      // req.user sudah di-set oleh authenticate middleware
      const userId = req.user.id;

      // Get user with relations
      const user = await UserModel.findByIdWithRelations(userId);

      if (!user) {
        return errorResponse(res, 404, 'User not found');
      }

      return successResponse(res, 200, 'User data retrieved successfully', {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role_name,
          role_description: user.role_description,
          is_active: user.is_active,
          last_login_at: user.last_login_at,
          created_at: user.created_at,
          profile: user.profile || null
        }
      });

    } catch (error) {
      console.error('Get current user error:', error);
      return errorResponse(res, 500, 'Failed to retrieve user data', error.message);
    }
  }
}

module.exports = AuthController;
