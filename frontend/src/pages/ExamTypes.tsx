import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Search, X, FlaskConical, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  getExamTypes, createExamType, updateExamType, deleteExamType,
} from '../services/exam.service';
import type { ExamType, ExamTypeFormData } from '../types/exam';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/Toast';

const token = () => localStorage.getItem('token') ?? '';

const EMPTY_FORM: ExamTypeFormData = { code: '', name: '', description: '', is_active: true };

export default function ExamTypes() {
  const { user } = useAuth();
  const canEdit  = user?.role === 'superuser';

  const [items, setItems]             = useState<ExamType[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [page, setPage]               = useState(1);
  const [total, setTotal]             = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const LIMIT = 20;

  const [showModal, setShowModal]         = useState(false);
  const [editingItem, setEditingItem]     = useState<ExamType | null>(null);
  const [form, setForm]                   = useState<ExamTypeFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors]       = useState<string[]>([]);
  const [submitting, setSubmitting]       = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete]   = useState<ExamType | null>(null);
  const [deleting, setDeleting]           = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getExamTypes({ page, limit: LIMIT, search: search || undefined }, token());
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

  // ── Modal helpers ──────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setFormErrors([]);
    setShowModal(true);
  };

  const openEdit = (item: ExamType) => {
    setEditingItem(item);
    setForm({ code: item.code, name: item.name, description: item.description ?? '', is_active: item.is_active });
    setFormErrors([]);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingItem(null); setFormErrors([]); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);
    setSubmitting(true);
    try {
      if (editingItem) {
        await updateExamType(editingItem.id, {
          code: form.code,
          name: form.name,
          description: form.description || undefined,
          is_active: form.is_active,
        }, token());
        toast.success('Jenis ujian berhasil diperbarui');
      } else {
        await createExamType(form, token());
        toast.success('Jenis ujian berhasil ditambahkan');
      }
      closeModal();
      fetchItems();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message ?? 'Gagal menyimpan';
      setFormErrors([msg]);
      toast.error('Gagal menyimpan', msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const openDelete = (item: ExamType) => { setItemToDelete(item); setShowDeleteModal(true); };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await deleteExamType(itemToDelete.id, token());
      toast.success('Jenis ujian berhasil dihapus');
      setShowDeleteModal(false);
      setItemToDelete(null);
      fetchItems();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message ?? 'Gagal menghapus';
      toast.error('Gagal menghapus', msg);
    } finally {
      setDeleting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-800">Jenis Ujian</h1>
        <p className="text-sm text-gray-500">Master data jenis ujian (UH, UTS, UAS, dll)</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" placeholder="Cari kode atau nama..."
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
          {search && (
            <button onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1">
              <X className="w-4 h-4" /> Reset
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Total: <span className="font-semibold text-gray-800">{total}</span></span>
          {canEdit && (
            <button onClick={openCreate}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md font-semibold text-sm">
              <Plus className="w-4 h-4" /> Tambah Jenis Ujian
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
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Nama</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Deskripsi</th>
                  <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Status</th>
                  {canEdit && <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 6 : 5} className="text-center py-16 text-gray-400">
                      <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Belum ada jenis ujian</p>
                    </td>
                  </tr>
                ) : items.map((item, i) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-gray-400">{(page - 1) * LIMIT + i + 1}</td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold font-mono">
                        {item.code}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-800">{item.name}</td>
                    <td className="px-5 py-4 text-gray-500 max-w-xs truncate">{item.description || <span className="italic text-gray-300">—</span>}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {item.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(item)}
                            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200 transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => openDelete(item)}
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">
            Menampilkan <span className="font-semibold">{total === 0 ? 0 : (page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)}</span> dari <span className="font-semibold">{total}</span>
          </p>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-5 border-b">
              <h2 className="text-lg font-bold text-gray-800">
                {editingItem ? 'Edit Jenis Ujian' : 'Tambah Jenis Ujian'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  {formErrors.map((e, i) => <p key={i} className="text-red-600 text-sm">{e}</p>)}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Kode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" required maxLength={20}
                  placeholder="contoh: UTS"
                  value={form.code}
                  onChange={e => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Nama <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" required maxLength={100}
                  placeholder="contoh: Ujian Tengah Semester"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Deskripsi</label>
                <textarea
                  rows={3}
                  placeholder="Deskripsi singkat jenis ujian ini..."
                  value={form.description ?? ''}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox" id="is_active"
                  checked={form.is_active ?? true}
                  onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Aktif</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  Batal
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Hapus Jenis Ujian</h3>
                <p className="text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Apakah Anda yakin ingin menghapus jenis ujian <strong>{itemToDelete.code} — {itemToDelete.name}</strong>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Batal
              </button>
              <button onClick={confirmDelete} disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60">
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
