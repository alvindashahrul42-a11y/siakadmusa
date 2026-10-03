export type HttpMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'api-client' | 'bot' | 'unknown';
export type LogAction  = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  module: string;
  description: string | null;
  ip_address: string | null;
  user_agent: string | null;
  method: HttpMethod | null;
  endpoint: string | null;
  status_code: number | null;
  browser: string | null;
  os: string | null;
  device_type: DeviceType | null;
  request_body: string | null;  // JSON string — sanitized body sent by client
  old_data: string | null;      // JSON string — data before update/delete
  created_at: string;
  // joined
  user_email: string | null;
  user_username: string | null;
  user_role: string | null;
}

export interface ActivityLogListResponse {
  success: boolean;
  message: string;
  data: ActivityLog[];
  metadata: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// ── Display helpers ────────────────────────────────────────────────────────────

export const METHOD_COLORS: Record<string, string> = {
  POST:   'bg-emerald-100 text-emerald-700 border-emerald-200',
  PUT:    'bg-blue-100 text-blue-700 border-blue-200',
  PATCH:  'bg-violet-100 text-violet-700 border-violet-200',
  DELETE: 'bg-red-100 text-red-600 border-red-200',
};

export const ACTION_COLORS: Record<string, string> = {
  CREATE:  'bg-emerald-100 text-emerald-700',
  UPDATE:  'bg-blue-100 text-blue-700',
  DELETE:  'bg-red-100 text-red-600',
  LOGIN:   'bg-amber-100 text-amber-700',
  LOGOUT:  'bg-gray-100 text-gray-600',
};

export const DEVICE_ICONS: Record<string, string> = {
  desktop:    '🖥️',
  mobile:     '📱',
  tablet:     '📲',
  'api-client': '⚡',
  bot:        '🤖',
  unknown:    '❓',
};

export const STATUS_COLOR = (code: number | null): string => {
  if (!code) return 'text-gray-400';
  if (code < 300) return 'text-emerald-600 font-semibold';
  if (code < 400) return 'text-amber-600 font-semibold';
  if (code < 500) return 'text-orange-600 font-semibold';
  return 'text-red-600 font-semibold';
};
