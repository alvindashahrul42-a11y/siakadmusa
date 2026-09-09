const TeacherModel = require('../models/Teacher.model');
const UserModel = require('../models/User.model');
const StudentModel = require('../models/Student.model');
const { successResponse, successResponseWithPagination, errorResponse } = require('../utils/responseHelper');
const { validateCreateTeacher, validateUpdateTeacher } = require('../validators/teacher.validator');
const { parsePaginationParams } = require('../utils/paginationHelper');

class TeacherController {
  /**
   * Create teacher (user account + teacher profile)
   * POST /api/teachers
   * @access Private (Admin/Superuser)
   */
  static async create(req, res) {
    try {
      const {
        email, password, username,
        teacher_number, full_name,
        gender, birth_place, birth_date,
        phone, address, subject
      } = req.body;

      const validation = validateCreateTeacher(req.body);
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      // Check email uniqueness
      const emailTaken = await UserModel.findByEmail(email);
      if (emailTaken) {
        return errorResponse(res, 409, 'Email already registered');
      }

      // Check username uniqueness if provided
      if (username) {
        const usernameTaken = await UserModel.findByUsername(username);
        if (usernameTaken) {
          return errorResponse(res, 409, 'Username already taken');
        }
      }

      // Check teacher number uniqueness
      const teacherNumberTaken = await TeacherModel.findByTeacherNumber(teacher_number);
      if (teacherNumberTaken) {
        return errorResponse(res, 409, 'Teacher number already exists');
      }

      // Get teacher role
      const roleData = await UserModel.findRoleByName('teacher');
      if (!roleData) {
        return errorResponse(res, 500, 'Teacher role not found in system');
      }

      // Create user account
      const userId = await UserModel.create({
        role_id: roleData.id,
        username: username || null,
        email,
        password
      });

      // Create teacher profile
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

      // Return full teacher data
      const teacher = await UserModel.findByIdWithRelations(userId);

      return successResponse(res, 201, 'Teacher created successfully', { teacher });
    } catch (error) {
      console.error('Create teacher error:', error);
      return errorResponse(res, 500, 'Failed to create teacher', error.message);
    }
  }

  /**
   * Get all teachers
   * GET /api/teachers
   * @access Private (Admin/Superuser)
   */
  static async getAll(req, res) {
    try {
      const { search, subject } = req.query;
      const { page, limit, offset } = parsePaginationParams(req.query);

      const filters = {};
      if (search)  filters.search = search;
      if (subject) filters.subject = subject;

      const teachers = await TeacherModel.findAll(filters, { limit, offset });
      const total = await TeacherModel.count(filters);

      return successResponseWithPagination(
        res, 200, 'Teachers retrieved successfully',
        teachers,
        { page, limit, total }
      );
    } catch (error) {
      console.error('Get all teachers error:', error);
      return errorResponse(res, 500, 'Failed to retrieve teachers', error.message);
    }
  }

  /**
   * Get teacher by ID
   * GET /api/teachers/:id
   * @access Private (Admin/Superuser)
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const teacher = await TeacherModel.findById(id);

      if (!teacher) {
        return errorResponse(res, 404, 'Teacher not found');
      }

      return successResponse(res, 200, 'Teacher retrieved successfully', { teacher });
    } catch (error) {
      console.error('Get teacher by ID error:', error);
      return errorResponse(res, 500, 'Failed to retrieve teacher', error.message);
    }
  }

  /**
   * Update teacher profile
   * PUT /api/teachers/:id
   * @access Private (Admin/Superuser)
   */
  static async update(req, res) {
    try {
      const { id } = req.params;

      const existing = await TeacherModel.findById(id);
      if (!existing) {
        return errorResponse(res, 404, 'Teacher not found');
      }

      const validation = validateUpdateTeacher(req.body);
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const {
        teacher_number, full_name, gender, birth_place,
        birth_date, phone, address, subject
      } = req.body;

      // Check teacher_number uniqueness if changing
      if (teacher_number && teacher_number !== existing.teacher_number) {
        const taken = await TeacherModel.findByTeacherNumber(teacher_number);
        if (taken) {
          return errorResponse(res, 409, 'Teacher number already exists');
        }
      }

      const updateData = {};
      if (teacher_number !== undefined) updateData.teacher_number = teacher_number;
      if (full_name !== undefined)      updateData.full_name = full_name;
      if (gender !== undefined)         updateData.gender = gender;
      if (birth_place !== undefined)    updateData.birth_place = birth_place;
      if (birth_date !== undefined)     updateData.birth_date = birth_date;
      if (phone !== undefined)          updateData.phone = phone;
      if (address !== undefined)        updateData.address = address;
      if (subject !== undefined)        updateData.subject = subject;

      const updated = await TeacherModel.update(id, updateData);

      return successResponse(res, 200, 'Teacher updated successfully', { teacher: updated });
    } catch (error) {
      console.error('Update teacher error:', error);
      return errorResponse(res, 500, 'Failed to update teacher', error.message);
    }
  }

  /**
   * Delete teacher
   * DELETE /api/teachers/:id
   * @access Private (Admin/Superuser)
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const existing = await TeacherModel.findById(id);
      if (!existing) {
        return errorResponse(res, 404, 'Teacher not found');
      }

      await TeacherModel.delete(id);

      return successResponse(res, 200, 'Teacher deleted successfully');
    } catch (error) {
      console.error('Delete teacher error:', error);
      return errorResponse(res, 500, 'Failed to delete teacher', error.message);
    }
  }
}

module.exports = TeacherController;
