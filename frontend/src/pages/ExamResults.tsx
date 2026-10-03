import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, X, Clock, AlignLeft, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { getAttemptsBySchedule, getAnswersByAttempt, gradeEssayAnswer } from '../services/examOnline.service';
import { getExamScheduleById } from '../services/exam.service';
import type { ExamAttempt, ExamAnswer } from '../types/examOnline';
import type { ExamSchedule } from '../types/exam';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/Toast';

const token = () => localStorage.getItem('token') ?? '';

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    in_progress: 'bg-amber-100 text-amber-700',
    submitted:   'bg-blue-100 text-blue-700',
    timed_out:   'bg-red-100 text-red-600',
    graded:      'bg-emerald-100 text-emerald-700',
  };
  const label: Record<string, string> = {
    in_progress: 'Sedang Ujian', submitted: 'Dikumpulkan', timed_out: 'Waktu Habis', graded: 'Dinilai',
  };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${map[s] ?? 'bg-gray-100 text-gray-500'}`}>{label[s] ?? s}</span>;
};

export default function ExamResults() {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const navigate        = useNavigate();
  const { user }        = useAuth();

  const [schedule, setSchedule]   = useState<ExamSchedule | null>(null);
  const [attempts, setAttempts]   = useState<ExamAttempt[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  // Expanded attempt panel
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [answers, setAnswers]       = useState<Record<string, ExamAnswer[]>>({});
  const [loadingAnswers, setLoadingAnswers] = useState<string | null>(null);

  // Essay grading state
  const [grading, setGrading]     = useState<Record<string, { score: string; feedback: string }>>({});
  const [saving, setSaving]       = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!scheduleId) return;
    try {
      setLoading(true); setError(null);
      const [sched, { attempts: ats }] = await Promise.all([
        getExamScheduleById(scheduleId, token()),
        getAttemptsBySchedule(scheduleId, token()),
      ]);
      setSchedule(sched);
      setAttempts(ats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally { setLoading(false); }
  }, [scheduleId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Toggle attempt detail ──────────────────────────────────────────────────

  const toggleExpand = async (attemptId: string) => {
    if (expandedId === attemptId) { setExpandedId(null); return; }
    setExpandedId(attemptId);
    if (answers[attemptId]) return;
    setLoadingAnswers(attemptId);
    try {
      const { answers: ans } = await getAnswersByAttempt(attemptId, token());
      setAnswers(prev => ({ ...prev, [attemptId]: ans }));
      // pre-fill grading state for essays
      const essayInit: Record<string, { score: string; feedback: string }> = {};
      ans.forEach(a => {
        if (a.question_type === 'essay') {
          essayInit[a.id] = { score: String(a.score ?? ''), feedback: a.feedback ?? '' };
        }
      });
      setGrading(prev => ({ ...prev, ...essayInit }));
    } catch {
      toast.error('Gagal memuat jawaban');
    } finally { setLoadingAnswers(null); }
  };

  // ── Grade essay ────────────────────────────────────────────────────────────

  const handleGradeEssay = async (answerId: string) => {
    const g = grading[answerId];
    if (!g) return;
    setSaving(answerId);
    try {
      const updated = await gradeEssayAnswer(answerId, {
        score: parseFloat(g.score),
        feedback: g.feedback || undefined,
      }, token());
      setAnswers(prev => {
        const upd = { ...prev };
        for (const key of Object.keys(upd)) {
          upd[key] = upd[key].map(a => a.id === answerId ? { ...a, ...updated } : a);
        }
        return upd;
      });
      toast.success('Essay berhasil dinilai');
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gagal menilai';
      toast.error('Gagal', msg);
    } finally { setSaving(null); }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Hasil Ujian — {schedule?.subject_name ?? '...'} · {schedule?.class_name ?? '...'}
          </h1>
          <p className="text-sm text-gray-500">
            {schedule ? `${schedule.exam_name} · ${new Date(schedule.exam_date).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })}` : ''}
          </p>
        </div>
        <div className="ml-auto text-sm text-gray-500">
          {attempts.length} peserta
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">Memuat data...</div>
      ) : error ? (
        <div className="p-6 text-center"><p className="text-red-600 mb-3">{error}</p><button onClick={fetchData} className="text-sm text-blue-600 underline">Coba lagi</button></div>
      ) : (
        <div className="space-y-3">
          {attempts.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 py-16 text-center text-gray-400">
              Belum ada siswa yang mengerjakan ujian ini
            </div>
          )}
          {attempts.map((att, i) => {
            const isExpanded = expandedId === att.id;
            const attAnswers = answers[att.id] ?? [];
            const essayCount = attAnswers.filter(a => a.question_type === 'essay').length;
            const ungradedEssays = attAnswers.filter(a => a.question_type === 'essay' && a.score === null).length;

            return (
              <div key={att.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Attempt row */}
                <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50" onClick={() => toggleExpand(att.id)}>
                  <span className="w-7 h-7 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{att.student_name}</p>
                    <p className="text-xs text-gray-400">{att.student_number}</p>
                  </div>
                  {statusBadge(att.status)}
                  <div className="text-right">
                    {att.total_score !== null
                      ? <p className="text-xl font-bold text-gray-800">{att.total_score}</p>
                      : <p className="text-sm text-gray-400">—</p>}
                    {att.objective_score !== null && (
                      <p className="text-xs text-gray-400">PG: {att.objective_score} · Essay: {att.essay_score ?? '—'}</p>
                    )}
                  </div>
                  {att.tab_switch_count > 0 && (
                    <span className="px-2 py-0.5 bg-red-50 text-red-500 text-xs rounded-full border border-red-200">
                      Pindah tab: {att.tab_switch_count}×
                    </span>
                  )}
                  {essayCount > 0 && ungradedEssays > 0 && (
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-xs rounded-full border border-amber-200">
                      {ungradedEssays} essay belum dinilai
                    </span>
                  )}
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </div>

                {/* Detail panel */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-4">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {att.started_at && <span><Clock className="w-3.5 h-3.5 inline mr-1" />Mulai: {new Date(att.started_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>}
                      {att.submitted_at && <span>Selesai: {new Date(att.submitted_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>}
                    </div>

                    {loadingAnswers === att.id ? (
                      <p className="text-sm text-gray-400">Memuat jawaban...</p>
                    ) : attAnswers.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">Tidak ada jawaban tercatat</p>
                    ) : (
                      <div className="space-y-3">
                        {attAnswers.map((ans, qi) => (
                          <div key={ans.id} className={`rounded-lg border p-4 space-y-2 ${
                            ans.question_type === 'multiple_choice'
                              ? ans.is_correct ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
                              : 'border-gray-200 bg-white'
                          }`}>
                            <div className="flex items-start gap-2">
                              <span className="w-6 h-6 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{qi + 1}</span>
                              <p className="text-sm text-gray-700 flex-1">{ans.question_text}</p>
                              {ans.question_type === 'multiple_choice' && (
                                ans.is_correct
                                  ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                  : <X className="w-4 h-4 text-red-500 flex-shrink-0" />
                              )}
                            </div>

                            {ans.question_type === 'multiple_choice' && (
                              <p className="text-xs ml-8 text-gray-600">
                                Jawaban: <span className="font-semibold">{ans.selected_label ?? '—'}</span>
                                {ans.selected_option_text && <> — {ans.selected_option_text}</>}
                              </p>
                            )}

                            {ans.question_type === 'essay' && (
                              <div className="ml-8 space-y-2">
                                <div className="flex items-start gap-2 text-xs text-orange-600 bg-orange-50 rounded px-2 py-1.5">
                                  <AlignLeft className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                  <p className="whitespace-pre-wrap">{ans.answer_text || <em>Tidak dijawab</em>}</p>
                                </div>
                                {/* Grade input */}
                                <div className="flex items-end gap-2">
                                  <div className="flex-1">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                                      Nilai (maks {ans.max_points})
                                    </label>
                                    <input type="number" min={0} max={ans.max_points} step={0.5}
                                      value={grading[ans.id]?.score ?? ''}
                                      onChange={e => setGrading(prev => ({ ...prev, [ans.id]: { ...prev[ans.id], score: e.target.value } }))}
                                      className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                  </div>
                                  <div className="flex-1">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Komentar</label>
                                    <input type="text"
                                      value={grading[ans.id]?.feedback ?? ''}
                                      onChange={e => setGrading(prev => ({ ...prev, [ans.id]: { ...prev[ans.id], feedback: e.target.value } }))}
                                      placeholder="Opsional"
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                  </div>
                                  <button onClick={() => handleGradeEssay(ans.id)} disabled={saving === ans.id || !grading[ans.id]?.score}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-60">
                                    <Save className="w-3.5 h-3.5" />{saving === ans.id ? '...' : 'Simpan'}
                                  </button>
                                </div>
                                {ans.score !== null && (
                                  <p className="text-xs text-emerald-700">✓ Sudah dinilai: {ans.score} poin</p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
