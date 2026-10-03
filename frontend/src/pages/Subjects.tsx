import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, X, BookOpen } from 'lucide-react';
import { getSubjects, createSubject, updateSubject, deleteSubject } from '../services/subject.service';
import type { Subject, SubjectFormData } from '../types/subject';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/Toast';

const token = () => localStorage.getItem('token') ?? '';

const EMPTY_FORM: SubjectFormData = { code: '', name: '', description: '', is_active: true };

export default function Subjects() {
  const { user } = useAuth();
  const isSuperuser = user?.role === 'superuser';

  const [items, setItems]             = useState<Subject[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [total, setTotal]             = useState(0);
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const LIMIT = 10;

  const [showModal, setShowModal]         = useState(false);
  const [editingItem, setEditingItem]     = useState<Subject | null>(null);
  const [form, setForm]                   = useState<SubjectFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors]       = useState<string[]>([]);
  const [submitting, setSubmitting]       = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete]   = useState<Subject | null>(null);
  const [deleting, setDeleting]           = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getSubjects({ page, limit: LIMIT, search: search || undefined }, token());
      setItems(res.data);
      setTotal(res.metadata.total);
      setTotalPages(res.metadata.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  // ── Modals ─────────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setFormErrors([]);
    setShowModal(true);
  };

  const openEdit = (item: Subject) => {
    setEditingItem(item);
    setForm({
      code:        item.code,
      name:        item.name,
      description: item.description ?? '',
      is_active:   item.is_active,
    });
    setFormErrors([]);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingItem(null); setFormErrors([]); };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);
    if (!form.code.trim()) { setFormErrors(['Kode wajib diisi']); return; }
    if (!form.name.trim()) { setFormErrors(['Nama wajib diisi']); return; }
    setSubmitting(true);
    try {
      const payload: SubjectFormData = {
        code:        form.code.trim().toUpperCase(),
        name:        form.name.trim(),
        description: form.description?.trim() || undefined,
        is_active:   form.is_active,
      };
      if (editingItem) {
        await updateSubject(editingItem.id, payload, token());
        toast.success('Mata pelajaran berhasil diperbarui');
      } else {
        await createSubject(payload, token());
        toast.success('Mata pelajaran berhasil ditambahkan');
      }
      closeModal();
      fetchItems();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan';
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const errMsg = axiosErr?.response?.data?.message ?? msg;
      setFormErrors([errMsg]);
      toast.error('Gagal menyimpan', errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const openDelete  = (item: Subject) => { setItemToDelete(item); setShowDeleteModal(true); };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await deleteSubject(itemToDelete.id, token());
      toast.success('Mata pelajaran berhasil dihapus');
      setShowDeleteModal(false);
      setItemToDelete(null);
      fetchItems();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message ?? 'Gagal menghapus';
      toast.error('Gagal menghapus', msg);
      alert(msg);
    } finally {
      setDeleting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari kode / nama..."
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
          <span className="text-sm text-gray-500">Total: <span className="font-semibold text-gray-800">{total}</span></span>
          {isSuperuser && (
            <button onClick={openCreate}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md font-semibold text-sm">
              <Plus className="w-4 h-4" /> Tambah Mapel
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">Memuat data...</div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-600 mb-3">{error}</p>
            <button onClick={fetchItems} className="text-sm text-blue-600 underline">Coba lagi</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">#</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Kode</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Nama Mata Pelajaran</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Deskripsi</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Status</th>
                  {isSuperuser && <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={isSuperuser ? 6 : 5} className="text-center py-16 text-gray-400">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Belum ada mata pelajaran</p>
                    </td>
                  </tr>
                ) : items.map((item, i) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-gray-400">{(page - 1) * LIMIT + i + 1}</td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold font-mono">
                        {item.code}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-800">{item.name}</td>
                    <td className="px-5 py-4 text-gray-500 max-w-xs truncate">{item.description ?? '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {item.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    {isSuperuser && (
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(item)} title="Edit"
                            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200 transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => openDelete(item)} title="Hapus"
                            className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
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
          Menampilkan <span className="font-semibold text-gray-800">{total === 0 ? 0 : (page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)}</span> dari <span className="font-semibold text-gray-800">{total}</span>
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
              p === '...' ? <span key={`e-${idx}`} className="px-2 text-gray-400 text-sm">…</span> : (
                <button key={p} onClick={() => setPage(p as number)}
                  className={`min-w-[32px] h-8 rounded-lg text-sm font-medium border transition-colors ${page === p ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                  {p}
                </button>
              )
            )}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => setPage(totalPages)} disabled={page === totalPages || totalPages === 0}
            className="px-2.5 py-1.5 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">»</button>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-5 border-b">
              <h2 className="text-lg font-bold text-gray-800">
                {editingItem ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  {formErrors.map((e, i) => <p key={i} className="text-red-600 text-sm">{e}</p>)}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Kode <span className="text-red-500">*</span>
                  </label>
                  <input name="code" value={form.code} onChange={handleInput} required
                    placeholder="MTK"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none uppercase" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                  <label className="flex items-center gap-2 mt-2.5 cursor-pointer">
                    <input type="checkbox" name="is_active" checked={!!form.is_active} onChange={handleInput}
                      className="w-4 h-4 rounded text-blue-600" />
                    <span className="text-sm text-gray-600">Aktif</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Nama Mata Pelajaran <span className="text-red-500">*</span>
                </label>
                <input name="name" value={form.name} onChange={handleInput} required
                  placeholder="Matematika"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Deskripsi</label>
                <textarea name="description" value={form.description ?? ''} onChange={handleInput} rows={3}
                  placeholder="Deskripsi singkat..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors">
                  {submitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Hapus Mata Pelajaran</h3>
            <p className="text-sm text-gray-600 mb-6">
              Hapus <span className="font-semibold">{itemToDelete.name}</span>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Batal
              </button>
              <button onClick={confirmDelete} disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60">
                {deleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
