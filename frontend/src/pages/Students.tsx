import { useState, useEffect, useCallback } from 'react';
import { Edit, Trash2, Search, ChevronLeft, ChevronRight, X, GraduationCap } from 'lucide-react';
import { getStudents, updateStudent, deleteStudent } from '../services/student.service';
import type { Student, StudentFormData } from '../types/student';

const token = () => localStorage.getItem('token') ?? '';

const GENDERS = ['', 'male', 'female'];

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
  const [classFilter, setClassFilter] = useState('');
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

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getStudents(
        { page, limit: LIMIT, search: search || undefined, class_name: classFilter || undefined },
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
  }, [page, search, classFilter]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  // ─── Edit modal ───────────────────────────────────────────────────────────

  const openEditModal = (s: Student) => {
    setEditingItem(s);
    setFormData({
      student_number: s.student_number,
      full_name:      s.full_name,
      gender:         s.gender ?? '',
      birth_place:    s.birth_place ?? '',
      birth_date:     s.birth_date ? s.birth_date.substring(0, 10) : '',
      phone:          s.phone ?? '',
      address:        s.address ?? '',
      class_name:     s.class_name ?? '',
      major:          s.major ?? '',
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
    if (!payload.class_name)     delete payload.class_name;
    if (!payload.major)          delete payload.major;
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
          <input
            type="text"
            placeholder="Filter kelas..."
            value={classFilter}
            onChange={e => { setClassFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-32"
          />
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
                    <td className="px-5 py-4 text-gray-600">{s.major ?? '—'}</td>
                    <td className="px-5 py-4 text-gray-600">{s.email}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                        {s.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
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
                    {GENDERS.map(g => <option key={g} value={g}>{g || '— Pilih —'}</option>)}
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kelas</label>
                  <input name="class_name" value={formData.class_name ?? ''} onChange={handleInput}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Jurusan</label>
                  <input name="major" value={formData.major ?? ''} onChange={handleInput}
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
    </div>
  );
}
