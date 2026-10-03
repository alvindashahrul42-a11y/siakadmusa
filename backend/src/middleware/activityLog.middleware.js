const ActivityLogModel = require('../models/ActivityLog.model');
const pool = require('../config/database');

// ── User-Agent parser ─────────────────────────────────────────────────────────

function parseBrowser(ua) {
  if (!ua) return 'Unknown';
  if (/Edg\/|EdgA\//.test(ua))                          return 'Edge';
  if (/OPR\/|Opera\//.test(ua))                          return 'Opera';
  if (/SamsungBrowser/.test(ua))                         return 'Samsung Browser';
  if (/UCBrowser/.test(ua))                              return 'UC Browser';
  if (/YaBrowser/.test(ua))                              return 'Yandex';
  if (/Firefox\//.test(ua))                              return 'Firefox';
  if (/Chrome\//.test(ua))                               return 'Chrome';
  if (/Safari\//.test(ua) && !/Chrome/.test(ua))         return 'Safari';
  if (/MSIE|Trident/.test(ua))                           return 'Internet Explorer';
  if (/curl\//.test(ua))                                 return 'curl';
  if (/python-requests/.test(ua))                        return 'Python';
  if (/Postman/.test(ua))                                return 'Postman';
  if (/insomnia/.test(ua))                               return 'Insomnia';
  return 'Unknown';
}

function parseOS(ua) {
  if (!ua) return 'Unknown';
  if (/Windows NT 10/.test(ua))   return 'Windows 10/11';
  if (/Windows NT 6\.3/.test(ua)) return 'Windows 8.1';
  if (/Windows NT 6\.2/.test(ua)) return 'Windows 8';
  if (/Windows NT 6\.1/.test(ua)) return 'Windows 7';
  if (/Windows/.test(ua))         return 'Windows';
  if (/iPhone|iPad/.test(ua))     return 'iOS';
  if (/Android/.test(ua))         return 'Android';
  if (/Mac OS X/.test(ua))        return 'macOS';
  if (/Linux/.test(ua))           return 'Linux';
  if (/CrOS/.test(ua))            return 'ChromeOS';
  return 'Unknown';
}

function parseDeviceType(ua) {
  if (!ua) return 'unknown';
  if (/bot|crawl|spider|slurp|mediapartners|googlebot|bingbot|facebookexternalhit/i.test(ua)) return 'bot';
  if (/Postman|insomnia|curl|python-requests|HTTPie/i.test(ua)) return 'api-client';
  if (/Mobile|Android.*Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return 'mobile';
  if (/iPad|Tablet|Kindle|Silk/i.test(ua)) return 'tablet';
  return 'desktop';
}

function resolveActionModule(method, urlPath) {
  const ACTION_MAP = { POST: 'CREATE', PUT: 'UPDATE', PATCH: 'UPDATE', DELETE: 'DELETE' };
  const action = ACTION_MAP[method] || method;
  const match  = urlPath.match(/^\/api\/([^/?]+)/);
  const module = match ? match[1].replace(/-/g, '_') : urlPath;
  return { action, module };
}

function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    '0.0.0.0'
  );
}

// ── Sensitive field masking ───────────────────────────────────────────────────

const SENSITIVE_KEYS = new Set(['password', 'token', 'secret', 'access_token', 'refresh_token', 'pin', 'otp']);

function sanitizeBody(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = SENSITIVE_KEYS.has(k.toLowerCase()) ? '***' : v;
  }
  return out;
}

function toJsonSafe(value) {
  if (value === null || value === undefined) return null;
  try { return JSON.stringify(value); } catch { return null; }
}

// ── Old-data fetcher ──────────────────────────────────────────────────────────

/**
 * Map URL pattern to table name for pre-fetch.
 * Only handles simple /:id patterns — complex nested routes return null.
 * /api/teachers/abc-123          → { table: 'teachers', id: 'abc-123' }
 * /api/classes/abc/students/xyz  → null (too complex, skip)
 */
function resolveTable(method, urlPath) {
  // Only fetch old data for PUT, PATCH, DELETE (need existing record)
  if (!['PUT', 'PATCH', 'DELETE'].includes(method)) return null;

  // Match: /api/<resource>/<uuid>  — no further segments
  const match = urlPath.match(/^\/api\/([^/]+)\/([^/]+)$/);
  if (!match) return null;

  const resourceMap = {
    'teachers':           'teachers',
    'students':           'students',
    'users':              'users',
    'classes':            'classes',
    'subjects':           'subjects',
    'majors':             'majors',
    'academic-years':     'academic_years',
    'hero-slides':        'hero_slides',
    'school-profile':     'school_profile',
    'school-facilities':  'school_facilities',
    'extracurriculars':   'extracurriculars',
    'school-activities':  'school_activities',
    'school-achievements':'school_achievements',
    'articles':           'articles',
    'school-programs':    'school_programs',
    'grades':             'grades',
    'schedules':          'schedules',
    'assignments':        'assignments',
    'ppdb':               'ppdb_registrations',
  };

  const resource = match[1];
  const id       = match[2];

  // Skip known non-UUID segments
  const NON_ID = new Set(['all', 'purge', 'bulk', 'summary', 'by-date', 'student']);
  if (NON_ID.has(id)) return null;

  const table = resourceMap[resource];
  if (!table) return null;

  return { table, id };
}

const HIDDEN_COLUMNS = new Set(['password', 'created_at', 'updated_at']);

async function fetchOldData(table, id) {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM \`${table}\` WHERE id = ? LIMIT 1`,
      [id]
    );
    if (!rows[0]) return null;

    // Remove sensitive / noisy columns
    const clean = {};
    for (const [k, v] of Object.entries(rows[0])) {
      if (!HIDDEN_COLUMNS.has(k)) clean[k] = v;
    }
    return clean;
  } catch {
    return null;
  }
}

// ── Middleware ─────────────────────────────────────────────────────────────────

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const SKIP_PATHS = [
  /^\/api\/activity-logs/,
  /^\/uploads\//,
  /^\/$/,
];

const activityLogMiddleware = async (req, res, next) => {
  if (!MUTATING_METHODS.has(req.method)) return next();
  if (SKIP_PATHS.some(p => p.test(req.path))) return next();

  // ── 1. Capture request body BEFORE handler runs ───────────────────────────
  const sanitizedBody = req.body && Object.keys(req.body).length > 0
    ? sanitizeBody(req.body)
    : null;

  // ── 2. Fetch OLD data BEFORE handler runs (PUT / PATCH / DELETE only) ─────
  let oldData = null;
  const tableInfo = resolveTable(req.method, req.path);
  if (tableInfo) {
    oldData = await fetchOldData(tableInfo.table, tableInfo.id);
  }

  // ── 3. Hook finish to write log AFTER response ────────────────────────────
  res.on('finish', async () => {
    try {
      const ua = req.headers['user-agent'] || '';
      const { action, module } = resolveActionModule(req.method, req.path);
      const userId   = req.user?.id    || null;
      const userName = req.user?.email || req.user?.username || 'anonymous';
      const description = `[${req.method}] ${req.path} — ${userName} → HTTP ${res.statusCode}`;

      await ActivityLogModel.create({
        user_id:      userId,
        action,
        module,
        description,
        ip_address:   getClientIP(req),
        user_agent:   ua,
        method:       req.method,
        endpoint:     req.originalUrl,
        status_code:  res.statusCode,
        browser:      parseBrowser(ua),
        os:           parseOS(ua),
        device_type:  parseDeviceType(ua),
        request_body: toJsonSafe(sanitizedBody),
        old_data:     toJsonSafe(oldData),
      });
    } catch {
      // Silent
    }
  });

  next();
};

module.exports = activityLogMiddleware;
