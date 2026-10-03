import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Edit, Trash2, Search, X, CalendarRange,
  ChevronLeft, ChevronRight, Globe, GlobeLock, ClipboardList,
} from 'lucide-react';
import {
  getExams, createExam, updateExam, deleteExam, toggleExamPublish,
} from '../services/exam.service';
import { getExamTypesActive } from '../services/exam.service';
import { getAcademicYearsAll } from '../services/academicYear.service';
import type { Exam, ExamFormData, Semester } from '../types/exam';
import type { ExamType } from '../types/exam';
import type { AcademicYear } from '../types/academicYear';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/Toast';

const token = () => localStorage.getItem('token') ?? '';

const EMPTY_FORM: ExamFormData = {
  academic_year_id: '',
  exam_type_id: '',
  name: '',
  semester: '',
  start_date: '',
  end_date: '',
  is_published: false,
  notes: '',
};

export default function Exams() {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const canEdit   = user?.role === 'superuser' || user?.role === 'teacher';

  const [items, setItems]             = useState<Exam[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [page, setPage]               = useState(1);
  const [total, setTotal]             = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterYear, setFilterYear]   = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const LIMIT = 20;

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [examTypes, setExamTypes]         = useState<ExamType[]>([]);

  const [showModal, setShowModal]         = useState(false);
  const [editingItem, setEditingItem]     = useState<Exam | null>(null);
  const [form, setForm]                   = useState<ExamFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors]       = useState<string[]>([]);
  const [submitting, setSubmitting]       = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete]   = useState<Exam | null>(null);
  const [deleting, setDeleting]           = useState(false);
  const [toggling, setToggling]           = useState<string | null>(null);

  // ── Load dropdown data ─────────────────────────────────────────────────────

  useEffect(() => {
    const t = token();
    Promise.all([
      getAcademicYearsAll(t),
      getExamTypesActive(t),
    ]).then(([years, types]) => {
      setAcademicYears(years);
      setExamTypes(types);
    }).catch(() => {});
  }, []);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getExams({
        page, limit: LIMIT,
        search: search || undefined,
        academic_year_id: filterYear || undefined,
        semester: filterSemester || undefined,
      }, token());
      setItems(res.data);
      setTotal(res.metadata.total);
      setTotalPages(res.metadata.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterYear, filterSemester]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  // ── Modals ─────────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setFormErrors([]);
    setShowModal(true);
  };

  const openEdit = (item: Exam) => {
    setEditingItem(item);
    setForm({
      academic_year_id: item.academic_year_id,
      exam_type_id: item.exam_type_id,
      name: item.name,
      semester: item.semester,
      start_date: String(item.start_date).slice(0, 10),
      end_date: String(item.end_date).slice(0, 10),
      is_published: item.is_published,
      notes: item.notes ?? '',
    });
    setFormErrors([]);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingItem(null); setFormErrors([]); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);
    if (!form.semester) { setFormErrors(['Semester wajib dipilih']); return; }
    setSubmitting(true);
    try {
      const payload = { ...form, semester: form.semester as Semester };
      if (editingItem) {
        await updateExam(editingItem.id, payload, token());
        toast.success('Ujian berhasil diperbarui');
      } else {
        await createExam(payload, token());
        toast.success('Ujian berhasil ditambahkan');
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

  // ── Toggle publish ─────────────────────────────────────────────────────────

  const handleTogglePublish = async (exam: Exam) => {
    setToggling(exam.id);
    try {
      await toggleExamPublish(exam.id, token());
      const msg = exam.is_published ? 'Ujian disembunyikan' : 'Ujian dipublikasikan';
      toast.success(msg);
      fetchItems();
    } catch {
      toast.error('Gagal mengubah status publikasi');
    } finally {
      setToggling(null);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const openDelete  = (item: Exam) => { setItemToDelete(item); setShowDeleteModal(true); };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await deleteExam(itemToDelete.id, token());
      toast.success('Ujian berhasil dihapus');
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

  const semesterBadge = (s: Semester) => (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s === 'ganjil' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
      {s === 'ganjil' ? 'Ganjil' : 'Genap'}
    </span>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-800">Ujian</h1>
        <p className="text-sm text-gray-500">Kelola periode ujian (UTS, UAS, UKK, dll)</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" placeholder="Cari nama ujian..."
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
          {(search || filterYear || filterSemester) && (
            <button onClick={() => { setSearch(''); setSearchInput(''); setFilterYear(''); setFilterSemester(''); setPage(1); }}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1">
              <X className="w-4 h-4" /> Reset
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <select value={filterYear} onChange={e => { setFilterYear(e.target.value); setPage(1); }}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Semua Tahun Ajaran</option>
              {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
            </select>
            <select value={filterSemester} onChange={e => { setFilterSemester(e.target.value); setPage(1); }}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Semua Semester</option>
              <option value="ganjil">Ganjil</option>
              <option value="genap">Genap</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Total: <span className="font-semibold text-gray-800">{total}</span></span>
          {canEdit && (
            <button onClick={openCreate}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md font-semibold text-sm">
              <Plus className="w-4 h-4" /> Tambah Ujian
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
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Nama Ujian</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Jenis</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Semester</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Tanggal</th>
                  <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Jadwal</th>
                  <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Status</th>
                  {canEdit && <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 8 : 7} className="text-center py-16 text-gray-400">
                      <CalendarRange className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Belum ada data ujian</p>
                    </td>
                  </tr>
                ) : items.map((item, i) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-gray-400">{(page - 1) * LIMIT + i + 1}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.academic_year_name}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold font-mono">
                        {item.exam_type_code}
                      </span>
                    </td>
                    <td className="px-5 py-4">{semesterBadge(item.semester)}</td>
                    <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                      {new Date(item.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                      {' – '}
                      {new Date(item.end_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => navigate(`/dashboard/exams/${item.id}/schedules`)}
                        className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-800 font-medium text-xs bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-200">
                        <ClipboardList className="w-3.5 h-3.5" />
                        {item.schedule_count}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {canEdit ? (
                        <button
                          onClick={() => handleTogglePublish(item)}
                          disabled={toggling === item.id}
                          title={item.is_published ? 'Sembunyikan' : 'Publikasikan'}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors
                            ${item.is_published
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200'
                              : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'}`}>
                          {item.is_published
                            ? <><Globe className="w-3.5 h-3.5" /> Publik</>
                            : <><GlobeLock className="w-3.5 h-3.5" /> Draft</>}
                        </button>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {item.is_published ? 'Publik' : 'Draft'}
                        </span>
                      )}
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-5 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-800">
                {editingItem ? 'Edit Ujian' : 'Tambah Ujian'}
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
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Nama Ujian <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" required maxLength={200}
                    placeholder="contoh: UTS Ganjil 2026/2027"
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Tahun Ajaran <span className="text-red-500">*</span>
                  </label>
                  <select required value={form.academic_year_id}
                    onChange={e => setForm(prev => ({ ...prev, academic_year_id: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">— Pilih —</option>
                    {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Jenis Ujian <span className="text-red-500">*</span>
                  </label>
                  <select required value={form.exam_type_id}
                    onChange={e => setForm(prev => ({ ...prev, exam_type_id: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">— Pilih —</option>
                    {examTypes.map(et => <option key={et.id} value={et.id}>{et.code} — {et.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Semester <span className="text-red-500">*</span>
                  </label>
                  <select required value={form.semester}
                    onChange={e => setForm(prev => ({ ...prev, semester: e.target.value as Semester | '' }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">— Pilih —</option>
                    <option value="ganjil">Ganjil</option>
                    <option value="genap">Genap</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Tanggal Mulai <span className="text-red-500">*</span>
                  </label>
                  <input type="date" required value={form.start_date}
                    onChange={e => setForm(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Tanggal Selesai <span className="text-red-500">*</span>
                  </label>
                  <input type="date" required value={form.end_date}
                    onChange={e => setForm(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Catatan</label>
                  <textarea rows={2}
                    placeholder="Catatan tambahan..."
                    value={form.notes ?? ''}
                    onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
                </div>
                <div className="col-span-2 flex items-center gap-3">
                  <input type="checkbox" id="is_published"
                    checked={form.is_published ?? false}
                    onChange={e => setForm(prev => ({ ...prev, is_published: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded" />
                  <label htmlFor="is_published" className="text-sm font-medium text-gray-700">
                    Publikasikan (tampil ke siswa &amp; guru)
                  </label>
                </div>
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
                <h3 className="font-bold text-gray-800">Hapus Ujian</h3>
                <p className="text-sm text-gray-500">Semua jadwal ujian terkait juga akan dihapus.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Apakah Anda yakin ingin menghapus ujian <strong>{itemToDelete.name}</strong>?
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
