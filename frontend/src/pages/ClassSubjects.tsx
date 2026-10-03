import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, X, BookOpen, ArrowLeft, CalendarDays, ClipboardList, ClipboardCheck } from 'lucide-react';
import { getClassSubjects, createClassSubject, updateClassSubject, deleteClassSubject } from '../services/classSubject.service';
import { getSubjectsAll } from '../services/subject.service';
import { getTeachers } from '../services/teacher.service';
import { getClassById } from '../services/class.service';
import type { ClassSubject, ClassSubjectFormData, ClassSubjectUpdateData } from '../types/classSubject';
import type { Subject } from '../types/subject';
import type { Teacher } from '../types/teacher';
import type { Class } from '../types/class';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/Toast';

const token = () => localStorage.getItem('token') ?? '';

export default function ClassSubjects() {
  const { classId } = useParams<{ classId: string }>();
  const navigate    = useNavigate();
  const { user }    = useAuth();
  const canEdit     = user?.role === 'superuser' || user?.role === 'teacher';

  const [classData, setClassData]       = useState<Class | null>(null);
  const [items, setItems]               = useState<ClassSubject[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [page, setPage]                 = useState(1);
  const [total, setTotal]               = useState(0);
  const [totalPages, setTotalPages]     = useState(1);
  const [search, setSearch]             = useState('');
  const [searchInput, setSearchInput]   = useState('');
  const LIMIT = 20;

  const [subjects, setSubjects]   = useState<Subject[]>([]);
  const [teachers, setTeachers]   = useState<Teacher[]>([]);

  const [showModal, setShowModal]         = useState(false);
  const [editingItem, setEditingItem]     = useState<ClassSubject | null>(null);
  const [createForm, setCreateForm]       = useState<ClassSubjectFormData>({ subject_id: '', teacher_id: '' });
  const [editForm, setEditForm]           = useState<ClassSubjectUpdateData>({ teacher_id: '' });
  const [formErrors, setFormErrors]       = useState<string[]>([]);
  const [submitting, setSubmitting]       = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete]   = useState<ClassSubject | null>(null);
  const [deleting, setDeleting]           = useState(false);

  // ── Load dropdown data ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!classId) return;
    const t = token();
    Promise.all([
      getClassById(classId, t),
      getSubjectsAll(t),
      getTeachers({ limit: 999 }, t),
    ]).then(([cls, subs, trs]) => {
      setClassData(cls);
      setSubjects(subs);
      setTeachers(trs.data);
    }).catch(() => {});
  }, [classId]);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    if (!classId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getClassSubjects(classId, { page, limit: LIMIT, search: search || undefined }, token());
      setItems(res.data);
      setTotal(res.metadata.total);
      setTotalPages(res.metadata.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [classId, page, search]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  // ── Modals ─────────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingItem(null);
    setCreateForm({ subject_id: '', teacher_id: '' });
    setFormErrors([]);
    setShowModal(true);
  };

  const openEdit = (item: ClassSubject) => {
    setEditingItem(item);
    setEditForm({ teacher_id: item.teacher_id ?? '' });
    setFormErrors([]);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingItem(null); setFormErrors([]); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);
    if (!editingItem && !createForm.subject_id) {
      setFormErrors(['Mata pelajaran wajib dipilih']); return;
    }
    setSubmitting(true);
    try {
      if (editingItem) {
        await updateClassSubject(classId!, editingItem.id, {
          teacher_id: editForm.teacher_id || null,
        }, token());
        toast.success('Guru pengampu berhasil diperbarui');
      } else {
        await createClassSubject(classId!, {
          subject_id: createForm.subject_id,
          teacher_id: createForm.teacher_id || undefined,
        }, token());
        toast.success('Mata pelajaran berhasil ditambahkan ke kelas');
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

  const openDelete = (item: ClassSubject) => { setItemToDelete(item); setShowDeleteModal(true); };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await deleteClassSubject(classId!, itemToDelete.id, token());
      toast.success('Mata pelajaran berhasil dihapus dari kelas');
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
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/dashboard/classes')}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Mata Pelajaran — {classData?.name ?? '...'}
          </h1>
          <p className="text-sm text-gray-500">
            {classData ? `Kelas ${classData.grade_level} · ${classData.academic_year_name}` : ''}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari mata pelajaran..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <button onClick={handleSearch}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
            Cari
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Total: <span className="font-semibold text-gray-800">{total}</span></span>
          {canEdit && (
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
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Mata Pelajaran</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Guru Pengampu</th>
                  <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Jadwal</th>
                  <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Nilai</th>
                  <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Absensi</th>
                  {canEdit && <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 8 : 7} className="text-center py-16 text-gray-400">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Belum ada mata pelajaran di kelas ini</p>
                    </td>
                  </tr>
                ) : items.map((item, i) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-gray-400">{(page - 1) * LIMIT + i + 1}</td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold font-mono">
                        {item.subject_code}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-800">{item.subject_name}</td>
                    <td className="px-5 py-4 text-gray-600">
                      {item.teacher_name
                        ? <span>{item.teacher_name} <span className="text-xs text-gray-400">({item.teacher_number})</span></span>
                        : <span className="text-gray-400 italic">Belum ditugaskan</span>}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => navigate(`/dashboard/classes/${classId}/subjects/${item.id}/schedules`)}
                        className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-800 font-medium text-xs bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-200">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {item.schedule_count}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => navigate(`/dashboard/classes/${classId}/subjects/${item.id}/grades`)}
                        className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800 font-medium text-xs bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <ClipboardList className="w-3.5 h-3.5" />
                        {item.grade_count}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => navigate(`/dashboard/classes/${classId}/subjects/${item.id}/attendance`)}
                        className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-800 font-medium text-xs bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        Absensi
                      </button>
                    </td>
                    {canEdit && (
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(item)} title="Ubah guru"
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">
            Menampilkan <span className="font-semibold text-gray-800">{total === 0 ? 0 : (page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)}</span> dari <span className="font-semibold text-gray-800">{total}</span>
          </p>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><span className="w-4 h-4 flex items-center justify-center text-sm">›</span></button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && !editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-5 border-b">
              <h2 className="text-lg font-bold text-gray-800">Tambah Mata Pelajaran ke Kelas</h2>
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
                  Mata Pelajaran <span className="text-red-500">*</span>
                </label>
                <select value={createForm.subject_id}
                  onChange={e => setCreateForm(prev => ({ ...prev, subject_id: e.target.value }))}
                  required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">— Pilih Mata Pelajaran —</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Guru Pengampu</label>
                <select value={createForm.teacher_id ?? ''}
                  onChange={e => setCreateForm(prev => ({ ...prev, teacher_id: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">— Belum Ditugaskan —</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name} ({t.teacher_number})</option>
                  ))}
                </select>
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

      {/* Edit Modal */}
      {showModal && editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-5 border-b">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Ubah Guru Pengampu</h2>
                <p className="text-sm text-gray-500">{editingItem.subject_code} — {editingItem.subject_name}</p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  {formErrors.map((e, i) => <p key={i} className="text-red-600 text-sm">{e}</p>)}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Guru Pengampu</label>
                <select value={editForm.teacher_id ?? ''}
                  onChange={e => setEditForm({ teacher_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">— Belum Ditugaskan —</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name} ({t.teacher_number})</option>
                  ))}
                </select>
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

      {/* Delete Confirm */}
      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Hapus Mata Pelajaran dari Kelas</h3>
            <p className="text-sm text-gray-600 mb-6">
              Hapus <span className="font-semibold">{itemToDelete.subject_name}</span> dari kelas ini?
              Data jadwal, nilai, dan absensi terkait juga akan dihapus.
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
