import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Save, ChevronUp, ChevronDown,
  CheckCircle2, AlignLeft, X, Download, Upload, FileSpreadsheet,
} from 'lucide-react';
import {
  getQuestionSetById, getQuestions,
  createQuestion, updateQuestion, deleteQuestion, reorderQuestions,
  downloadQuestionTemplate, importQuestions as importQuestionsApi,
} from '../services/examOnline.service';
import type { Question, QuestionSet, QuestionOptionFormData, QuestionType } from '../types/examOnline';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/Toast';

const token = () => localStorage.getItem('token') ?? '';
const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'];

interface QuestionFormState {
  type: QuestionType;
  question_text: string;
  points: string;
  explanation: string;
  options: QuestionOptionFormData[];
}

const emptyOptions = (): QuestionOptionFormData[] =>
  OPTION_LABELS.slice(0, 4).map((label, i) => ({
    label, option_text: '', is_correct: false, sort_order: i,
  }));

const emptyForm = (): QuestionFormState => ({
  type: 'multiple_choice', question_text: '', points: '1', explanation: '', options: emptyOptions(),
});

export default function QuestionEditor() {
  const { questionSetId } = useParams<{ questionSetId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit  = user?.role === 'superuser' || user?.role === 'teacher';

  const [qs, setQs]               = useState<QuestionSet | null>(null);
  const [questions, setQuestions]  = useState<Question[]>([]);
  const [loading, setLoading]      = useState(true);
  const [error, setError]          = useState<string | null>(null);

  // Panel: null = list mode, string = editing question id, 'new' = creating
  const [panelId, setPanelId]      = useState<string | null>(null);
  const [form, setForm]            = useState<QuestionFormState>(emptyForm());
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [saving, setSaving]        = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Import Excel state
  const fileInputRef               = useRef<HTMLInputElement>(null);
  const [importing, setImporting]  = useState(false);

  const fetchData = useCallback(async () => {
    if (!questionSetId) return;
    try {
      setLoading(true); setError(null);
      const { questions: qs2, question_set } = await getQuestions(questionSetId, token());
      setQs(question_set);
      setQuestions(qs2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat soal');
    } finally { setLoading(false); }
  }, [questionSetId]);

  useEffect(() => {
    getQuestionSetById(questionSetId!, token()).then(setQs).catch(() => {});
    fetchData();
  }, [fetchData, questionSetId]);

  // ── Open panel ─────────────────────────────────────────────────────────────

  const openNew = () => {
    setForm(emptyForm());
    setFormErrors([]);
    setPanelId('new');
  };

  const openEdit = (q: Question) => {
    setForm({
      type: q.type,
      question_text: q.question_text,
      points: String(q.points),
      explanation: q.explanation ?? '',
      options: q.options?.map(o => ({
        label: o.label, option_text: o.option_text,
        image: o.image ?? undefined,
        is_correct: !!o.is_correct, sort_order: o.sort_order,
      })) ?? emptyOptions(),
    });
    setFormErrors([]);
    setPanelId(q.id);
  };

  const closePanel = () => { setPanelId(null); setFormErrors([]); };

  // ── Options helpers ────────────────────────────────────────────────────────

  const setOptionField = (idx: number, field: keyof QuestionOptionFormData, val: string | boolean) => {
    setForm(prev => {
      const opts = prev.options.map((o, i) => {
        // For single MC: selecting correct on one deselects all others
        if (field === 'is_correct' && val === true && prev.type === 'multiple_choice') {
          return { ...o, is_correct: i === idx };
        }
        // For complex MC: toggle independently
        if (i === idx) return { ...o, [field]: val };
        return o;
      });
      return { ...prev, options: opts };
    });
  };

  const addOption = () => {
    const next = OPTION_LABELS[form.options.length];
    if (!next) return;
    setForm(prev => ({
      ...prev,
      options: [...prev.options, { label: next, option_text: '', is_correct: false, sort_order: prev.options.length }],
    }));
  };

  const removeOption = (idx: number) => {
    setForm(prev => {
      const opts = prev.options.filter((_, i) => i !== idx)
        .map((o, i) => ({ ...o, label: OPTION_LABELS[i], sort_order: i }));
      // ensure one correct
      if (!opts.some(o => o.is_correct) && opts.length > 0) opts[0].is_correct = true;
      return { ...prev, options: opts };
    });
  };

  // ── Save question ──────────────────────────────────────────────────────────

  const handleSave = async () => {
    setFormErrors([]); setSaving(true);
    try {
      const payload = {
        question_set_id: questionSetId!,
        type: form.type,
        question_text: form.question_text,
        points: Number(form.points) || 1,
        explanation: form.explanation || undefined,
        sort_order: panelId === 'new' ? questions.length : undefined,
        options: form.type === 'multiple_choice' ? form.options : undefined,
      };

      if (panelId === 'new') {
        await createQuestion(payload, token());
        toast.success('Soal berhasil ditambahkan');
      } else {
        await updateQuestion(panelId!, payload, token());
        toast.success('Soal berhasil diperbarui');
      }
      closePanel();
      fetchData();
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { message?: string; errors?: string[] } } };
      const errs = axErr?.response?.data?.errors ?? [axErr?.response?.data?.message ?? 'Gagal menyimpan'];
      setFormErrors(errs);
    } finally { setSaving(false); }
  };

  // ── Delete question ────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus soal ini?')) return;
    setDeletingId(id);
    try {
      await deleteQuestion(id, token());
      toast.success('Soal berhasil dihapus');
      fetchData();
    } catch {
      toast.error('Gagal menghapus soal');
    } finally { setDeletingId(null); }
  };

  // ── Reorder ────────────────────────────────────────────────────────────────

  const moveQuestion = async (idx: number, dir: -1 | 1) => {
    const newList = [...questions];
    const target  = idx + dir;
    if (target < 0 || target >= newList.length) return;
    [newList[idx], newList[target]] = [newList[target], newList[idx]];
    setQuestions(newList);
    const orders = newList.map((q, i) => ({ id: q.id, sort_order: i }));
    try {
      await reorderQuestions(questionSetId!, orders, token());
    } catch {/* silent */}
  };

  // ── Import / Export Excel ──────────────────────────────────────────────────

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadQuestionTemplate(token());
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'template_soal.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Template berhasil diunduh');
    } catch {
      toast.error('Gagal mengunduh template');
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !questionSetId) return;
    e.target.value = '';   // reset agar bisa upload file yang sama lagi

    setImporting(true);
    try {
      const result = await importQuestionsApi(questionSetId, file, token());
      toast.success(`${result.imported_count} soal berhasil diimport`);
      fetchData();
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { message?: string; errors?: { row: number; message: string }[] } } };
      const errs  = axErr?.response?.data?.errors;
      if (errs && errs.length > 0) {
        toast.error(`Import gagal: ${errs.map(e => `Baris ${e.row}: ${e.message}`).join(' | ')}`);
      } else {
        toast.error(axErr?.response?.data?.message ?? 'Gagal mengimport soal');
      }
    } finally {
      setImporting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/dashboard/question-sets')}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Editor Soal — {qs?.title ?? '...'}</h1>
          <p className="text-sm text-gray-500">
            {qs?.subject_name} · {qs?.duration_minutes} menit
            {qs && <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${qs.status === 'ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{qs.status === 'ready' ? 'Siap' : 'Draft'}</span>}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-gray-500">{questions.length} soal · {qs?.total_points ?? questions.reduce((s, q) => s + Number(q.points), 0)} poin</span>
          {canEdit && (
            <>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleImportFile}
              />
              {/* Download Template */}
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-xl hover:bg-gray-50 text-sm font-semibold shadow-sm"
                title="Download template Excel soal"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Template</span>
                <Download className="w-3.5 h-3.5 text-gray-400" />
              </button>
              {/* Upload Excel */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-2 rounded-xl hover:bg-emerald-700 disabled:opacity-60 text-sm font-semibold shadow-md"
                title="Upload soal dari file Excel"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">{importing ? 'Mengimport...' : 'Upload Excel'}</span>
              </button>
              {/* Tambah manual */}
              <button onClick={openNew}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 text-sm font-semibold shadow-md">
                <Plus className="w-4 h-4" /> Tambah Soal
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">Memuat soal...</div>
      ) : error ? (
        <div className="p-6 text-center"><p className="text-red-600 mb-3">{error}</p><button onClick={fetchData} className="text-sm text-blue-600 underline">Coba lagi</button></div>
      ) : (
        <div className="space-y-3">
          {questions.length === 0 && panelId !== 'new' && (
            <div className="bg-white rounded-xl border border-gray-100 py-16 text-center text-gray-400">
              <p className="mb-3">Belum ada soal</p>
              {canEdit && <button onClick={openNew} className="text-blue-600 text-sm underline">Tambah soal pertama</button>}
            </div>
          )}

          {questions.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Question header */}
              <div className="flex items-start gap-3 px-5 py-4">
                <span className="flex-shrink-0 w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      q.type === 'multiple_choice'         ? 'bg-indigo-50 text-indigo-700' :
                      q.type === 'multiple_choice_complex' ? 'bg-orange-50 text-orange-700' :
                                                             'bg-amber-50 text-amber-700'}`}>
                      {q.type === 'multiple_choice'         ? 'Pilihan Ganda' :
                       q.type === 'multiple_choice_complex' ? 'PG Kompleks (MCMA)' :
                                                              'Essay'}
                    </span>
                    <span className="text-xs text-gray-400">{q.points} poin</span>
                  </div>
                  <p className="text-gray-800 text-sm whitespace-pre-wrap">{q.question_text}</p>
                  {q.type === 'multiple_choice' && (
                    <div className="mt-2 space-y-1">
                      {q.options?.map(opt => (
                        <div key={opt.id} className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${opt.is_correct ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-600'}`}>
                          <span className="w-5 h-5 rounded-full border flex items-center justify-center font-bold text-xs flex-shrink-0"
                            style={{ borderColor: opt.is_correct ? '#059669' : '#d1d5db', background: opt.is_correct ? '#d1fae5' : 'transparent' }}>
                            {opt.label}
                          </span>
                          {opt.option_text}
                          {opt.is_correct && <CheckCircle2 className="w-3.5 h-3.5 ml-auto" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {canEdit && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => moveQuestion(idx, -1)} disabled={idx === 0} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                    <button onClick={() => moveQuestion(idx, 1)} disabled={idx === questions.length - 1} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                    <button onClick={() => panelId === q.id ? closePanel() : openEdit(q)}
                      className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200"><Save className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(q.id)} disabled={deletingId === q.id}
                      className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>

              {/* Inline edit panel */}
              {panelId === q.id && canEdit && (
                <QuestionFormPanel
                  form={form} setForm={setForm} formErrors={formErrors}
                  saving={saving} onSave={handleSave} onClose={closePanel}
                  addOption={addOption} removeOption={removeOption} setOptionField={setOptionField}
                />
              )}
            </div>
          ))}

          {/* New question panel */}
          {panelId === 'new' && canEdit && (
            <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                <span className="font-semibold text-blue-700 text-sm">Soal Baru #{questions.length + 1}</span>
                <button onClick={closePanel} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              <QuestionFormPanel
                form={form} setForm={setForm} formErrors={formErrors}
                saving={saving} onSave={handleSave} onClose={closePanel}
                addOption={addOption} removeOption={removeOption} setOptionField={setOptionField}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Inline form panel ──────────────────────────────────────────────────────────

interface PanelProps {
  form: ReturnType<typeof emptyForm>;
  setForm: React.Dispatch<React.SetStateAction<ReturnType<typeof emptyForm>>>;
  formErrors: string[];
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
  addOption: () => void;
  removeOption: (idx: number) => void;
  setOptionField: (idx: number, field: keyof QuestionOptionFormData, val: string | boolean) => void;
}

function QuestionFormPanel({ form, setForm, formErrors, saving, onSave, onClose, addOption, removeOption, setOptionField }: PanelProps) {
  return (
    <div className="p-5 space-y-4 border-t border-gray-100 bg-gray-50">
      {formErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          {formErrors.map((e, i) => <p key={i} className="text-red-600 text-sm">{e}</p>)}
        </div>
      )}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Tipe Soal</label>
          <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as QuestionType }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
            <option value="multiple_choice">Pilihan Ganda (1 jawaban benar)</option>
            <option value="multiple_choice_complex">PG Kompleks / MCMA (≥2 jawaban benar)</option>
            <option value="essay">Essay</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Poin</label>
          <input type="number" min={0.5} step={0.5} value={form.points}
            onChange={e => setForm(p => ({ ...p, points: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Teks Soal <span className="text-red-500">*</span></label>
        <textarea rows={4} value={form.question_text}
          onChange={e => setForm(p => ({ ...p, question_text: e.target.value }))}
          placeholder="Tulis teks soal di sini..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>

      {(form.type === 'multiple_choice' || form.type === 'multiple_choice_complex') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-gray-600">Opsi Jawaban</label>
            {form.type === 'multiple_choice_complex' && (
              <span className="text-xs text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">
                Centang semua yang benar (≥2)
              </span>
            )}
            {form.type === 'multiple_choice' && (
              <span className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                Pilih 1 jawaban benar
              </span>
            )}
          </div>
          {form.options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {form.type === 'multiple_choice' ? (
                <input type="radio" name="correct" checked={opt.is_correct}
                  onChange={() => setOptionField(idx, 'is_correct', true)}
                  className="w-4 h-4 text-indigo-600 accent-indigo-600 flex-shrink-0"
                  title="Tandai sebagai jawaban benar" />
              ) : (
                <input type="checkbox" checked={opt.is_correct}
                  onChange={e => setOptionField(idx, 'is_correct', e.target.checked)}
                  className="w-4 h-4 text-orange-500 accent-orange-500 rounded flex-shrink-0"
                  title="Centang jika ini jawaban benar" />
              )}
              <span className={`w-6 text-center font-bold text-xs flex-shrink-0 ${opt.is_correct ? 'text-emerald-600' : 'text-gray-400'}`}>
                {opt.label}
              </span>
              <input type="text" value={opt.option_text} placeholder={`Opsi ${opt.label}`}
                onChange={e => setOptionField(idx, 'option_text', e.target.value)}
                className={`flex-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500
                  ${opt.is_correct ? 'border-emerald-300 bg-emerald-50' : 'border-gray-300'}`} />
              {form.options.length > 2 && (
                <button type="button" onClick={() => removeOption(idx)}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"><X className="w-3.5 h-3.5" /></button>
              )}
            </div>
          ))}
          {form.options.length < 5 && (
            <button type="button" onClick={addOption}
              className="flex items-center gap-1 text-blue-600 text-xs hover:underline">
              <Plus className="w-3.5 h-3.5" /> Tambah opsi
            </button>
          )}
          <p className="text-xs text-gray-400">
            {form.type === 'multiple_choice'
              ? 'Klik radio button untuk menandai 1 jawaban benar'
              : 'Centang semua opsi yang merupakan jawaban benar (minimal 2)'}
          </p>
        </div>
      )}

      {form.type === 'essay' && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          <AlignLeft className="w-4 h-4 flex-shrink-0" />
          <span>Soal essay dinilai manual oleh guru setelah ujian selesai.</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Pembahasan (opsional)</label>
        <textarea rows={2} value={form.explanation}
          onChange={e => setForm(p => ({ ...p, explanation: e.target.value }))}
          placeholder="Penjelasan jawaban benar (hanya terlihat guru)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100">Batal</button>
        <button type="button" onClick={onSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
          <Save className="w-4 h-4" />{saving ? 'Menyimpan...' : 'Simpan Soal'}
        </button>
      </div>
    </div>
  );
}
