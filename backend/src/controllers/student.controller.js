const StudentModel = require('../models/Student.model');
const UserModel = require('../models/User.model');
const { successResponse, successResponseWithPagination, errorResponse } = require('../utils/responseHelper');
const { validateUpdateStudent } = require('../validators/student.validator');
const { parsePaginationParams } = require('../utils/paginationHelper');

class StudentController {
  /**
   * Get all students
   * GET /api/students
   * @access Private (Admin/Superuser)
   */
  static async getAll(req, res) {
    try {
      const { search, class_name, major } = req.query;
      const { page, limit, offset } = parsePaginationParams(req.query);

      const filters = {};
      if (search)     filters.search = search;
      if (class_name) filters.class_name = class_name;
      if (major)      filters.major = major;

      const students = await StudentModel.findAll(filters, { limit, offset });
      const total = await StudentModel.count(filters);

      return successResponseWithPagination(
        res, 200, 'Students retrieved successfully',
        students,
        { page, limit, total }
      );
    } catch (error) {
      console.error('Get all students error:', error);
      return errorResponse(res, 500, 'Failed to retrieve students', error.message);
    }
  }

  /**
   * Get student by ID
   * GET /api/students/:id
   * @access Private (Admin/Superuser)
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const student = await StudentModel.findById(id);

      if (!student) {
        return errorResponse(res, 404, 'Student not found');
      }

      return successResponse(res, 200, 'Student retrieved successfully', { student });
    } catch (error) {
      console.error('Get student by ID error:', error);
      return errorResponse(res, 500, 'Failed to retrieve student', error.message);
    }
  }

  /**
   * Update student profile
   * PUT /api/students/:id
   * @access Private (Admin/Superuser)
   */
  static async update(req, res) {
    try {
      const { id } = req.params;

      const existing = await StudentModel.findById(id);
      if (!existing) {
        return errorResponse(res, 404, 'Student not found');
      }

      const validation = validateUpdateStudent(req.body);
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const {
        student_number, full_name, gender, birth_place,
        birth_date, phone, address, class_name, major, enrollment_year
      } = req.body;

      // Check student_number uniqueness if changing
      if (student_number && student_number !== existing.student_number) {
        const taken = await StudentModel.findByStudentNumber(student_number);
        if (taken) {
          return errorResponse(res, 409, 'Student number already exists');
        }
      }

      const updateData = {};
      if (student_number !== undefined) updateData.student_number = student_number;
      if (full_name !== undefined)      updateData.full_name = full_name;
      if (gender !== undefined)         updateData.gender = gender;
      if (birth_place !== undefined)    updateData.birth_place = birth_place;
      if (birth_date !== undefined)     updateData.birth_date = birth_date;
      if (phone !== undefined)          updateData.phone = phone;
      if (address !== undefined)        updateData.address = address;
      if (class_name !== undefined)     updateData.class_name = class_name;
      if (major !== undefined)          updateData.major = major;
      if (enrollment_year !== undefined) updateData.enrollment_year = enrollment_year;

      const updated = await StudentModel.update(id, updateData);

      return successResponse(res, 200, 'Student updated successfully', { student: updated });
    } catch (error) {
      console.error('Update student error:', error);
      return errorResponse(res, 500, 'Failed to update student', error.message);
    }
  }

  /**
   * Delete student
   * DELETE /api/students/:id
   * @access Private (Admin/Superuser)
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const existing = await StudentModel.findById(id);
      if (!existing) {
        return errorResponse(res, 404, 'Student not found');
      }

      await StudentModel.delete(id);

      return successResponse(res, 200, 'Student deleted successfully');
    } catch (error) {
      console.error('Delete student error:', error);
      return errorResponse(res, 500, 'Failed to delete student', error.message);
    }
  }
}

module.exports = StudentController;
