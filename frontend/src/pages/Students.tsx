import { useState, useEffect, useCallback } from 'react';
import { Edit, Trash2, Search, ChevronLeft, ChevronRight, X, GraduationCap, Eye, FileText, Loader2 } from 'lucide-react';
import { getStudents, updateStudent, deleteStudent, getStudentFullDetail } from '../services/student.service';
import type { Student, StudentFormData } from '../types/student';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8080';
const token = () => localStorage.getItem('token') ?? '';

const GENDERS: { value: string; label: string }[] = [
  { value: '',       label: '— Pilih —' },
  { value: 'male',   label: 'Laki-laki' },
  { value: 'female', label: 'Perempuan' },
];

export default function Students() {
  const [students, setStudents]   = useState<Student[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  // pagination & filter
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [search, setSearch]         = useState('');
  const [searchInput, setSearchInput] = useState('');
  const LIMIT = 10;

  // edit modal
  const [showModal, setShowModal]     = useState(false);
  const [editingItem, setEditingItem] = useState<Student | null>(null);
  const [formData, setFormData]       = useState<StudentFormData>({});
  const [formErrors, setFormErrors]   = useState<string[]>([]);
  const [submitting, setSubmitting]   = useState(false);

  // delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete]       = useState<Student | null>(null);
  const [deleting, setDeleting]               = useState(false);

  // detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailData, setDetailData]           = useState<any>(null);
  const [detailLoading, setDetailLoading]     = useState(false);

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getStudents(
        { page, limit: LIMIT, search: search || undefined },
        token()
      );
      setStudents(res.data);
      setTotal(res.metadata.total);
      setTotalPages(res.metadata.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data siswa');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  // ─── Edit modal ───────────────────────────────────────────────────────────

  const openEditModal = (s: Student) => {
    setEditingItem(s);

    // Normalize gender dari berbagai format ke 'male'/'female'
    const normalizeGender = (val: string | null | undefined): string => {
      if (!val) return '';
      const v = val.toLowerCase().trim();
      if (['male', 'laki-laki', 'laki', 'l', 'pria'].includes(v))  return 'male';
      if (['female', 'perempuan', 'wanita', 'p', 'w'].includes(v)) return 'female';
      return v;
    };

    setFormData({
      student_number:  s.student_number,
      full_name:       s.full_name,
      gender:          normalizeGender(s.gender),
      birth_place:     s.birth_place ?? '',
      birth_date:      s.birth_date ? s.birth_date.substring(0, 10) : '',
      phone:           s.phone ?? '',
      address:         s.address ?? '',
      enrollment_year: s.enrollment_year ?? '',
    });
    setFormErrors([]);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingItem(null); setFormErrors([]); };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setFormErrors([]);

    if (!formData.student_number?.trim()) { setFormErrors(['Nomor induk wajib diisi']); return; }
    if (!formData.full_name?.trim())      { setFormErrors(['Nama lengkap wajib diisi']); return; }

    const payload: StudentFormData = { ...formData };
    // send null for empty optional strings
    if (!payload.gender)         delete payload.gender;
    if (!payload.birth_place)    delete payload.birth_place;
    if (!payload.birth_date)     delete payload.birth_date;
    if (!payload.phone)          delete payload.phone;
    if (!payload.address)        delete payload.address;
    if (!payload.enrollment_year) delete payload.enrollment_year;

    setSubmitting(true);
    try {
      await updateStudent(editingItem.id, payload, token());
      closeModal();
      fetchStudents();
    } catch (err) {
      setFormErrors([err instanceof Error ? err.message : 'Gagal menyimpan']);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────

  const openDeleteModal  = (s: Student) => { setItemToDelete(s); setShowDeleteModal(true); };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await deleteStudent(itemToDelete.id, token());
      setShowDeleteModal(false);
      setItemToDelete(null);
      fetchStudents();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus');
    } finally {
      setDeleting(false);
    }
  };

  const openDetail = async (s: Student) => {
    setShowDetailModal(true);
    setDetailData(null);
    setDetailLoading(true);
    try {
      const data = await getStudentFullDetail(s.id, token());
      setDetailData(data);
    } catch {
      setDetailData({ student: s, ppdb: null });
    } finally {
      setDetailLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama / NIS..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button onClick={handleSearch}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
            Cari
          </button>
        </div>
        <div className="text-sm text-gray-500 flex items-center">
          Total: <span className="font-semibold text-gray-800 ml-1">{total}</span> siswa
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">Memuat data...</div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-600 mb-3">{error}</p>
            <button onClick={fetchStudents} className="text-sm text-blue-600 underline">Coba lagi</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">#</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">NIS</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Nama Lengkap</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Kelas</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Jurusan</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Email</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Status</th>
                  <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-gray-400">
                      <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Tidak ada siswa ditemukan</p>
                    </td>
                  </tr>
                ) : students.map((s, i) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-gray-400">{(page - 1) * LIMIT + i + 1}</td>
                    <td className="px-5 py-4 font-mono text-gray-700">{s.student_number}</td>
                    <td className="px-5 py-4 font-medium text-gray-800">{s.full_name}</td>
                    <td className="px-5 py-4 text-gray-600">{s.class_name ?? '—'}</td>
                    <td className="px-5 py-4 text-gray-600">
                      {s.major_code
                        ? <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-semibold">{s.major_code}</span>
                        : '—'}
                    </td>
                    <td className="px-5 py-4 text-gray-600">{s.email}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                        {s.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openDetail(s)} title="Lihat Detail"
                          className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 border border-green-200 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEditModal(s)} title="Edit"
                          className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => openDeleteModal(s)} title="Hapus"
                          className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-xl border border-gray-100 shadow-sm">
        <p className="text-sm text-gray-500">
          Menampilkan{' '}
          <span className="font-semibold text-gray-800">
            {total === 0 ? 0 : (page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)}
          </span>{' '}
          dari <span className="font-semibold text-gray-800">{total}</span> siswa
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="px-2.5 py-1.5 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            «
          </button>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
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
                <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 text-sm">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors border ${
                    page === p
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {p}
                </button>
              )
            )}

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages || totalPages === 0}
            className="px-2.5 py-1.5 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            »
          </button>
        </div>
      </div>

      {/* ── Edit Modal ──────────────────────────────────────────────────────── */}
      {showModal && editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-5 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-800">Edit Data Siswa</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  {formErrors.map((e, i) => <p key={i} className="text-red-600 text-sm">{e}</p>)}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">NIS <span className="text-red-500">*</span></label>
                  <input name="student_number" value={formData.student_number ?? ''} onChange={handleInput} required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
                  <input name="full_name" value={formData.full_name ?? ''} onChange={handleInput} required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Jenis Kelamin</label>
                  <select name="gender" value={formData.gender ?? ''} onChange={handleInput}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tanggal Lahir</label>
                  <input name="birth_date" type="date" value={formData.birth_date ?? ''} onChange={handleInput}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tempat Lahir</label>
                  <input name="birth_place" value={formData.birth_place ?? ''} onChange={handleInput}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">No. Telepon</label>
                  <input name="phone" value={formData.phone ?? ''} onChange={handleInput}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tahun Masuk</label>
                  <input name="enrollment_year" type="number" value={formData.enrollment_year ?? ''} onChange={handleInput}
                    min={1990} max={new Date().getFullYear() + 1}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Alamat</label>
                  <textarea name="address" value={formData.address ?? ''} onChange={handleInput} rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold text-sm">
                  Batal
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm disabled:opacity-60">
                  {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Modal ────────────────────────────────────────────────────── */}
      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Hapus Siswa</h3>
                <p className="text-sm text-gray-500">Tindakan ini tidak bisa dibatalkan</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Yakin ingin menghapus siswa <span className="font-semibold">"{itemToDelete.full_name}"</span>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setItemToDelete(null); }}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold text-sm">
                Batal
              </button>
              <button onClick={confirmDelete} disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-sm disabled:opacity-60">
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Modal ────────────────────────────────────────────────────── */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col" style={{ maxHeight: '90vh' }}>

            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-800">{detailData?.student?.full_name || 'Detail Siswa'}</h2>
                  <p className="text-xs text-gray-400">NIS {detailData?.student?.student_number || '—'} · {detailData?.student?.class_name || '—'}</p>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : detailData ? (
              <StudentDetailTabs data={detailData} apiBase={API_BASE} />
            ) : null}

            {/* Footer */}
            <div className="px-6 py-3 border-t bg-gray-50 rounded-b-2xl flex justify-end shrink-0">
              <button onClick={() => setShowDetailModal(false)}
                className="px-5 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-100 transition">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-400 font-medium mb-0.5 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-800 font-medium break-words">{value ?? '—'}</p>
    </div>
  );
}

