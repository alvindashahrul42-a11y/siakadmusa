const { verifyToken } = require('../utils/jwtHelper');
const { errorResponse } = require('../utils/responseHelper');
const UserModel = require('../models/User.model');

/**
 * Middleware untuk verifikasi JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 401, 'Access token is required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);

    // Get user from database
    const user = await UserModel.findById(decoded.userId);

    if (!user) {
      return errorResponse(res, 401, 'User not found');
    }

    if (!user.is_active) {
      return errorResponse(res, 403, 'User account is inactive');
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role_name,
      role_id: user.role_id
    };

    next();
  } catch (error) {
    if (error.message === 'Invalid or expired token') {
      return errorResponse(res, 401, 'Invalid or expired token');
    }
    return errorResponse(res, 500, 'Authentication failed');
  }
};

/**
 * Middleware untuk authorization berdasarkan role
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, 'Unauthorized');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 403, 'Access denied. Insufficient permissions.');
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
