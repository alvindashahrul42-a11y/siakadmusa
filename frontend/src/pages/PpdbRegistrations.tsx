import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, CheckCircle, XCircle, Clock, FileCheck, X, Loader2 } from 'lucide-react';
import ppdbService from '../services/ppdb.service';
import type { PpdbRegistration } from '../types/ppdb';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft:     { label: 'Draft',     color: 'bg-gray-100 text-gray-600',   icon: <Clock className="w-3.5 h-3.5" /> },
  submitted: { label: 'Diajukan', color: 'bg-blue-100 text-blue-700',   icon: <Clock className="w-3.5 h-3.5" /> },
  verified:  { label: 'Terverifikasi', color: 'bg-indigo-100 text-indigo-700', icon: <FileCheck className="w-3.5 h-3.5" /> },
  accepted:  { label: 'Diterima', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  rejected:  { label: 'Ditolak',  color: 'bg-red-100 text-red-700',    icon: <XCircle className="w-3.5 h-3.5" /> },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-gray-500 font-medium mb-0.5">{label}</p>
      <p className="text-sm text-gray-800">{value ?? '-'}</p>
    </div>
  );
}

// ── Komponen Utama ───────────────────────────────────────────────────────────

export default function PpdbRegistrations() {
  const [list, setList] = useState<PpdbRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMajor, setFilterMajor] = useState('');

  // Detail modal
  const [selected, setSelected] = useState<PpdbRegistration | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Update status modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusTarget, setStatusTarget] = useState<PpdbRegistration | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await ppdbService.adminGetAll({
        page,
        limit: 15,
        status: filterStatus || undefined,
        major: filterMajor || undefined,
        search: search || undefined,
      });
      if (res.success) {
        setList(res.data);
        setTotalPages(res.metadata.total_pages);
        setTotal(res.metadata.total);
      }
    } catch {
      setError('Gagal memuat data pendaftaran');
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterMajor, search]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await ppdbService.adminGetDetail(id);
      if (res.success) setSelected(res.data.registration);
    } catch {
      setError('Gagal memuat detail pendaftaran');
    } finally {
      setDetailLoading(false); }
  };

  const openStatusModal = (reg: PpdbRegistration) => {
    setStatusTarget(reg);
    setNewStatus('');
    setStatusNotes('');
    setStatusError('');
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!statusTarget || !newStatus) return;
    setStatusLoading(true);
    setStatusError('');
    try {
      const res = await ppdbService.adminUpdateStatus(statusTarget.id, newStatus, statusNotes);
      if (res.success) {
        setShowStatusModal(false);
        setSelected(null);
        fetchList();
      } else {
        setStatusError(res.message);
      }
    } catch (err: any) {
      setStatusError(err.response?.data?.message || 'Gagal update status');
    } finally {
      setStatusLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-64">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Cari nama, NIK, NISN, email..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button type="submit"
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
            Cari
          </button>
        </form>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="submitted">Diajukan</option>
          <option value="verified">Terverifikasi</option>
          <option value="accepted">Diterima</option>
          <option value="rejected">Ditolak</option>
        </select>
        <select value={filterMajor} onChange={e => { setFilterMajor(e.target.value); setPage(1); }}
          className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">Semua Jurusan</option>
          <option value="TKJ">TKJ</option>
          <option value="teknik_otomotif">Teknik Otomotif</option>
        </select>
      </div>

      {/* Summary */}
      <p className="text-sm text-gray-500 mb-4">
        Total <span className="font-bold text-gray-800">{total}</span> pendaftar
      </p>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-4 text-sm">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">No</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Nama</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Jurusan</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Sistem</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Tanggal Daftar</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="py-16 text-center text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Memuat data...
                </td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center text-gray-400">
                  <div className="text-4xl mb-3">📋</div>
                  Belum ada data pendaftaran
                </td></tr>
              ) : list.map((reg, idx) => (
                <tr key={reg.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-gray-500">{(page - 1) * 15 + idx + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-800">{reg.full_name || '—'}</p>
                    <p className="text-xs text-gray-400">{reg.nik || 'NIK belum diisi'}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{reg.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold">
                      {reg.major === 'TKJ' ? 'TKJ' : 'Tek. Otomotif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{reg.education_system || '-'}</td>
                  <td className="px-4 py-3"><StatusBadge status={reg.registration_status} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(reg.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openDetail(reg.id)}
                        disabled={detailLoading}
                        className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                        title="Lihat Detail">
                        <Eye className="w-4 h-4" />
                      </button>
                      {reg.registration_status !== 'draft' && reg.registration_status !== 'accepted' && reg.registration_status !== 'rejected' && (
                        <button
                          onClick={() => openStatusModal(reg)}
                          className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
                          title="Update Status">
                          <FileCheck className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Halaman {page} dari {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition">
                ← Sebelumnya
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition">
                Berikutnya →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail Modal ─────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-lg font-bold text-gray-800">{selected.full_name || 'Detail Pendaftaran'}</h2>
                <p className="text-sm text-gray-500">{selected.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={selected.registration_status} />
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Pilihan Pendidikan */}
              <DetailSection title="Pilihan Pendidikan">
                <InfoRow label="Jurusan" value={selected.major === 'TKJ' ? 'Teknik Komputer & Jaringan (TKJ)' : 'Teknik Otomotif'} />
                <InfoRow label="Sistem Pendidikan" value={selected.education_system} />
                <InfoRow label="Didaftarkan Oleh" value={selected.registered_by?.replace('_', ' ')} />
              </DetailSection>

              {/* Identitas */}
              {selected.full_name && (
                <DetailSection title="Identitas">
                  <InfoRow label="NIK / KIA" value={selected.nik} />
                  <InfoRow label="NISN" value={selected.nisn} />
                  <InfoRow label="Nama Lengkap" value={selected.full_name} />
                  <InfoRow label="Nama Panggilan" value={selected.nickname} />
                  <InfoRow label="Tempat, Tanggal Lahir" value={selected.birth_place && selected.birth_date
                    ? `${selected.birth_place}, ${new Date(selected.birth_date).toLocaleDateString('id-ID')}`
                    : null} />
                  <InfoRow label="Jenis Kelamin" value={selected.gender} />
                  <InfoRow label="Agama" value={selected.religion} />
                  <InfoRow label="Status Keluarga" value={selected.family_status?.replace('_', ' ')} />
                  <InfoRow label="Anak Ke-" value={selected.child_order} />
                  <InfoRow label="Total Saudara Kandung" value={selected.total_biological_siblings} />
                  <InfoRow label="No HP" value={selected.phone} />
                  <InfoRow label="Provinsi" value={selected.province} />
                  <InfoRow label="Kota" value={selected.city} />
                  <InfoRow label="Alamat Lengkap" value={selected.full_address} />
                </DetailSection>
              )}

              {/* Asal Sekolah */}
              {selected.school_origin && (
                <DetailSection title="Asal Sekolah">
                  <InfoRow label="Nama Sekolah" value={selected.school_origin} />
                  <InfoRow label="NPSN" value={selected.npsn} />
                  <InfoRow label="Nomor Ijazah" value={selected.diploma_number} />
                  <InfoRow label="Tanggal Ijazah" value={selected.diploma_date ? new Date(selected.diploma_date).toLocaleDateString('id-ID') : null} />
                  <InfoRow label="Lama Belajar" value={selected.study_duration ? `${selected.study_duration} tahun` : null} />
                </DetailSection>
              )}

              {/* Pas Foto */}
              {selected.photo && (
                <DetailSection title="Pas Foto">
                  <div className="col-span-2">
                    <img
                      src={`${API_BASE}/${selected.photo}`}
                      alt="Pas Foto"
                      className="w-28 h-36 object-cover rounded-lg border border-gray-200"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                </DetailSection>
              )}

              {/* Kesehatan */}
              {selected.health && (
                <DetailSection title="Kesehatan">
                  <InfoRow label="Tinggi Badan" value={selected.health.height ? `${selected.health.height} cm` : null} />
                  <InfoRow label="Berat Badan" value={selected.health.weight ? `${selected.health.weight} kg` : null} />
                  <InfoRow label="Riwayat Kesehatan" value={selected.health.health_history} />
                  <InfoRow label="Disabilitas" value={selected.health.disability} />
                </DetailSection>
              )}

              {/* Dokumen */}
              {selected.documents && (
                <DetailSection title="Dokumen">
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Kartu Keluarga (KK)</p>
                    <a href={`${API_BASE}/${selected.documents.kk_document}`} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                      Lihat Dokumen ↗
                    </a>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Ijazah / SKL</p>
                    <a href={`${API_BASE}/${selected.documents.diploma_document}`} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                      Lihat Dokumen ↗
                    </a>
                  </div>
                </DetailSection>
              )}

              {/* Prestasi */}
              {selected.achievements && selected.achievements.length > 0 && (
                <DetailSection title="Prestasi">
                  <div className="col-span-2 space-y-2">
                    {selected.achievements.map(ach => (
                      <div key={ach.id} className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                        <span className="text-sm text-gray-800">{ach.achievement_name}</span>
                        {ach.document && (
                          <a href={`${API_BASE}/${ach.document}`} target="_blank" rel="noreferrer"
                            className="text-xs text-blue-600 hover:underline">Lihat ↗</a>
                        )}
                      </div>
                    ))}
                  </div>
                </DetailSection>
              )}

              {/* Orang Tua */}
              {selected.parents && selected.parents.length > 0 && (
                <DetailSection title="Data Orang Tua">
                  <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selected.parents.map(parent => (
                      <div key={parent.id} className="bg-gray-50 rounded-xl p-4">
                        <p className="font-bold text-gray-700 mb-3 capitalize">{parent.parent_type}</p>
                        <div className="space-y-2">
                          <InfoRow label="Nama" value={parent.full_name} />
                          <InfoRow label="NIK" value={parent.nik} />
                          <InfoRow label="Pekerjaan" value={parent.occupation} />
                          <InfoRow label="Pendidikan" value={parent.education} />
                          <InfoRow label="No HP" value={parent.phone} />
                          <InfoRow label="Penghasilan" value={parent.monthly_income
                            ? `Rp ${Number(parent.monthly_income).toLocaleString('id-ID')}`
                            : null} />
                        </div>
                      </div>
                    ))}
                  </div>
                </DetailSection>
              )}

              {/* Catatan Admin */}
              {selected.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Catatan Admin</p>
                  <p className="text-sm text-amber-900">{selected.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t flex justify-between items-center bg-gray-50 rounded-b-2xl">
              <p className="text-xs text-gray-400">
                Daftar: {new Date(selected.created_at).toLocaleString('id-ID')}
                {selected.submitted_at && ` · Submit: ${new Date(selected.submitted_at).toLocaleString('id-ID')}`}
              </p>
              <div className="flex gap-3">
                {selected.registration_status !== 'draft' &&
                  selected.registration_status !== 'accepted' &&
                  selected.registration_status !== 'rejected' && (
                    <button onClick={() => { openStatusModal(selected); }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
                      Update Status
                    </button>
                )}
                <button onClick={() => setSelected(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-100 transition">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Update Status Modal ──────────────────────────── */}
      {showStatusModal && statusTarget && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Update Status Pendaftaran</h3>
              <button onClick={() => setShowStatusModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Pendaftar: <span className="font-semibold text-gray-800">{statusTarget.full_name || statusTarget.email}</span>
              </p>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Keputusan <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: 'accepted', label: '✅ Diterima', color: 'border-green-400 bg-green-50 text-green-700' },
                    { val: 'rejected', label: '❌ Ditolak',  color: 'border-red-400 bg-red-50 text-red-700' },
                  ].map(opt => (
                    <button key={opt.val} type="button"
                      onClick={() => setNewStatus(opt.val)}
                      className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition
                        ${newStatus === opt.val ? opt.color + ' ring-2 ring-offset-1 ring-blue-400' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {newStatus === 'accepted' && '🎓 Role akan berubah menjadi Murid dan akun diaktifkan.'}
                  {newStatus === 'rejected' && '🔒 Akun akan dinonaktifkan, role tetap Kandidat.'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Catatan {newStatus === 'rejected' ? <span className="text-red-500">*</span> : '(opsional)'}
                </label>
                <textarea value={statusNotes} onChange={e => setStatusNotes(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  rows={3} placeholder={newStatus === 'rejected' ? 'Tuliskan alasan penolakan...' : 'Catatan untuk pendaftar...'} />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex gap-3 justify-end bg-gray-50 rounded-b-2xl">
              {statusError && (
                <p className="flex-1 text-sm text-red-600 self-center">{statusError}</p>
              )}
              <button onClick={() => setShowStatusModal(false)} disabled={statusLoading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-100 transition">
                Batal
              </button>
              <button onClick={handleUpdateStatus}
                disabled={statusLoading || !newStatus || (newStatus === 'rejected' && !statusNotes.trim())}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2">
                {statusLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Detail Section helper ─────────────────────────────────────────────────────
function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className="flex-1 h-px bg-blue-100" />
        {title}
        <span className="flex-1 h-px bg-blue-100" />
      </h4>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}
