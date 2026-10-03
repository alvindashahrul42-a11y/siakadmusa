import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, X, CalendarDays, CheckCircle } from 'lucide-react';
import {
  getAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  setActiveAcademicYear,
  deleteAcademicYear,
} from '../services/academicYear.service';
import type { AcademicYear, AcademicYearFormData } from '../types/academicYear';

const token = () => localStorage.getItem('token') ?? '';

const EMPTY_FORM: AcademicYearFormData = {
  name: '',
  start_date: '',
  end_date: '',
  is_active: false,
};

export default function AcademicYears() {
  const [items, setItems]           = useState<AcademicYear[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [search, setSearch]         = useState('');
  const [searchInput, setSearchInput] = useState('');
  const LIMIT = 10;

  const [showModal, setShowModal]     = useState(false);
  const [editingItem, setEditingItem] = useState<AcademicYear | null>(null);
  const [form, setForm]               = useState<AcademicYearFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors]   = useState<string[]>([]);
  const [submitting, setSubmitting]   = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete]       = useState<AcademicYear | null>(null);
  const [deleting, setDeleting]               = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAcademicYears({ page, limit: LIMIT, search: search || undefined }, token());
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

  const openEdit = (item: AcademicYear) => {
    setEditingItem(item);
    setForm({
      name:       item.name,
      start_date: item.start_date.substring(0, 10),
      end_date:   item.end_date.substring(0, 10),
      is_active:  item.is_active,
    });
    setFormErrors([]);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingItem(null); setFormErrors([]); };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);

    if (!form.name.trim())   { setFormErrors(['Nama tahun ajaran wajib diisi']); return; }
    if (!form.start_date)    { setFormErrors(['Tanggal mulai wajib diisi']); return; }
    if (!form.end_date)      { setFormErrors(['Tanggal selesai wajib diisi']); return; }
    if (form.end_date <= form.start_date) { setFormErrors(['Tanggal selesai harus setelah tanggal mulai']); return; }

    setSubmitting(true);
    try {
      if (editingItem) {
        await updateAcademicYear(editingItem.id, form, token());
      } else {
        await createAcademicYear(form, token());
      }
      closeModal();
      fetchItems();
    } catch (err) {
      setFormErrors([err instanceof Error ? err.message : 'Gagal menyimpan']);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Set Active ─────────────────────────────────────────────────────────────

  const handleSetActive = async (item: AcademicYear) => {
    if (!confirm(`Set "${item.name}" sebagai tahun ajaran aktif?`)) return;
    try {
      await setActiveAcademicYear(item.id, token());
      fetchItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal mengaktifkan');
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const openDelete   = (item: AcademicYear) => { setItemToDelete(item); setShowDeleteModal(true); };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await deleteAcademicYear(itemToDelete.id, token());
      setShowDeleteModal(false);
      setItemToDelete(null);
      fetchItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus');
    } finally {
      setDeleting(false);
    }
  };

  const fmt = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

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
              placeholder="Cari tahun ajaran..."
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
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-semibold text-sm">
            <Plus className="w-4 h-4" />
            Tambah Tahun Ajaran
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
            <button onClick={fetchItems} className="text-sm text-blue-600 underline">Coba lagi</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">#</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Nama</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Mulai</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Selesai</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Status</th>
                  <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-gray-400">
                      <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Belum ada tahun ajaran</p>
                    </td>
                  </tr>
                ) : items.map((item, i) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-gray-400">{(page - 1) * LIMIT + i + 1}</td>
                    <td className="px-5 py-4 font-semibold text-gray-800">{item.name}</td>
                    <td className="px-5 py-4 text-gray-600">{fmt(item.start_date)}</td>
                    <td className="px-5 py-4 text-gray-600">{fmt(item.end_date)}</td>
                    <td className="px-5 py-4">
                      {item.is_active ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                          Aktif
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                          Tidak Aktif
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {!item.is_active && (
                          <button onClick={() => handleSetActive(item)} title="Set Aktif"
                            className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 border border-emerald-200 transition-colors">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
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
          dari <span className="font-semibold text-gray-800">{total}</span>
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
                {editingItem ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}
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
                  Nama Tahun Ajaran <span className="text-red-500">*</span>
                </label>
                <input name="name" value={form.name} onChange={handleInput} required
                  placeholder="contoh: 2026/2027"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Tanggal Mulai <span className="text-red-500">*</span>
                  </label>
                  <input name="start_date" type="date" value={form.start_date} onChange={handleInput} required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Tanggal Selesai <span className="text-red-500">*</span>
                  </label>
                  <input name="end_date" type="date" value={form.end_date} onChange={handleInput} required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input id="is_active" name="is_active" type="checkbox" checked={!!form.is_active} onChange={handleInput}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="is_active" className="text-sm font-semibold text-gray-700">
                  Set sebagai tahun ajaran aktif
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold text-sm">
                  Batal
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm disabled:opacity-60">
                  {submitting ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Hapus Tahun Ajaran</h3>
                <p className="text-sm text-gray-500">Tindakan ini tidak bisa dibatalkan</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Yakin ingin menghapus <span className="font-semibold">"{itemToDelete.name}"</span>?
              Semua kelas di tahun ajaran ini juga akan terhapus.
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