function Grid3({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{children}</div>;
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

// ── Tab detail siswa ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'profil',    label: 'Profil' },
  { id: 'identitas', label: 'Identitas' },
  { id: 'alamat',    label: 'Alamat' },
  { id: 'keluarga',  label: 'Orang Tua' },
  { id: 'dokumen',   label: 'Dokumen' },
  { id: 'lainnya',   label: 'Lainnya' },
];

function StudentDetailTabs({ data, apiBase }: { data: any; apiBase: string }) {
  const [activeTab, setActiveTab] = useState('profil');
  const s = data.student;
  const p = data.ppdb;

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Tab nav */}
      <div className="flex gap-1 px-6 pt-4 border-b bg-white shrink-0 overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 whitespace-nowrap transition-colors
              ${activeTab === tab.id
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content — scrollable */}
      <div className="overflow-y-auto flex-1 p-6">

        {/* ── Profil ── */}
        {activeTab === 'profil' && (
          <div className="flex gap-6">
            {p?.photo && (
              <div className="shrink-0">
                <img src={`${apiBase}/${p.photo}`} alt="Foto"
                  className="w-24 h-32 object-cover rounded-xl border border-gray-200 shadow-sm"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <p className="text-xs text-gray-400 text-center mt-1">Pas Foto</p>
              </div>
            )}
            <div className="flex-1">
              <Grid3>
                <InfoRow label="NIS"          value={s?.student_number} />
                <InfoRow label="Nama Lengkap" value={s?.full_name} />
                <InfoRow label="Email"        value={s?.email} />
                <InfoRow label="Jurusan"      value={s?.major_code ? `${s.major_code} — ${s.major_name}` : null} />
                <InfoRow label="Kelas"        value={s?.class_name} />
                <InfoRow label="Tahun Ajaran" value={s?.academic_year_name} />
                <InfoRow label="Tahun Masuk"  value={s?.enrollment_year} />
                <InfoRow label="Jenis Kelamin" value={
                  s?.gender === 'male' ? 'Laki-laki' : s?.gender === 'female' ? 'Perempuan' : s?.gender
                } />
                <InfoRow label="TTL"
                  value={s?.birth_place && s?.birth_date
                    ? `${s.birth_place}, ${new Date(s.birth_date).toLocaleDateString('id-ID')}`
                    : null} />
                <InfoRow label="No HP"   value={s?.phone} />
                <InfoRow label="Status"  value={s?.is_active ? '✅ Aktif' : '❌ Nonaktif'} />
                <InfoRow label="NISN"    value={p?.nisn} />
                <InfoRow label="NIK/KIA" value={p?.nik} />
              </Grid3>
            </div>
          </div>
        )}

        {/* ── Identitas ── */}
        {activeTab === 'identitas' && p && (
          <Grid3>
            <InfoRow label="Nama Panggilan"    value={p.nickname} />
            <InfoRow label="Agama"             value={p.religion} />
            <InfoRow label="Kewarganegaraan"   value={p.nationality} />
            <InfoRow label="Status Keluarga"   value={p.family_status?.replace('_',' ')} />
            <InfoRow label="Anak Ke-"          value={p.child_order} />
            <InfoRow label="Saudara Kandung"   value={p.total_biological_siblings} />
            <InfoRow label="Saudara Tiri"      value={p.total_step_siblings ?? '—'} />
            <InfoRow label="Saudara Angkat"    value={p.total_adopted_siblings ?? '—'} />
            <InfoRow label="Asal Sekolah"      value={p.school_origin} />
            <InfoRow label="NPSN"              value={p.npsn} />
            <InfoRow label="No Ijazah"         value={p.diploma_number} />
            <InfoRow label="Tgl Ijazah"        value={p.diploma_date ? new Date(p.diploma_date).toLocaleDateString('id-ID') : null} />
            <InfoRow label="Sistem Pendidikan" value={p.education_system} />
            <InfoRow label="KIP"               value={p.has_kip ? `Ya — ${p.kip_number || '-'}` : 'Tidak'} />
            {p.health && <>
              <InfoRow label="Tinggi Badan"    value={p.health.height ? `${p.health.height} cm` : null} />
              <InfoRow label="Berat Badan"     value={p.health.weight ? `${p.health.weight} kg` : null} />
              <InfoRow label="Riwayat Kesehatan" value={p.health.health_history} />
              <InfoRow label="Disabilitas"     value={p.health.disability} />
            </>}
          </Grid3>
        )}
        {activeTab === 'identitas' && !p && <EmptyPpdb />}

        {/* ── Alamat ── */}
        {activeTab === 'alamat' && p && (
          <Grid3>
            <InfoRow label="No HP"          value={p.phone} />
            <InfoRow label="Email Kontak"   value={p.contact_email} />
            <InfoRow label="Transportasi"   value={p.transportation} />
            <InfoRow label="Jarak (km)"     value={p.distance_to_school} />
            <InfoRow label="Waktu Tempuh"   value={p.travel_time ? `${p.travel_time} jam` : null} />
            <InfoRow label="Status Tinggal" value={p.living_status} />
            <InfoRow label="Bahasa Sehari-hari" value={p.daily_language} />
            <InfoRow label="Provinsi"       value={p.province} />
            <InfoRow label="Kota"           value={p.city} />
            <InfoRow label="Kecamatan"      value={p.district} />
            <InfoRow label="Desa/Kelurahan" value={p.village} />
            <InfoRow label="RT / RW"        value={p.rt && p.rw ? `${p.rt} / ${p.rw}` : null} />
            <div className="md:col-span-3">
              <InfoRow label="Alamat Lengkap" value={p.full_address} />
            </div>
          </Grid3>
        )}
        {activeTab === 'alamat' && !p && <EmptyPpdb />}

        {/* ── Orang Tua ── */}
        {activeTab === 'keluarga' && p?.parents?.length > 0 && (
          <Grid2>
            {p.parents.map((par: any) => (
              <div key={par.id} className={`rounded-xl p-4 border ${par.parent_type === 'ayah' ? 'bg-blue-50 border-blue-200' : 'bg-pink-50 border-pink-200'}`}>
                <p className={`font-bold text-sm mb-3 ${par.parent_type === 'ayah' ? 'text-blue-700' : 'text-pink-700'}`}>
                  {par.parent_type === 'ayah' ? '♂ Ayah' : '♀ Ibu'}
                </p>
                <div className="space-y-2">
                  <InfoRow label="Nama"        value={par.full_name} />
                  <InfoRow label="NIK"         value={par.nik} />
                  <InfoRow label="TTL"         value={par.birth_place && par.birth_date ? `${par.birth_place}, ${new Date(par.birth_date).toLocaleDateString('id-ID')}` : null} />
                  <InfoRow label="Agama"       value={par.religion} />
                  <InfoRow label="Pendidikan"  value={par.education} />
                  <InfoRow label="Pekerjaan"   value={par.occupation} />
                  <InfoRow label="Status"      value={par.marital_status?.replace('_',' ')} />
                  <InfoRow label="No HP"       value={par.phone} />
                  <InfoRow label="Penghasilan" value={par.monthly_income ? `Rp ${Number(par.monthly_income).toLocaleString('id-ID')}` : null} />
                </div>
              </div>
            ))}
          </Grid2>
        )}
        {activeTab === 'keluarga' && (!p || !p.parents?.length) && <EmptyPpdb />}

        {/* ── Dokumen ── */}
        {activeTab === 'dokumen' && p?.documents && (
          <div className="space-y-4">
            {[
              { label: 'Kartu Keluarga (KK)', path: p.documents.kk_document },
              { label: 'Ijazah / SKL',        path: p.documents.diploma_document },
            ].map(doc => (
              <div key={doc.label} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{doc.label}</p>
                    <p className="text-xs text-gray-400 truncate max-w-xs">{doc.path?.split('/').pop()}</p>
                  </div>
                </div>
                <a href={`${apiBase}/${doc.path}`} target="_blank" rel="noreferrer"
                  className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition">
                  Buka ↗
                </a>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'dokumen' && (!p || !p.documents) && <EmptyPpdb />}

        {/* ── Lainnya (Prestasi) ── */}
        {activeTab === 'lainnya' && (
          <div>
            {p?.achievements?.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Prestasi</p>
                {p.achievements.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏆</span>
                      <span className="text-sm font-medium text-gray-800">{a.achievement_name}</span>
                    </div>
                    {a.document && (
                      <a href={`${apiBase}/${a.document}`} target="_blank" rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline font-medium">Lihat ↗</a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <span className="text-4xl block mb-2">🏆</span>
                <p className="text-sm">Belum ada data prestasi</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function EmptyPpdb() {
  return (
    <div className="text-center py-12 text-gray-400">
      <span className="text-4xl block mb-2">📋</span>
      <p className="text-sm">Data tidak tersedia</p>
    </div>
  );
}
