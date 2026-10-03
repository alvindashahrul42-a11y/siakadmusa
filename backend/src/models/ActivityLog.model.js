const pool = require('../config/database');

class ActivityLogModel {
  /**
   * Write a new log entry (fire-and-forget safe — never throws)
   */
  static async create(data) {
    try {
      const {
        user_id      = null,
        action,
        module,
        description  = null,
        ip_address   = null,
        user_agent   = null,
        method       = null,
        endpoint     = null,
        status_code  = null,
        browser      = null,
        os           = null,
        device_type  = null,
        request_body = null,  // JSON string — sanitized (no passwords)
        old_data     = null,  // JSON string — data before change
      } = data;

      await pool.execute(
        `INSERT INTO activity_logs
           (id, user_id, action, module, description,
            ip_address, user_agent, method, endpoint,
            status_code, browser, os, device_type,
            request_body, old_data)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id, action, module, description,
          ip_address, user_agent, method, endpoint,
          status_code, browser, os, device_type,
          request_body, old_data,
        ]
      );
    } catch (err) {
      console.error('[ActivityLog] Failed to write log:', err.message);
    }
  }

  static async findAll(filters = {}, { limit = 20, offset = 0 } = {}) {
    const where = [];
    const params = [];

    if (filters.user_id) {
      where.push('al.user_id = ?');
      params.push(filters.user_id);
    }
    if (filters.action) {
      where.push('al.action = ?');
      params.push(filters.action);
    }
    if (filters.module) {
      where.push('al.module LIKE ?');
      params.push(`%${filters.module}%`);
    }
    if (filters.method) {
      where.push('al.method = ?');
      params.push(filters.method);
    }
    if (filters.device_type) {
      where.push('al.device_type = ?');
      params.push(filters.device_type);
    }
    if (filters.date_from) {
      where.push('DATE(al.created_at) >= ?');
      params.push(filters.date_from);
    }
    if (filters.date_to) {
      where.push('DATE(al.created_at) <= ?');
      params.push(filters.date_to);
    }
    if (filters.search) {
      where.push('(al.description LIKE ? OR al.endpoint LIKE ? OR u.email LIKE ? OR u.username LIKE ?)');
      const s = `%${filters.search}%`;
      params.push(s, s, s, s);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [rows] = await pool.execute(
      `SELECT
         al.id,
         al.user_id,
         al.action,
         al.module,
         al.description,
         al.ip_address,
         al.user_agent,
         al.method,
         al.endpoint,
         al.status_code,
         al.browser,
         al.os,
         al.device_type,
         al.request_body,
         al.old_data,
         al.created_at,
         u.email    AS user_email,
         u.username AS user_username,
         r.name     AS user_role
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       LEFT JOIN roles r ON u.role_id  = r.id
       ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      params
    );
    return rows;
  }

  static async count(filters = {}) {
    const where = [];
    const params = [];

    if (filters.user_id)    { where.push('al.user_id = ?');       params.push(filters.user_id); }
    if (filters.action)     { where.push('al.action = ?');         params.push(filters.action); }
    if (filters.module)     { where.push('al.module LIKE ?');      params.push(`%${filters.module}%`); }
    if (filters.method)     { where.push('al.method = ?');         params.push(filters.method); }
    if (filters.device_type){ where.push('al.device_type = ?');    params.push(filters.device_type); }
    if (filters.date_from)  { where.push('DATE(al.created_at) >= ?'); params.push(filters.date_from); }
    if (filters.date_to)    { where.push('DATE(al.created_at) <= ?'); params.push(filters.date_to); }
    if (filters.search) {
      where.push('(al.description LIKE ? OR al.endpoint LIKE ? OR u.email LIKE ? OR u.username LIKE ?)');
      const s = `%${filters.search}%`;
      params.push(s, s, s, s);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${whereClause}`,
      params
    );
    return rows[0].total;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT
         al.*,
         u.email    AS user_email,
         u.username AS user_username,
         r.name     AS user_role
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       LEFT JOIN roles r ON u.role_id  = r.id
       WHERE al.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async deleteOlderThan(days = 90) {
    const [result] = await pool.execute(
      `DELETE FROM activity_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days]
    );
    return result.affectedRows;
  }

  static async deleteById(id) {
    const [result] = await pool.execute(
      `DELETE FROM activity_logs WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = ActivityLogModel;
