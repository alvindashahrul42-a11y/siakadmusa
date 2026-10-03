import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, X, Users, School } from 'lucide-react';
import { getClasses, createClass, updateClass, deleteClass } from '../services/class.service';
import { getAcademicYearsAll } from '../services/academicYear.service';
import { getMajorsAll } from '../services/major.service';
import { getTeachers } from '../services/teacher.service';
import type { Class, ClassFormData } from '../types/class';
import type { AcademicYear } from '../types/academicYear';
import type { Major } from '../types/major';
import type { Teacher } from '../types/teacher';
import { useNavigate } from 'react-router-dom';

const token = () => localStorage.getItem('token') ?? '';

const GRADE_LEVELS = [10, 11, 12];

const EMPTY_FORM: ClassFormData = {
  academic_year_id: '',
  major_id: '',
  homeroom_teacher_id: '',
  name: '',
  grade_level: '',
  capacity: '',
  is_active: true,
};

export default function Classes() {
  const navigate = useNavigate();

  const [items, setItems]           = useState<Class[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  // filters
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [search, setSearch]         = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterYear, setFilterYear]   = useState('');
  const LIMIT = 10;

  // dropdown data
  const [years, setYears]       = useState<AcademicYear[]>([]);
  const [majors, setMajors]     = useState<Major[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  // modal
  const [showModal, setShowModal]     = useState(false);
  const [editingItem, setEditingItem] = useState<Class | null>(null);
  const [form, setForm]               = useState<ClassFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors]   = useState<string[]>([]);
  const [submitting, setSubmitting]   = useState(false);

  // delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete]       = useState<Class | null>(null);
  const [deleting, setDeleting]               = useState(false);

  // ── Load dropdown data ─────────────────────────────────────────────────────

  useEffect(() => {
    const t = token();
    Promise.all([
      getAcademicYearsAll(t),
      getMajorsAll(t),
      getTeachers({ limit: 999 }, t),
    ]).then(([y, m, tr]) => {
      setYears(y);
      setMajors(m);
      setTeachers(tr.data);
    }).catch(() => {});
  }, []);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getClasses(
        {
          page,
          limit: LIMIT,
          search: search || undefined,
          academic_year_id: filterYear || undefined,
        },
        token()
      );
      setItems(res.data);
      setTotal(res.metadata.total);
      setTotalPages(res.metadata.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterYear]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  // ── Modals ─────────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingItem(null);
    // Pre-select active year
    const activeYear = years.find(y => y.is_active);
    setForm({ ...EMPTY_FORM, academic_year_id: activeYear?.id ?? '' });
    setFormErrors([]);
    setShowModal(true);
  };

  const openEdit = (item: Class) => {
    setEditingItem(item);
    setForm({
      academic_year_id:   item.academic_year_id,
      major_id:           item.major_id ?? '',
      homeroom_teacher_id: item.homeroom_teacher_id ?? '',
      name:               item.name,
      grade_level:        item.grade_level,
      capacity:           item.capacity ?? '',
      is_active:          item.is_active,
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
    if (!form.academic_year_id) { setFormErrors(['Tahun ajaran wajib dipilih']); return; }
    if (!form.name.trim())      { setFormErrors(['Nama kelas wajib diisi']); return; }
    if (!form.grade_level)      { setFormErrors(['Tingkat kelas wajib dipilih']); return; }

    setSubmitting(true);
    try {
      const payload: ClassFormData = {
        academic_year_id:   form.academic_year_id,
        major_id:           form.major_id || undefined,
        homeroom_teacher_id: form.homeroom_teacher_id || undefined,
        name:               form.name.trim(),
        grade_level:        Number(form.grade_level),
        capacity:           form.capacity ? Number(form.capacity) : undefined,
        is_active:          form.is_active,
      };
      if (editingItem) {
        await updateClass(editingItem.id, payload, token());
      } else {
        await createClass(payload, token());
      }
      closeModal();
      fetchItems();
    } catch (err) {
      setFormErrors([err instanceof Error ? err.message : 'Gagal menyimpan']);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const openDelete    = (item: Class) => { setItemToDelete(item); setShowDeleteModal(true); };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await deleteClass(itemToDelete.id, token());
      setShowDeleteModal(false);
      setItemToDelete(null);
      fetchItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus');
    } finally {
      setDeleting(false);
    }
  };

  const gradeBadge = (g: number) => {
    const colors: Record<number, string> = {
      10: 'bg-sky-100 text-sky-700',
      11: 'bg-violet-100 text-violet-700',
      12: 'bg-amber-100 text-amber-700',
    };
    return colors[g] ?? 'bg-gray-100 text-gray-600';
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama kelas..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <select
            value={filterYear}
            onChange={e => { setFilterYear(e.target.value); setPage(1); }}
            className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Semua Tahun Ajaran</option>
            {years.map(y => <option key={y.id} value={y.id}>{y.name}{y.is_active ? ' (Aktif)' : ''}</option>)}
          </select>
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
            Tambah Kelas
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
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Nama Kelas</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Tingkat</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Tahun Ajaran</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Jurusan</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Wali Kelas</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Siswa</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Status</th>
                  <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-gray-400">
                      <School className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Belum ada kelas</p>
                    </td>
                  </tr>
                ) : items.map((item, i) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-gray-400">{(page - 1) * LIMIT + i + 1}</td>
                    <td className="px-5 py-4 font-semibold text-gray-800">{item.name}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${gradeBadge(item.grade_level)}`}>
                        Kelas {item.grade_level}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{item.academic_year_name}</td>
                    <td className="px-5 py-4 text-gray-600">
                      {item.major_code
                        ? <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-semibold">{item.major_code}</span>
                        : '—'}
                    </td>
                    <td className="px-5 py-4 text-gray-600">{item.homeroom_teacher_name ?? '—'}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => navigate(`/dashboard/classes/${item.id}/students`)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                        title="Kelola siswa kelas"
                      >
                        <Users className="w-4 h-4" />
                        <span>{item.student_count}</span>
                        {item.capacity ? <span className="text-gray-400">/{item.capacity}</span> : null}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {item.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-5 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-800">
                {editingItem ? 'Edit Kelas' : 'Tambah Kelas'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  {formErrors.map((e, i) => <p key={i} className="text-red-600 text-sm">{e}</p>)}
                </div>
              )}

              {/* Tahun Ajaran */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Tahun Ajaran <span className="text-red-500">*</span>
                </label>
                <select name="academic_year_id" value={form.academic_year_id} onChange={handleInput} required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">— Pilih Tahun Ajaran —</option>
                  {years.map(y => (
                    <option key={y.id} value={y.id}>
                      {y.name}{y.is_active ? ' ✓ Aktif' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nama Kelas & Tingkat */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Nama Kelas <span className="text-red-500">*</span>
                  </label>
                  <input name="name" value={form.name} onChange={handleInput} required
                    placeholder="contoh: X TKJ 1"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Tingkat <span className="text-red-500">*</span>
                  </label>
                  <select name="grade_level" value={form.grade_level} onChange={handleInput} required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">— Pilih —</option>
                    {GRADE_LEVELS.map(g => <option key={g} value={g}>Kelas {g}</option>)}
                  </select>
                </div>
              </div>

              {/* Jurusan */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Jurusan</label>
                <select name="major_id" value={form.major_id ?? ''} onChange={handleInput}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">— Tanpa Jurusan —</option>
                  {majors.map(m => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
                </select>
              </div>

              {/* Wali Kelas */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Wali Kelas</label>
                <select name="homeroom_teacher_id" value={form.homeroom_teacher_id ?? ''} onChange={handleInput}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">— Tidak Ditentukan —</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </div>

              {/* Kapasitas */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kapasitas Siswa</label>
                <input name="capacity" type="number" min={1} max={60} value={form.capacity ?? ''} onChange={handleInput}
                  placeholder="Kosongkan jika tidak terbatas"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <input id="class_is_active" name="is_active" type="checkbox" checked={!!form.is_active} onChange={handleInput}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="class_is_active" className="text-sm font-semibold text-gray-700">Kelas Aktif</label>
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
                <h3 className="text-lg font-bold text-gray-900">Hapus Kelas</h3>
                <p className="text-sm text-gray-500">Semua data siswa kelas ini juga akan terhapus</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Yakin ingin menghapus kelas <span className="font-semibold">"{itemToDelete.name}"</span>?
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
