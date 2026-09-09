import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, X, UserCircle } from 'lucide-react';
import { getTeachers, createTeacher, updateTeacher, deleteTeacher } from '../services/teacher.service';
import type { Teacher, TeacherCreateFormData, TeacherUpdateFormData } from '../types/teacher';

const token = () => localStorage.getItem('token') ?? '';

const GENDERS = ['', 'male', 'female'];

const EMPTY_CREATE: TeacherCreateFormData = {
  email: '', password: '', username: '',
  teacher_number: '', full_name: '',
  gender: '', birth_place: '', birth_date: '',
  phone: '', address: '', subject: '',
};

export default function Teachers() {
  const [teachers, setTeachers]   = useState<Teacher[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  // pagination & filter
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [search, setSearch]         = useState('');
  const [searchInput, setSearchInput] = useState('');
  const LIMIT = 10;

  // modal
  const [showModal, setShowModal]     = useState(false);
  const [editingItem, setEditingItem] = useState<Teacher | null>(null);
  const [createForm, setCreateForm]   = useState<TeacherCreateFormData>(EMPTY_CREATE);
  const [editForm, setEditForm]       = useState<TeacherUpdateFormData>({});
  const [formErrors, setFormErrors]   = useState<string[]>([]);
  const [submitting, setSubmitting]   = useState(false);

  // delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete]       = useState<Teacher | null>(null);
  const [deleting, setDeleting]               = useState(false);

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getTeachers({ page, limit: LIMIT, search: search || undefined }, token());
      setTeachers(res.data);
      setTotal(res.metadata.total);
      setTotalPages(res.metadata.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data guru');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  // ─── Modals ───────────────────────────────────────────────────────────────

  const openCreateModal = () => {
    setEditingItem(null);
    setCreateForm(EMPTY_CREATE);
    setFormErrors([]);
    setShowModal(true);
  };

  const openEditModal = (t: Teacher) => {
    setEditingItem(t);
    setEditForm({
      teacher_number: t.teacher_number,
      full_name:      t.full_name,
      gender:         t.gender ?? '',
      birth_place:    t.birth_place ?? '',
      birth_date:     t.birth_date ? t.birth_date.substring(0, 10) : '',
      phone:          t.phone ?? '',
      address:        t.address ?? '',
      subject:        t.subject ?? '',
    });
    setFormErrors([]);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingItem(null); setFormErrors([]); };

  const handleCreateInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCreateForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);
    setSubmitting(true);

    try {
      if (editingItem) {
        const payload: TeacherUpdateFormData = { ...editForm };
        if (!payload.gender)      delete payload.gender;
        if (!payload.birth_place) delete payload.birth_place;
        if (!payload.birth_date)  delete payload.birth_date;
        if (!payload.phone)       delete payload.phone;
        if (!payload.address)     delete payload.address;
        if (!payload.subject)     delete payload.subject;
        await updateTeacher(editingItem.id, payload, token());
      } else {
        const payload: TeacherCreateFormData = { ...createForm };
        if (!payload.username)    delete payload.username;
        if (!payload.gender)      delete payload.gender;
        if (!payload.birth_place) delete payload.birth_place;
        if (!payload.birth_date)  delete payload.birth_date;
        if (!payload.phone)       delete payload.phone;
        if (!payload.address)     delete payload.address;
        if (!payload.subject)     delete payload.subject;
        await createTeacher(payload, token());
      }
      closeModal();
      fetchTeachers();
    } catch (err) {
      setFormErrors([err instanceof Error ? err.message : 'Gagal menyimpan']);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────

  const openDeleteModal = (t: Teacher) => { setItemToDelete(t); setShowDeleteModal(true); };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await deleteTeacher(itemToDelete.id, token());
      setShowDeleteModal(false);
      setItemToDelete(null);
      fetchTeachers();
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
              placeholder="Cari nama / NIP..."
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
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Total: <span className="font-semibold text-gray-800">{total}</span> guru</span>
          <button onClick={openCreateModal}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-semibold text-sm">
            <Plus className="w-4 h-4" />
            Tambah Guru
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">Memuat data...</div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-600 mb-3">{error}</p>
            <button onClick={fetchTeachers} className="text-sm text-blue-600 underline">Coba lagi</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">#</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">NIP</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Nama Lengkap</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Mata Pelajaran</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Email</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">No. Telepon</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Status</th>
                  <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {teachers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-gray-400">
                      <UserCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Tidak ada guru ditemukan</p>
                    </td>
                  </tr>
                ) : teachers.map((t, i) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-gray-400">{(page - 1) * LIMIT + i + 1}</td>
                    <td className="px-5 py-4 font-mono text-gray-700">{t.teacher_number}</td>
                    <td className="px-5 py-4 font-medium text-gray-800">{t.full_name}</td>
                    <td className="px-5 py-4 text-gray-600">{t.subject ?? '—'}</td>
                    <td className="px-5 py-4 text-gray-600">{t.email}</td>
                    <td className="px-5 py-4 text-gray-600">{t.phone ?? '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${t.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                        {t.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEditModal(t)} title="Edit"
                          className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => openDeleteModal(t)} title="Hapus"
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
          dari <span className="font-semibold text-gray-800">{total}</span> guru
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

      {/* ── Create / Edit Modal ─────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-5 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-800">
                {editingItem ? 'Edit Data Guru' : 'Tambah Guru'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  {formErrors.map((e, i) => <p key={i} className="text-red-600 text-sm">{e}</p>)}
                </div>
              )}

              {/* Create-only fields */}
              {!editingItem && (
                <>
                  <div className="pb-3 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Akun Login</p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
                        <input name="email" type="email" value={createForm.email} onChange={handleCreateInput} required
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password <span className="text-red-500">*</span></label>
                        <input name="password" type="password" value={createForm.password} onChange={handleCreateInput} required minLength={6}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
                        <input name="username" value={createForm.username ?? ''} onChange={handleCreateInput}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Opsional" />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Data Pribadi</p>
                </>
              )}

              {/* Shared fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">NIP <span className="text-red-500">*</span></label>
                  <input
                    name="teacher_number"
                    value={editingItem ? (editForm.teacher_number ?? '') : createForm.teacher_number}
                    onChange={editingItem ? handleEditInput : handleCreateInput}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
                  <input
                    name="full_name"
                    value={editingItem ? (editForm.full_name ?? '') : createForm.full_name}
                    onChange={editingItem ? handleEditInput : handleCreateInput}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mata Pelajaran</label>
                  <input
                    name="subject"
                    value={editingItem ? (editForm.subject ?? '') : (createForm.subject ?? '')}
                    onChange={editingItem ? handleEditInput : handleCreateInput}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Jenis Kelamin</label>
                  <select
                    name="gender"
                    value={editingItem ? (editForm.gender ?? '') : (createForm.gender ?? '')}
                    onChange={editingItem ? handleEditInput : handleCreateInput}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {GENDERS.map(g => <option key={g} value={g}>{g || '— Pilih —'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tempat Lahir</label>
                  <input
                    name="birth_place"
                    value={editingItem ? (editForm.birth_place ?? '') : (createForm.birth_place ?? '')}
                    onChange={editingItem ? handleEditInput : handleCreateInput}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tanggal Lahir</label>
                  <input
                    name="birth_date"
                    type="date"
                    value={editingItem ? (editForm.birth_date ?? '') : (createForm.birth_date ?? '')}
                    onChange={editingItem ? handleEditInput : handleCreateInput}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">No. Telepon</label>
                  <input
                    name="phone"
                    value={editingItem ? (editForm.phone ?? '') : (createForm.phone ?? '')}
                    onChange={editingItem ? handleEditInput : handleCreateInput}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Alamat</label>
                  <textarea
                    name="address"
                    value={editingItem ? (editForm.address ?? '') : (createForm.address ?? '')}
                    onChange={editingItem ? handleEditInput : handleCreateInput}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold text-sm">
                  Batal
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm disabled:opacity-60">
                  {submitting ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Tambah Guru'}
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
                <h3 className="text-lg font-bold text-gray-900">Hapus Guru</h3>
                <p className="text-sm text-gray-500">Tindakan ini tidak bisa dibatalkan</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Yakin ingin menghapus guru <span className="font-semibold">"{itemToDelete.full_name}"</span>?
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
