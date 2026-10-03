const ActivityLogModel = require('../models/ActivityLog.model');
const { successResponse, successResponseWithPagination, errorResponse } = require('../utils/responseHelper');
const { parsePaginationParams } = require('../utils/paginationHelper');

class ActivityLogController {
  /**
   * GET /api/activity-logs
   */
  static async getAll(req, res) {
    try {
      const { user_id, action, module, method, device_type, date_from, date_to, search } = req.query;
      const { page, limit, offset } = parsePaginationParams(req.query);

      const filters = {};
      if (user_id)     filters.user_id     = user_id;
      if (action)      filters.action      = action;
      if (module)      filters.module      = module;
      if (method)      filters.method      = method.toUpperCase();
      if (device_type) filters.device_type = device_type;
      if (date_from)   filters.date_from   = date_from;
      if (date_to)     filters.date_to     = date_to;
      if (search)      filters.search      = search;

      const logs  = await ActivityLogModel.findAll(filters, { limit, offset });
      const total = await ActivityLogModel.count(filters);

      return successResponseWithPagination(
        res, 200, 'Activity logs retrieved successfully',
        logs, { page, limit, total }
      );
    } catch (error) {
      console.error('Get activity logs error:', error);
      return errorResponse(res, 500, 'Failed to retrieve activity logs', error.message);
    }
  }

  /**
   * GET /api/activity-logs/:id
   */
  static async getById(req, res) {
    try {
      const log = await ActivityLogModel.findById(req.params.id);
      if (!log) return errorResponse(res, 404, 'Log tidak ditemukan');
      return successResponse(res, 200, 'Log berhasil dimuat', { log });
    } catch (error) {
      console.error('Get log by ID error:', error);
      return errorResponse(res, 500, 'Gagal memuat log', error.message);
    }
  }

  /**
   * DELETE /api/activity-logs/:id
   */
  static async deleteById(req, res) {
    try {
      const deleted = await ActivityLogModel.deleteById(req.params.id);
      if (!deleted) return errorResponse(res, 404, 'Log tidak ditemukan');
      return successResponse(res, 200, 'Log berhasil dihapus');
    } catch (error) {
      console.error('Delete log error:', error);
      return errorResponse(res, 500, 'Gagal menghapus log', error.message);
    }
  }

  /**
   * DELETE /api/activity-logs/purge  — hapus log lama
   * Query param: days (default 90)
   */
  static async purge(req, res) {
    try {
      const days = parseInt(req.query.days) || 90;
      if (days < 1) return errorResponse(res, 400, 'Parameter days harus >= 1');
      const deleted = await ActivityLogModel.deleteOlderThan(days);
      return successResponse(res, 200, `${deleted} log lama berhasil dihapus`, { deleted, days });
    } catch (error) {
      console.error('Purge logs error:', error);
      return errorResponse(res, 500, 'Gagal membersihkan log', error.message);
    }
  }
}

module.exports = ActivityLogController;
