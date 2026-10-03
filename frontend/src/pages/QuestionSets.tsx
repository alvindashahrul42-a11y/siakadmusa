import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Edit, Trash2, Search, X, BookOpen,
  ChevronLeft, ChevronRight, PenLine, CheckCircle, Clock,
} from 'lucide-react';
import { getQuestionSets, createQuestionSet, updateQuestionSet, deleteQuestionSet } from '../services/examOnline.service';
import { getSubjectsAll } from '../services/subject.service';
import type { QuestionSet, QuestionSetFormData } from '../types/examOnline';
import type { Subject } from '../types/subject';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/Toast';

const token = () => localStorage.getItem('token') ?? '';

const EMPTY_FORM: QuestionSetFormData = {
  subject_id: '', title: '', description: '', instructions: '',
  duration_minutes: 60, passing_score: '',
  shuffle_questions: false, shuffle_options: false, show_result: false,
  status: 'draft',
};

export default function QuestionSets() {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const canEdit   = user?.role === 'superuser' || user?.role === 'teacher';

  const [items, setItems]             = useState<QuestionSet[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [page, setPage]               = useState(1);
  const [total, setTotal]             = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const LIMIT = 20;

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showModal, setShowModal]         = useState(false);
  const [editingItem, setEditingItem]     = useState<QuestionSet | null>(null);
  const [form, setForm]                   = useState<QuestionSetFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors]       = useState<string[]>([]);
  const [submitting, setSubmitting]       = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete]   = useState<QuestionSet | null>(null);
  const [deleting, setDeleting]           = useState(false);

  useEffect(() => {
    getSubjectsAll(token()).then(s => setSubjects(s)).catch(() => {});
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await getQuestionSets({ page, limit: LIMIT, search: search || undefined, status: filterStatus || undefined }, token());
      setItems(res.data); setTotal(res.metadata.total); setTotalPages(res.metadata.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally { setLoading(false); }
  }, [page, search, filterStatus]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  const openCreate = () => { setEditingItem(null); setForm(EMPTY_FORM); setFormErrors([]); setShowModal(true); };
  const openEdit = (item: QuestionSet) => {
    setEditingItem(item);
    setForm({
      subject_id: item.subject_id, title: item.title,
      description: item.description ?? '', instructions: item.instructions ?? '',
      duration_minutes: item.duration_minutes, passing_score: item.passing_score ?? '',
      shuffle_questions: item.shuffle_questions, shuffle_options: item.shuffle_options,
      show_result: item.show_result, status: item.status,
    });
    setFormErrors([]); setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditingItem(null); setFormErrors([]); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormErrors([]); setSubmitting(true);
    try {
      const payload = {
        ...form,
        duration_minutes: Number(form.duration_minutes),
        passing_score: form.passing_score !== '' ? Number(form.passing_score) : undefined,
      };
      if (editingItem) {
        await updateQuestionSet(editingItem.id, payload, token());
        toast.success('Paket soal berhasil diperbarui');
      } else {
        await createQuestionSet(payload, token());
        toast.success('Paket soal berhasil dibuat');
      }
      closeModal(); fetchItems();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gagal menyimpan';
      setFormErrors([msg]); toast.error('Gagal menyimpan', msg);
    } finally { setSubmitting(false); }
  };

  const openDelete = (item: QuestionSet) => { setItemToDelete(item); setShowDeleteModal(true); };
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await deleteQuestionSet(itemToDelete.id, token());
      toast.success('Paket soal berhasil dihapus');
      setShowDeleteModal(false); setItemToDelete(null); fetchItems();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gagal menghapus';
      toast.error('Gagal menghapus', msg);
    } finally { setDeleting(false); }
  };

  const statusBadge = (s: 'draft' | 'ready') => s === 'ready'
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold"><CheckCircle className="w-3 h-3" />Siap</span>
    : <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold"><PenLine className="w-3 h-3" />Draft</span>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Paket Soal</h1>
        <p className="text-sm text-gray-500">Kelola bank soal ujian per mata pelajaran</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari judul atau mapel..."
              value={searchInput} onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <button onClick={handleSearch} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">Cari</button>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Semua Status</option>
            <option value="draft">Draft</option>
            <option value="ready">Siap</option>
          </select>
          {(search || filterStatus) && (
            <button onClick={() => { setSearch(''); setSearchInput(''); setFilterStatus(''); setPage(1); }}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1">
              <X className="w-4 h-4" />Reset
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Total: <span className="font-semibold text-gray-800">{total}</span></span>
          {canEdit && (
            <button onClick={openCreate}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-md font-semibold text-sm">
              <Plus className="w-4 h-4" /> Tambah Paket Soal
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">Memuat data...</div>
        ) : error ? (
          <div className="p-6 text-center"><p className="text-red-600 mb-3">{error}</p><button onClick={fetchItems} className="text-sm text-blue-600 underline">Coba lagi</button></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">#</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Judul</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Mata Pelajaran</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Guru</th>
                  <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Soal</th>
                  <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Durasi</th>
                  <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Status</th>
                  <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Editor</th>
                  {canEdit && <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.length === 0 ? (
                  <tr><td colSpan={canEdit ? 9 : 8} className="text-center py-16 text-gray-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Belum ada paket soal</p>
                  </td></tr>
                ) : items.map((item, i) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-gray-400">{(page - 1) * LIMIT + i + 1}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-800">{item.title}</p>
                      {item.passing_score && <p className="text-xs text-gray-400">KKM: {item.passing_score}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-bold font-mono">{item.subject_code}</span>
                      <span className="ml-2 text-gray-600">{item.subject_name}</span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{item.teacher_name}</td>
                    <td className="px-5 py-4 text-center font-semibold text-gray-700">{item.question_count}</td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-gray-600 text-xs">
                        <Clock className="w-3.5 h-3.5" />{item.duration_minutes} menit
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">{statusBadge(item.status)}</td>
                    <td className="px-5 py-4 text-center">
                      <button onClick={() => navigate(`/dashboard/question-sets/${item.id}/questions`)}
                        className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-800 text-xs bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-200">
                        <PenLine className="w-3.5 h-3.5" />Editor
                      </button>
                    </td>
                    {canEdit && (
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(item)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => openDelete(item)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200"><Trash2 className="w-4 h-4" /></button>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Menampilkan <span className="font-semibold">{total === 0 ? 0 : (page-1)*LIMIT+1}–{Math.min(page*LIMIT,total)}</span> dari <span className="font-semibold">{total}</span></p>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-5 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-800">{editingItem ? 'Edit Paket Soal' : 'Buat Paket Soal'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  {formErrors.map((e, i) => <p key={i} className="text-red-600 text-sm">{e}</p>)}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mata Pelajaran <span className="text-red-500">*</span></label>
                <select required value={form.subject_id} onChange={e => setForm(p => ({ ...p, subject_id: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">— Pilih —</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Judul Paket Soal <span className="text-red-500">*</span></label>
                <input type="text" required maxLength={200} value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="contoh: Soal UTS Matematika X - Paket A"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Durasi (menit) <span className="text-red-500">*</span></label>
                  <input type="number" required min={1} max={480} value={form.duration_minutes}
                    onChange={e => setForm(p => ({ ...p, duration_minutes: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">KKM (0–100)</label>
                  <input type="number" min={0} max={100} step={0.01} value={form.passing_score ?? ''}
                    onChange={e => setForm(p => ({ ...p, passing_score: e.target.value }))}
                    placeholder="Opsional"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Petunjuk Pengerjaan</label>
                <textarea rows={3} value={form.instructions ?? ''} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))}
                  placeholder="Petunjuk untuk siswa sebelum mulai mengerjakan..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as 'draft' | 'ready' }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="draft">Draft</option>
                  <option value="ready">Siap (Ready)</option>
                </select>
              </div>
              <div className="space-y-2 pt-1">
                {([['shuffle_questions', 'Acak urutan soal'], ['shuffle_options', 'Acak opsi jawaban'], ['show_result', 'Tampilkan nilai setelah submit']] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={!!form[key]}
                      onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">Batal</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">{submitting ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0"><Trash2 className="w-6 h-6 text-red-600" /></div>
              <div><h3 className="font-bold text-gray-800">Hapus Paket Soal</h3><p className="text-sm text-gray-500">Semua soal di dalamnya ikut terhapus.</p></div>
            </div>
            <p className="text-sm text-gray-600">Hapus <strong>{itemToDelete.title}</strong>?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">Batal</button>
              <button onClick={confirmDelete} disabled={deleting} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60">{deleting ? 'Menghapus...' : 'Ya, Hapus'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
