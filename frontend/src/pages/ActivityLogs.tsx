import { useState, useEffect, useCallback } from 'react';
import {
  Search, ChevronLeft, ChevronRight, Trash2, RefreshCw,
  Monitor, Smartphone, Tablet, Zap, Bot, X, Shield,
} from 'lucide-react';
import { getActivityLogs, deleteActivityLog, purgeActivityLogs } from '../services/activityLog.service';
import type { ActivityLog } from '../types/activityLog';
import { METHOD_COLORS, ACTION_COLORS, DEVICE_ICONS, STATUS_COLOR } from '../types/activityLog';
import { toast } from '../components/Toast';

const token = () => localStorage.getItem('token') ?? '';

const METHODS  = ['POST', 'PUT', 'PATCH', 'DELETE'];
const DEVICES  = ['desktop', 'mobile', 'tablet', 'api-client', 'bot'];
const LIMIT    = 20;

function DeviceIcon({ type }: { type: string | null }) {
  const cls = 'w-4 h-4';
  switch (type) {
    case 'desktop':    return <Monitor    className={`${cls} text-blue-500`} />;
    case 'mobile':     return <Smartphone className={`${cls} text-emerald-500`} />;
    case 'tablet':     return <Tablet     className={`${cls} text-violet-500`} />;
    case 'api-client': return <Zap        className={`${cls} text-amber-500`} />;
    case 'bot':        return <Bot        className={`${cls} text-gray-400`} />;
    default:           return <span className="text-gray-300 text-xs">?</span>;
  }
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function ActivityLogs() {
  const [items, setItems]               = useState<ActivityLog[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [total, setTotal]               = useState(0);

  // filters
  const [search, setSearch]             = useState('');
  const [searchInput, setSearchInput]   = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterDevice, setFilterDevice] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo]     = useState('');

  // detail modal
  const [detail, setDetail]             = useState<ActivityLog | null>(null);

  // purge
  const [showPurge, setShowPurge]       = useState(false);
  const [purging, setPurging]           = useState(false);
  const [purgeDays, setPurgeDays]       = useState(90);

  // delete
  const [deletingId, setDeletingId]     = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getActivityLogs(
        {
          page, limit: LIMIT,
          search:      search      || undefined,
          method:      filterMethod || undefined,
          device_type: filterDevice || undefined,
          date_from:   filterDateFrom || undefined,
          date_to:     filterDateTo   || undefined,
        },
        token()
      );
      setItems(res.data);
      setTotal(res.metadata.total);
      setTotalPages(res.metadata.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat log');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterMethod, filterDevice, filterDateFrom, filterDateTo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };
  const resetFilters = () => {
    setSearch(''); setSearchInput('');
    setFilterMethod(''); setFilterDevice('');
    setFilterDateFrom(''); setFilterDateTo('');
    setPage(1);
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus log ini?')) return;
    setDeletingId(id);
    try {
      await deleteActivityLog(id, token());
      toast.success('Log berhasil dihapus');
      fetchLogs();
    } catch {
      toast.error('Gagal menghapus log');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Purge ──────────────────────────────────────────────────────────────────

  const handlePurge = async () => {
    setPurging(true);
    try {
      const res = await purgeActivityLogs(purgeDays, token());
      toast.success(`${res.deleted} log lama berhasil dihapus`);
      setShowPurge(false);
      fetchLogs();
    } catch {
      toast.error('Gagal membersihkan log');
    } finally {
      setPurging(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const hasFilters = search || filterMethod || filterDevice || filterDateFrom || filterDateTo;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Activity Logs</h1>
            <p className="text-xs text-gray-500">Histori aksi POST · PUT · PATCH · DELETE</p>
          </div>
        </div>
        <button
          onClick={() => setShowPurge(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors"
        >
          <Trash2 className="w-4 h-4" /> Bersihkan Log Lama
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" placeholder="Cari email, endpoint, deskripsi..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button onClick={handleSearch}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
            Cari
          </button>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {/* Method filter */}
          <select value={filterMethod} onChange={e => { setFilterMethod(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Semua Method</option>
            {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          {/* Device filter */}
          <select value={filterDevice} onChange={e => { setFilterDevice(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Semua Device</option>
            {DEVICES.map(d => <option key={d} value={d}>{DEVICE_ICONS[d]} {d}</option>)}
          </select>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <input type="date" value={filterDateFrom}
              onChange={e => { setFilterDateFrom(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <span className="text-gray-400 text-sm">—</span>
            <input type="date" value={filterDateTo}
              onChange={e => { setFilterDateTo(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {hasFilters && (
            <button onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
              <X className="w-3.5 h-3.5" /> Reset
            </button>
          )}

          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-gray-500">
              Total: <span className="font-semibold text-gray-800">{total}</span>
            </span>
            <button onClick={fetchLogs} title="Refresh"
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">Memuat log...</div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-600 mb-3">{error}</p>
            <button onClick={fetchLogs} className="text-sm text-blue-600 underline">Coba lagi</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left">
                  <th className="px-4 py-3.5 font-semibold text-gray-600 w-8">#</th>
                  <th className="px-4 py-3.5 font-semibold text-gray-600">Waktu</th>
                  <th className="px-4 py-3.5 font-semibold text-gray-600">Pengguna</th>
                  <th className="px-4 py-3.5 font-semibold text-gray-600">Method</th>
                  <th className="px-4 py-3.5 font-semibold text-gray-600">Endpoint</th>
                  <th className="px-4 py-3.5 font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3.5 font-semibold text-gray-600">Device</th>
                  <th className="px-4 py-3.5 font-semibold text-gray-600">Browser / OS</th>
                  <th className="px-4 py-3.5 font-semibold text-gray-600">IP</th>
                  <th className="px-4 py-3.5 font-semibold text-gray-600 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-16 text-gray-400">
                      <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>Belum ada log aktivitas</p>
                    </td>
                  </tr>
                ) : items.map((log, i) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setDetail(log)}
                  >
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {(page - 1) * LIMIT + i + 1}
                    </td>

                    {/* Waktu */}
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>

                    {/* Pengguna */}
                    <td className="px-4 py-3">
                      {log.user_email ? (
                        <div>
                          <p className="text-gray-800 font-medium text-xs leading-tight">
                            {log.user_username || log.user_email}
                          </p>
                          <p className="text-gray-400 text-xs">{log.user_role}</p>
                        </div>
                      ) : (
                        <span className="text-gray-300 italic text-xs">anonymous</span>
                      )}
                    </td>

                    {/* Method */}
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      {log.method ? (
                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${METHOD_COLORS[log.method] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {log.method}
                        </span>
                      ) : '—'}
                    </td>

                    {/* Endpoint */}
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="font-mono text-xs text-gray-700 truncate" title={log.endpoint ?? ''}>
                        {log.endpoint || '—'}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`text-sm ${STATUS_COLOR(log.status_code)}`}>
                        {log.status_code ?? '—'}
                      </span>
                    </td>

                    {/* Device */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <DeviceIcon type={log.device_type} />
                        <span className="text-xs text-gray-500 capitalize">{log.device_type ?? '—'}</span>
                      </div>
                    </td>

                    {/* Browser / OS */}
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-700 font-medium">{log.browser ?? '—'}</p>
                      <p className="text-xs text-gray-400">{log.os ?? ''}</p>
                    </td>

                    {/* IP */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-600">{log.ip_address ?? '—'}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleDelete(log.id)}
                        disabled={deletingId === log.id}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-colors disabled:opacity-40"
                        title="Hapus log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">
            Menampilkan{' '}
            <span className="font-semibold text-gray-800">
              {total === 0 ? 0 : (page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)}
            </span>{' '}
            dari <span className="font-semibold text-gray-800">{total}</span> log
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page === 1}
              className="px-2.5 py-1.5 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">«</button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === '...' ? (
                  <span key={`e-${idx}`} className="px-2 text-gray-400 text-sm">…</span>
                ) : (
                  <button key={p} onClick={() => setPage(p as number)}
                    className={`min-w-[32px] h-8 rounded-lg text-sm font-medium border transition-colors
                      ${page === p ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                    {p}
                  </button>
                )
              )}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
              className="px-2.5 py-1.5 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">»</button>
          </div>
        </div>
      )}

      {/* ── Detail Modal ──────────────────────────────────────────────────────── */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-5 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                {detail.method && (
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${METHOD_COLORS[detail.method] || ''}`}>
                    {detail.method}
                  </span>
                )}
                <h2 className="text-base font-bold text-gray-800">Detail Log</h2>
              </div>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Time + Action */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Waktu" value={formatDate(detail.created_at)} mono />
                <Field label="Action">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ACTION_COLORS[detail.action] || 'bg-gray-100 text-gray-600'}`}>
                    {detail.action}
                  </span>
                </Field>
              </div>

              {/* User */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Email" value={detail.user_email ?? 'anonymous'} />
                <Field label="Role" value={detail.user_role ?? '—'} />
              </div>

              {/* Request */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Request</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Method" value={detail.method ?? '—'} />
                  <Field label="Status" >
                    <span className={`text-sm font-bold ${STATUS_COLOR(detail.status_code)}`}>
                      {detail.status_code ?? '—'}
                    </span>
                  </Field>
                </div>
                <Field label="Endpoint" value={detail.endpoint ?? '—'} mono />
                {detail.description && (
                  <Field label="Deskripsi" value={detail.description} />
                )}
              </div>

              {/* Client */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Client</p>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="IP Address" value={detail.ip_address ?? '—'} mono />
                  <Field label="Browser" value={detail.browser ?? '—'} />
                  <Field label="OS" value={detail.os ?? '—'} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Device">
                    <div className="flex items-center gap-2">
                      <DeviceIcon type={detail.device_type} />
                      <span className="text-sm text-gray-700 capitalize">{detail.device_type ?? '—'}</span>
                    </div>
                  </Field>
                  <Field label="Module" value={detail.module} />
                </div>
              </div>

              {/* Raw UA */}
              {detail.user_agent && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">User-Agent (raw)</p>
                  <p className="font-mono text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 break-all leading-relaxed">
                    {detail.user_agent}
                  </p>
                </div>
              )}

              {/* Data diff */}
              {(detail.request_body || detail.old_data) && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide border-t pt-4">
                    Data Perubahan
                  </p>

                  {/* POST — new data only */}
                  {detail.method === 'POST' && detail.request_body && (
                    <DataPanel
                      label="✦ Data Baru (dikirim)"
                      json={detail.request_body}
                      color="emerald"
                    />
                  )}

                  {/* PUT / PATCH — old vs new */}
                  {(detail.method === 'PUT' || detail.method === 'PATCH') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {detail.old_data && (
                        <DataPanel
                          label="← Data Sebelumnya"
                          json={detail.old_data}
                          color="red"
                        />
                      )}
                      {detail.request_body && (
                        <DataPanel
                          label="→ Data Baru (dikirim)"
                          json={detail.request_body}
                          color="blue"
                        />
                      )}
                    </div>
                  )}

                  {/* DELETE — show what was deleted */}
                  {detail.method === 'DELETE' && detail.old_data && (
                    <DataPanel
                      label="✕ Data yang Dihapus"
                      json={detail.old_data}
                      color="red"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Purge Modal ───────────────────────────────────────────────────────── */}
      {showPurge && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Bersihkan Log Lama</h3>
            <p className="text-sm text-gray-500 mb-5">Hapus semua log yang lebih lama dari:</p>
            <div className="flex items-center gap-3 mb-6">
              <input
                type="number" min={1} max={365} value={purgeDays}
                onChange={e => setPurgeDays(parseInt(e.target.value) || 90)}
                className="w-24 px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-center font-semibold focus:ring-2 focus:ring-red-400 outline-none"
              />
              <span className="text-sm text-gray-600">hari yang lalu</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPurge(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Batal
              </button>
              <button onClick={handlePurge} disabled={purging}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60">
                {purging ? 'Menghapus...' : 'Hapus Log'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────

function Field({
  label, value, mono = false, children,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 mb-0.5">{label}</p>
      {children ?? (
        <p className={`text-sm text-gray-800 break-all ${mono ? 'font-mono' : ''}`}>
          {value || '—'}
        </p>
      )}
    </div>
  );
}

type PanelColor = 'emerald' | 'blue' | 'red';

const PANEL_STYLES: Record<PanelColor, { bg: string; border: string; header: string; key: string; val: string }> = {
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', header: 'text-emerald-700 bg-emerald-100', key: 'text-emerald-800', val: 'text-emerald-900' },
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',    header: 'text-blue-700 bg-blue-100',       key: 'text-blue-800',    val: 'text-blue-900'    },
  red:     { bg: 'bg-red-50',     border: 'border-red-200',     header: 'text-red-700 bg-red-100',         key: 'text-red-800',     val: 'text-red-900'     },
};

function DataPanel({ label, json, color }: { label: string; json: string; color: PanelColor }) {
  const s = PANEL_STYLES[color];

  let parsed: Record<string, unknown> | null = null;
  try { parsed = JSON.parse(json); } catch { /* show raw */ }

  return (
    <div className={`rounded-xl border ${s.border} overflow-hidden`}>
      <div className={`px-3 py-2 text-xs font-bold ${s.header}`}>{label}</div>
      <div className={`${s.bg} px-3 py-2 space-y-1 max-h-64 overflow-y-auto`}>
        {parsed ? (
          Object.entries(parsed).map(([k, v]) => (
            <div key={k} className="flex gap-2 text-xs">
              <span className={`font-semibold shrink-0 ${s.key}`}>{k}:</span>
              <span className={`font-mono break-all ${s.val}`}>
                {v === null ? <em className="opacity-40">null</em>
                  : v === '' ? <em className="opacity-40">kosong</em>
                  : String(v)}
              </span>
            </div>
          ))
        ) : (
          <pre className="text-xs font-mono text-gray-600 break-all whitespace-pre-wrap">{json}</pre>
        )}
      </div>
    </div>
  );
}
