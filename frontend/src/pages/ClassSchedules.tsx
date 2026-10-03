import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, X, CalendarDays, ArrowLeft, Clock } from 'lucide-react';
import {
  getSchedulesByClass,
  getSchedulesByClassSubject,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from '../services/schedule.service';
import { getClassSubjects } from '../services/classSubject.service';
import { getClassById } from '../services/class.service';
import type { Schedule, ScheduleFormData } from '../types/schedule';
import type { ClassSubject } from '../types/classSubject';
import type { Class } from '../types/class';
import { DAY_NAMES } from '../types/schedule';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/Toast';

const token = () => localStorage.getItem('token') ?? '';

const DAY_OPTIONS = [1, 2, 3, 4, 5, 6];

const EMPTY_FORM: ScheduleFormData = {
  class_subject_id: '',
  day_of_week: '',
  start_time: '',
  end_time: '',
  room: '',
};

export default function ClassSchedules() {
  const { classId, classSubjectId } = useParams<{ classId: string; classSubjectId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit  = user?.role === 'superuser' || user?.role === 'teacher';

  const [classData, setClassData]     = useState<Class | null>(null);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [activeCs, setActiveCs]       = useState<ClassSubject | null>(null);
  const [schedules, setSchedules]     = useState<Schedule[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [filterDay, setFilterDay]     = useState<string>('');

  const [showModal, setShowModal]         = useState(false);
  const [editingItem, setEditingItem]     = useState<Schedule | null>(null);
  const [form, setForm]                   = useState<ScheduleFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors]       = useState<string[]>([]);
  const [submitting, setSubmitting]       = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete]   = useState<Schedule | null>(null);
  const [deleting, setDeleting]           = useState(false);

  // ── Load metadata ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!classId) return;
    const t = token();
    Promise.all([
      getClassById(classId, t),
      getClassSubjects(classId, { limit: 100 }, t),
    ]).then(([cls, csRes]) => {
      setClassData(cls);
      setClassSubjects(csRes.data);
      if (classSubjectId) {
        const found = csRes.data.find(cs => cs.id === classSubjectId);
        setActiveCs(found ?? null);
      }
    }).catch(() => {});
  }, [classId, classSubjectId]);

  // ── Fetch schedules ────────────────────────────────────────────────────────

  const fetchSchedules = useCallback(async () => {
    if (!classId) return;
    try {
      setLoading(true);
      setError(null);
      let data: Schedule[];
      if (classSubjectId) {
        data = await getSchedulesByClassSubject(classId, classSubjectId, token());
      } else {
        data = await getSchedulesByClass(classId, filterDay ? { day_of_week: parseInt(filterDay) } : undefined, token());
      }
      setSchedules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat jadwal');
    } finally {
      setLoading(false);
    }
  }, [classId, classSubjectId, filterDay]);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  // ── Modals ─────────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingItem(null);
    setForm({ ...EMPTY_FORM, class_subject_id: classSubjectId ?? '' });
    setFormErrors([]);
    setShowModal(true);
  };

  const openEdit = (item: Schedule) => {
    setEditingItem(item);
    setForm({
      class_subject_id: item.class_subject_id,
      day_of_week:      item.day_of_week,
      start_time:       item.start_time,
      end_time:         item.end_time,
      room:             item.room ?? '',
    });
    setFormErrors([]);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingItem(null); setFormErrors([]); };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);
    if (!form.class_subject_id) { setFormErrors(['Mata pelajaran wajib dipilih']); return; }
    if (!form.day_of_week)      { setFormErrors(['Hari wajib dipilih']); return; }
    if (!form.start_time)       { setFormErrors(['Jam mulai wajib diisi']); return; }
    if (!form.end_time)         { setFormErrors(['Jam selesai wajib diisi']); return; }
    if (form.start_time >= form.end_time) { setFormErrors(['Jam selesai harus lebih dari jam mulai']); return; }

    setSubmitting(true);
    try {
      const { class_subject_id, ...rest } = form;
      // Find the classSubjectId to use — either from URL param or form selection
      const csId = classSubjectId ?? class_subject_id;
      if (editingItem) {
        await updateSchedule(editingItem.id, {
          day_of_week: Number(rest.day_of_week),
          start_time:  rest.start_time,
          end_time:    rest.end_time,
          room:        rest.room || undefined,
        }, token());
        toast.success('Jadwal berhasil diperbarui');
      } else {
        await createSchedule(classId!, csId, {
          day_of_week: Number(rest.day_of_week),
          start_time:  rest.start_time,
          end_time:    rest.end_time,
          room:        rest.room || undefined,
        }, token());
        toast.success('Jadwal berhasil ditambahkan');
      }
      closeModal();
      fetchSchedules();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message ?? 'Gagal menyimpan';
      setFormErrors([msg]);
      toast.error('Gagal menyimpan jadwal', msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const openDelete    = (item: Schedule) => { setItemToDelete(item); setShowDeleteModal(true); };
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await deleteSchedule(itemToDelete.id, token());
      setShowDeleteModal(false);
      setItemToDelete(null);
      fetchSchedules();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      alert(axiosErr?.response?.data?.message ?? 'Gagal menghapus');
    } finally {
      setDeleting(false);
    }
  };

  // ── Group by day ───────────────────────────────────────────────────────────

  const grouped = DAY_OPTIONS.reduce<Record<number, Schedule[]>>((acc, d) => {
    acc[d] = schedules.filter(s => s.day_of_week === d);
    return acc;
  }, {} as Record<number, Schedule[]>);

  const dayColors: Record<number, string> = {
    1: 'bg-blue-50 border-blue-200 text-blue-700',
    2: 'bg-violet-50 border-violet-200 text-violet-700',
    3: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    4: 'bg-amber-50 border-amber-200 text-amber-700',
    5: 'bg-rose-50 border-rose-200 text-rose-700',
    6: 'bg-gray-50 border-gray-200 text-gray-700',
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => classSubjectId
          ? navigate(`/dashboard/classes/${classId}/subjects`)
          : navigate('/dashboard/classes')}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Jadwal — {classData?.name ?? '...'}
            {activeCs ? ` · ${activeCs.subject_name}` : ''}
          </h1>
          <p className="text-sm text-gray-500">
            {classData ? `Kelas ${classData.grade_level} · ${classData.academic_year_name}` : ''}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        {!classSubjectId && (
          <select value={filterDay} onChange={e => setFilterDay(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Semua Hari</option>
            {DAY_OPTIONS.map(d => <option key={d} value={d}>{DAY_NAMES[d]}</option>)}
          </select>
        )}
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-sm text-gray-500">Total: <span className="font-semibold text-gray-800">{schedules.length}</span> slot</span>
          {canEdit && classSubjectId && (
            <button onClick={openCreate}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md font-semibold text-sm">
              <Plus className="w-4 h-4" /> Tambah Jadwal
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">Memuat jadwal...</div>
      ) : error ? (
        <div className="p-6 text-center bg-white rounded-xl border">
          <p className="text-red-600 mb-3">{error}</p>
          <button onClick={fetchSchedules} className="text-sm text-blue-600 underline">Coba lagi</button>
        </div>
      ) : schedules.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center text-gray-400">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Belum ada jadwal</p>
        </div>
      ) : (
        <div className="space-y-4">
          {DAY_OPTIONS.filter(d => grouped[d].length > 0 || !filterDay || parseInt(filterDay) === d).map(day => (
            grouped[day].length > 0 && (
              <div key={day} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className={`px-5 py-3 border-b ${dayColors[day]} font-semibold text-sm`}>
                  {DAY_NAMES[day]}
                </div>
                <div className="divide-y divide-gray-50">
                  {grouped[day]
                    .sort((a, b) => a.start_time.localeCompare(b.start_time))
                    .map(item => (
                      <div key={item.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-gray-500 text-sm min-w-[100px]">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="font-mono">{item.start_time.slice(0, 5)}–{item.end_time.slice(0, 5)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">
                              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded mr-2">
                                {item.subject_code}
                              </span>
                              {item.subject_name}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {item.teacher_name ?? 'Belum ada guru'}
                              {item.room && <span className="ml-2 text-gray-400">· {item.room}</span>}
                            </p>
                          </div>
                        </div>
                        {canEdit && (
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEdit(item)} title="Edit"
                              className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200 transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => openDelete(item)} title="Hapus"
                              className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-5 border-b">
              <h2 className="text-lg font-bold text-gray-800">
                {editingItem ? 'Edit Jadwal' : 'Tambah Jadwal'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  {formErrors.map((e, i) => <p key={i} className="text-red-600 text-sm">{e}</p>)}
                </div>
              )}
              {/* Mata pelajaran — only show when not scoped to a classSubject */}
              {!classSubjectId && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Mata Pelajaran <span className="text-red-500">*</span>
                  </label>
                  <select name="class_subject_id" value={form.class_subject_id} onChange={handleInput} required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">— Pilih —</option>
                    {classSubjects.map(cs => (
                      <option key={cs.id} value={cs.id}>{cs.subject_code} — {cs.subject_name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Hari <span className="text-red-500">*</span>
                </label>
                <select name="day_of_week" value={form.day_of_week} onChange={handleInput} required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">— Pilih Hari —</option>
                  {DAY_OPTIONS.map(d => <option key={d} value={d}>{DAY_NAMES[d]}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Jam Mulai <span className="text-red-500">*</span>
                  </label>
                  <input type="time" name="start_time" value={form.start_time} onChange={handleInput} required
                    step="60"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono [&::-webkit-datetime-edit-ampm-field]:hidden [color-scheme:light]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Jam Selesai <span className="text-red-500">*</span>
                  </label>
                  <input type="time" name="end_time" value={form.end_time} onChange={handleInput} required
                    step="60"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono [&::-webkit-datetime-edit-ampm-field]:hidden [color-scheme:light]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ruangan</label>
                <input name="room" value={form.room ?? ''} onChange={handleInput}
                  placeholder="contoh: Lab Komputer 1"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
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
            <h3 className="text-lg font-bold text-gray-800 mb-2">Hapus Jadwal</h3>
            <p className="text-sm text-gray-600 mb-6">
              Hapus jadwal <span className="font-semibold">{DAY_NAMES[itemToDelete.day_of_week]}, {itemToDelete.start_time.slice(0, 5)}–{itemToDelete.end_time.slice(0, 5)}</span>?
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
