/**
 * Utility untuk membuat response API yang konsisten
 */

/**
 * Success response tanpa pagination (untuk single object atau simple list)
 */
const successResponse = (res, statusCode, message, data = null) => {
  const response = {
    success: true,
    message,
    status: statusCode,
    timestamp: new Date().toISOString(),
    ...(data && { data })
  };
  return res.status(statusCode).json(response);
};

/**
 * Success response dengan pagination metadata (untuk list data)
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {Array} data - Array of data items
 * @param {Object} pagination - Pagination info { page, limit, total }
 */
const successResponseWithPagination = (res, statusCode, message, data, pagination) => {
  const { page, limit, total } = pagination;
  const totalPages = Math.ceil(total / limit);

  const response = {
    success: true,
    message,
    status: statusCode,
    timestamp: new Date().toISOString(),
    data,
    metadata: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(total),
      total_pages: totalPages
    }
  };
  return res.status(statusCode).json(response);
};

/**
 * Error response
 */
const errorResponse = (res, statusCode, message, errors = null) => {
  const response = {
    success: false,
    message,
    status: statusCode,
    timestamp: new Date().toISOString(),
    ...(errors && { errors })
  };
  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  successResponseWithPagination,
  errorResponse
};
