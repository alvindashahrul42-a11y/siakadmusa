const UserModel = require('../models/User.model');
const { successResponse, successResponseWithPagination, errorResponse } = require('../utils/responseHelper');
const { validateUpdateUser } = require('../validators/user.validator');
const { parsePaginationParams } = require('../utils/paginationHelper');

class UserController {
  /**
   * Get all users
   * GET /api/users
   * @access Private (Admin/Superuser)
   */
  static async getAll(req, res) {
    try {
      const { role, is_active, search } = req.query;
      const { page, limit, offset } = parsePaginationParams(req.query);

      const filters = {};
      if (role) filters.role = role;
      if (is_active !== undefined) filters.is_active = is_active === 'true' || is_active === '1';
      if (search) filters.search = search;

      const users = await UserModel.findAll(filters, { limit, offset });
      const total = await UserModel.count(filters);

      return successResponseWithPagination(
        res, 200, 'Users retrieved successfully',
        users,
        { page, limit, total }
      );
    } catch (error) {
      console.error('Get all users error:', error);
      return errorResponse(res, 500, 'Failed to retrieve users', error.message);
    }
  }

  /**
   * Get user by ID
   * GET /api/users/:id
   * @access Private (Admin/Superuser)
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const user = await UserModel.findByIdWithRelations(id);

      if (!user) {
        return errorResponse(res, 404, 'User not found');
      }

      return successResponse(res, 200, 'User retrieved successfully', {
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
      console.error('Get user by ID error:', error);
      return errorResponse(res, 500, 'Failed to retrieve user', error.message);
    }
  }

  /**
   * Update user
   * PUT /api/users/:id
   * @access Private (Admin/Superuser)
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { username, email, password, role, is_active } = req.body;

      const existingUser = await UserModel.findById(id);
      if (!existingUser) {
        return errorResponse(res, 404, 'User not found');
      }

      const validation = validateUpdateUser(req.body);
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      // Check email uniqueness if changing
      if (email && email !== existingUser.email) {
        const emailTaken = await UserModel.findByEmail(email);
        if (emailTaken) {
          return errorResponse(res, 409, 'Email already in use');
        }
      }

      // Check username uniqueness if changing
      if (username && username !== existingUser.username) {
        const usernameTaken = await UserModel.findByUsername(username);
        if (usernameTaken) {
          return errorResponse(res, 409, 'Username already taken');
        }
      }

      // Resolve role_id if role name provided
      let role_id;
      if (role) {
        const roleData = await UserModel.findRoleByName(role);
        if (!roleData) {
          return errorResponse(res, 400, 'Invalid role');
        }
        role_id = roleData.id;
      }

      const updateData = {};
      if (username !== undefined)   updateData.username = username;
      if (email !== undefined)      updateData.email = email;
      if (password !== undefined)   updateData.password = password;
      if (role_id !== undefined)    updateData.role_id = role_id;
      if (is_active !== undefined)  updateData.is_active = is_active === true || is_active === 'true' || is_active === 1 || is_active === '1';

      const updatedUser = await UserModel.update(id, updateData);

      return successResponse(res, 200, 'User updated successfully', { user: updatedUser });
    } catch (error) {
      console.error('Update user error:', error);
      return errorResponse(res, 500, 'Failed to update user', error.message);
    }
  }

  /**
   * Toggle user active status
   * PATCH /api/users/:id/toggle-active
   * @access Private (Admin/Superuser)
   */
  static async toggleActive(req, res) {
    try {
      const { id } = req.params;

      // Prevent self-deactivation
      if (id === req.user.id) {
        return errorResponse(res, 400, 'Cannot change your own active status');
      }

      const existingUser = await UserModel.findById(id);
      if (!existingUser) {
        return errorResponse(res, 404, 'User not found');
      }

      const updatedUser = await UserModel.update(id, { is_active: !existingUser.is_active });

      return successResponse(
        res, 200,
        `User ${updatedUser.is_active ? 'activated' : 'deactivated'} successfully`,
        { user: updatedUser }
      );
    } catch (error) {
      console.error('Toggle active error:', error);
      return errorResponse(res, 500, 'Failed to toggle user status', error.message);
    }
  }

  /**
   * Delete user
   * DELETE /api/users/:id
   * @access Private (Superuser only)
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;

      // Prevent self-deletion
      if (id === req.user.id) {
        return errorResponse(res, 400, 'Cannot delete your own account');
      }

      const existingUser = await UserModel.findById(id);
      if (!existingUser) {
        return errorResponse(res, 404, 'User not found');
      }

      await UserModel.delete(id);

      return successResponse(res, 200, 'User deleted successfully');
    } catch (error) {
      console.error('Delete user error:', error);
      return errorResponse(res, 500, 'Failed to delete user', error.message);
    }
  }
}

module.exports = UserController;
