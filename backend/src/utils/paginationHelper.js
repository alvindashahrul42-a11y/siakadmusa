/**
 * Pagination Helper Utilities
 */

/**
 * Parse and validate pagination parameters
 * @param {Object} query - Request query object
 * @returns {Object} { page, limit, offset }
 */
const parsePaginationParams = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  
  // Validate
  const validatedPage = page > 0 ? page : 1;
  const validatedLimit = limit > 0 && limit <= 100 ? limit : 10; // Max 100 items per page
  
  const offset = (validatedPage - 1) * validatedLimit;
  
  return {
    page: validatedPage,
    limit: validatedLimit,
    offset
  };
};

/**
 * Calculate pagination metadata
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items count
 * @returns {Object} Pagination metadata
 */
const calculatePaginationMetadata = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page: parseInt(page),
    limit: parseInt(limit),
    total: parseInt(total),
    total_pages: totalPages,
    has_next_page: page < totalPages,
    has_prev_page: page > 1
  };
};

/**
 * Build SQL LIMIT OFFSET clause
 * @param {number} limit - Items per page
 * @param {number} offset - Offset value
 * @returns {string} SQL clause
 */
const buildLimitOffsetClause = (limit, offset) => {
  return `LIMIT ${limit} OFFSET ${offset}`;
};

module.exports = {
  parsePaginationParams,
  calculatePaginationMetadata,
  buildLimitOffsetClause
};
