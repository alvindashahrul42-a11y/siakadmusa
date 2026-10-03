import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, Edit, Trash2, Search, X, ArrowLeft,
  CalendarDays, ChevronLeft, ChevronRight, UserCheck, Users, BarChart2,
} from 'lucide-react';
import {
  getExamSchedules, createExamSchedule, updateExamSchedule, deleteExamSchedule,
  getExamSupervisors, createExamSupervisor, deleteExamSupervisor,
} from '../services/exam.service';
import { getExamById } from '../services/exam.service';
import { getTeachers } from '../services/teacher.service';
import type { ExamSchedule, ExamScheduleFormData, ExamSupervisor, Exam } from '../types/exam';
import type { Teacher } from '../types/teacher';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/Toast';
import TimePicker from '../components/TimePicker';

const token = () => localStorage.getItem('token') ?? '';

const EMPTY_FORM: ExamScheduleFormData = {
  exam_id: '',
  class_subject_id: '',
  exam_date: '',
  start_time: '',
  end_time: '',
  room: '',
  notes: '',
};

export default function ExamSchedules() {
  const { examId } = useParams<{ examId: string }>();
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const canEdit    = user?.role === 'superuser' || user?.role === 'teacher';

  const [exam, setExam]               = useState<Exam | null>(null);
  const [items, setItems]             = useState<ExamSchedule[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [page, setPage]               = useState(1);
  const [total, setTotal]             = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const LIMIT = 50;

  // Dropdown data
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  // Schedule modal
  const [showModal, setShowModal]         = useState(false);
  const [editingItem, setEditingItem]     = useState<ExamSchedule | null>(null);
  const [form, setForm]                   = useState<ExamScheduleFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors]       = useState<string[]>([]);
  const [submitting, setSubmitting]       = useState(false);

  // Delete schedule modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete]       = useState<ExamSchedule | null>(null);
  const [deleting, setDeleting]               = useState(false);

  // Supervisor panel (inline)
  const [svPanel, setSvPanel]           = useState<string | null>(null); // scheduleId
  const [supervisors, setSupervisors]   = useState<Record<string, ExamSupervisor[]>>({});
  const [svTeacherId, setSvTeacherId]   = useState('');
  const [svSubmitting, setSvSubmitting] = useState(false);

  // ── Bootstrap ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!examId) return;
    const t = token();
    getExamById(examId, t)
      .then(e => setExam(e))
      .catch(() => {});

    // Load teachers for supervisor dropdown
    getTeachers({ limit: 999 }, t)
      .then(res => setTeachers(res.data))
      .catch(() => {});
  }, [examId]);

  // ── Fetch schedules ────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    if (!examId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getExamSchedules(
        { exam_id: examId, page, limit: LIMIT, search: search || undefined },
        token()
      );
      setItems(res.data);
      setTotal(res.metadata.total);
      setTotalPages(res.metadata.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat jadwal');
    } finally {
      setLoading(false);
    }
  }, [examId, page, search]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  // ── Schedule modal helpers ─────────────────────────────────────────────────

  const openCreate = async () => {
    setEditingItem(null);
    setForm({ ...EMPTY_FORM, exam_id: examId! });
    setFormErrors([]);
    setShowModal(true);
  };

  const openEdit = (item: ExamSchedule) => {
    setEditingItem(item);
    setForm({
      exam_id: item.exam_id,
      class_subject_id: item.class_subject_id,
      exam_date: String(item.exam_date).slice(0, 10),
      start_time: String(item.start_time).slice(0, 5),
      end_time: String(item.end_time).slice(0, 5),
      room: item.room ?? '',
      notes: item.notes ?? '',
    });
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
        await updateExamSchedule(editingItem.id, {
          exam_date:  form.exam_date,
          start_time: form.start_time,
          end_time:   form.end_time,
          room:       form.room || undefined,
          notes:      form.notes || undefined,
        }, token());
        toast.success('Jadwal ujian berhasil diperbarui');
      } else {
        await createExamSchedule(form, token());
        toast.success('Jadwal ujian berhasil ditambahkan');
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

  const openDelete = (item: ExamSchedule) => { setItemToDelete(item); setShowDeleteModal(true); };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await deleteExamSchedule(itemToDelete.id, token());
      toast.success('Jadwal ujian berhasil dihapus');
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

  // ── Supervisor panel ───────────────────────────────────────────────────────

  const openSvPanel = async (scheduleId: string) => {
    if (svPanel === scheduleId) { setSvPanel(null); return; }
    setSvPanel(scheduleId);
    setSvTeacherId('');
    if (!supervisors[scheduleId]) {
      try {
        const svs = await getExamSupervisors(scheduleId, token());
        setSupervisors(prev => ({ ...prev, [scheduleId]: svs }));
      } catch {/* ignore */}
    }
  };

  const handleAddSupervisor = async (scheduleId: string) => {
    if (!svTeacherId) return;
    setSvSubmitting(true);
    try {
      await createExamSupervisor({ exam_schedule_id: scheduleId, teacher_id: svTeacherId }, token());
      const svs = await getExamSupervisors(scheduleId, token());
      setSupervisors(prev => ({ ...prev, [scheduleId]: svs }));
      setSvTeacherId('');
      toast.success('Pengawas berhasil ditambahkan');
      fetchItems(); // refresh supervisor_count
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message ?? 'Gagal menambahkan pengawas';
      toast.error('Gagal', msg);
    } finally {
      setSvSubmitting(false);
    }
  };

  const handleRemoveSupervisor = async (scheduleId: string, svId: string) => {
    try {
      await deleteExamSupervisor(svId, token());
      setSupervisors(prev => ({
        ...prev,
        [scheduleId]: (prev[scheduleId] ?? []).filter(sv => sv.id !== svId),
      }));
      toast.success('Pengawas berhasil dihapus');
      fetchItems();
    } catch {
      toast.error('Gagal menghapus pengawas');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/dashboard/exams')}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Jadwal Ujian — {exam?.name ?? '...'}
          </h1>
          <p className="text-sm text-gray-500">
            {exam ? `${exam.exam_type_name} · ${exam.semester === 'ganjil' ? 'Ganjil' : 'Genap'} · ${exam.academic_year_name}` : ''}
          </p>
        </div>
        {exam && (
          <span className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold ${exam.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
            {exam.is_published ? 'Publik' : 'Draft'}
          </span>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" placeholder="Cari mapel atau kelas..."
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
              <Plus className="w-4 h-4" /> Tambah Jadwal
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">Memuat jadwal...</div>
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
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Kelas</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Mata Pelajaran</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Tanggal</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Waktu</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Ruangan</th>
                  <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Pengawas</th>
                  <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Hasil</th>
                  {canEdit && <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 9 : 8} className="text-center py-16 text-gray-400">
                      <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Belum ada jadwal ujian</p>
                    </td>
                  </tr>
                ) : items.map((item, i) => (
                  <>
                    <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${svPanel === item.id ? 'bg-blue-50' : ''}`}>
                      <td className="px-5 py-4 text-gray-400">{(page - 1) * LIMIT + i + 1}</td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          {item.class_name}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-800">{item.subject_name}</p>
                        <p className="text-xs text-gray-400">{item.teacher_name ?? 'Belum ditugaskan'}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                        {new Date(item.exam_date).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4 font-mono text-gray-700 whitespace-nowrap">
                        {String(item.start_time).slice(0, 5)} – {String(item.end_time).slice(0, 5)}
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {item.room ?? <span className="italic text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => openSvPanel(item.id)}
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors
                            ${svPanel === item.id
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'}`}>
                          <Users className="w-3.5 h-3.5" />
                          {item.supervisor_count}
                        </button>
                      </td>
                      {/* Hasil ujian */}
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => navigate(`/dashboard/exams/${item.id}/results`)}
                          className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 transition-colors">
                          <BarChart2 className="w-3.5 h-3.5" />
                          {item.attempt_count ?? 0}
                        </button>
                      </td>
                      {canEdit && (
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => openEdit(item)}
                              className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => openDelete(item)}
                              className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>

                    {/* Supervisor inline panel */}
                    {svPanel === item.id && (
                      <tr key={`sv-${item.id}`}>
                        <td colSpan={canEdit ? 9 : 8} className="px-5 py-4 bg-blue-50 border-b border-blue-100">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                              <UserCheck className="w-4 h-4" />
                              Pengawas — {item.subject_name} ({item.class_name})
                            </div>

                            {/* Supervisor list */}
                            <div className="flex flex-wrap gap-2">
                              {(supervisors[item.id] ?? []).length === 0 ? (
                                <span className="text-xs text-gray-400 italic">Belum ada pengawas</span>
                              ) : (supervisors[item.id] ?? []).map(sv => (
                                <span key={sv.id}
                                  className="inline-flex items-center gap-1.5 bg-white border border-blue-200 text-blue-800 rounded-full px-3 py-1 text-xs font-medium">
                                  {sv.teacher_name}
                                  {canEdit && (
                                    <button onClick={() => handleRemoveSupervisor(item.id, sv.id)}
                                      className="text-red-400 hover:text-red-600 ml-0.5">
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </span>
                              ))}
                            </div>

                            {/* Add supervisor */}
                            {canEdit && (
                              <div className="flex gap-2 items-center">
                                <select value={svTeacherId} onChange={e => setSvTeacherId(e.target.value)}
                                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 min-w-[220px]">
                                  <option value="">— Pilih guru pengawas —</option>
                                  {teachers
                                    .filter(t => !(supervisors[item.id] ?? []).some(sv => sv.teacher_id === t.id))
                                    .map(t => (
                                      <option key={t.id} value={t.id}>{t.full_name} ({t.teacher_number})</option>
                                    ))}
                                </select>
                                <button
                                  onClick={() => handleAddSupervisor(item.id)}
                                  disabled={!svTeacherId || svSubmitting}
                                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
                                  <Plus className="w-3.5 h-3.5" />
                                  {svSubmitting ? 'Menambah...' : 'Tambah'}
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
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

      {/* Create / Edit Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center px-6 py-5 border-b">
              <h2 className="text-lg font-bold text-gray-800">
                {editingItem ? 'Edit Jadwal Ujian' : 'Tambah Jadwal Ujian'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  {formErrors.map((e, i) => <p key={i} className="text-red-600 text-sm">{e}</p>)}
                </div>
              )}

              {/* class_subject_id — text input when creating (user must know the ID from class pages) */}
              {!editingItem && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    ID Kelas-Mata Pelajaran <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" required
                    placeholder="Salin ID dari halaman Kelas → Mata Pelajaran"
                    value={form.class_subject_id}
                    onChange={e => setForm(prev => ({ ...prev, class_subject_id: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Buka Kelas → Mata Pelajaran, klik kanan baris yang diinginkan dan salin ID-nya.
                  </p>
                </div>
              )}
              {editingItem && (
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  <span className="font-semibold text-gray-700">{editingItem.subject_name}</span>
                  <span className="text-gray-500"> · {editingItem.class_name}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Tanggal Ujian <span className="text-red-500">*</span>
                  </label>
                  <input type="date" required value={form.exam_date}
                    onChange={e => setForm(prev => ({ ...prev, exam_date: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Jam Mulai <span className="text-red-500">*</span>
                  </label>
                  <TimePicker
                    value={form.start_time}
                    onChange={v => setForm(prev => ({ ...prev, start_time: v }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Jam Selesai <span className="text-red-500">*</span>
                  </label>
                  <TimePicker
                    value={form.end_time}
                    onChange={v => setForm(prev => ({ ...prev, end_time: v }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ruangan</label>
                  <input type="text" maxLength={100}
                    placeholder="contoh: Lab TKJ"
                    value={form.room ?? ''}
                    onChange={e => setForm(prev => ({ ...prev, room: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Catatan</label>
                <textarea rows={2}
                  placeholder="Catatan tambahan..."
                  value={form.notes ?? ''}
                  onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
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
                <h3 className="font-bold text-gray-800">Hapus Jadwal Ujian</h3>
                <p className="text-sm text-gray-500">Data pengawas juga akan ikut terhapus.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Apakah Anda yakin ingin menghapus jadwal <strong>{itemToDelete.subject_name}</strong> kelas <strong>{itemToDelete.class_name}</strong>?
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
