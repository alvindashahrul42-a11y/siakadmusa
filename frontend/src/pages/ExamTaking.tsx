import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight, Send, AlignLeft, Timer } from 'lucide-react';
import {
  startAttempt, submitAttempt, timeoutAttempt, saveAnswer, recordTabSwitch,
} from '../services/examOnline.service';
import type { Question, ExamAttempt, ExamAnswer } from '../types/examOnline';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/Toast';

const token = () => localStorage.getItem('token') ?? '';

export default function ExamTaking() {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const navigate       = useNavigate();
  const { user }       = useAuth();

  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [attempt, setAttempt]   = useState<ExamAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers]   = useState<Record<string, ExamAnswer>>({});  // questionId → answer
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerReady, setTimerReady] = useState(false); // true setelah deadline di-set dari server
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // countdown ke waktu mulai (untuk error "belum dimulai")
  const [waitSeconds, setWaitSeconds] = useState<number | null>(null);
  const waitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Start / resume ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!scheduleId) return;
    setLoading(true);
    startAttempt(scheduleId, token())
      .then(data => {
        setAttempt(data.attempt);
        setQuestions(data.questions);
        const ansMap: Record<string, ExamAnswer> = {};
        data.answers.forEach(a => { ansMap[a.question_id] = a; });
        setAnswers(ansMap);

        const deadline = new Date(data.attempt.deadline_at).getTime();
        setTimeLeft(Math.max(0, Math.floor((deadline - Date.now()) / 1000)));
        setTimerReady(true);

        if (data.attempt.status !== 'in_progress') setSubmitted(true);
      })
      .catch(err => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          ?? 'Gagal memulai ujian';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [scheduleId]);

  // ── Countdown ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!attempt || submitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [attempt, submitted]);

  // Pantau timeLeft === 0 untuk trigger timeout — hanya aktif setelah timer di-set dari server
  useEffect(() => {
    if (!timerReady) return;
    if (timeLeft === 0 && attempt && !submitted) {
      handleTimeout();
    }
  }, [timeLeft, timerReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Anti-cheat: tab switch ─────────────────────────────────────────────────

  useEffect(() => {
    if (!attempt || submitted) return;
    const onBlur = () => {
      if (!document.hidden) return;
      recordTabSwitch(attempt.id, token()).catch(() => {});
      toast.error('Peringatan', 'Berpindah tab terdeteksi dan dicatat!');
    };
    document.addEventListener('visibilitychange', onBlur);
    return () => document.removeEventListener('visibilitychange', onBlur);
  }, [attempt, submitted]);

  // ── Countdown ke waktu mulai ujian (saat error "belum dimulai") ─────────────

  useEffect(() => {
    if (!error || !error.toLowerCase().includes('belum dimulai')) return;

    // Ekstrak waktu dari pesan: "Mulai pukul HH:MM"
    const match = error.match(/(\d{1,2}):(\d{2})/);
    if (!match) return;

    const calcWait = () => {
      const now   = new Date();
      const start = new Date();
      start.setHours(parseInt(match[1]), parseInt(match[2]), 0, 0);
      // Jika sudah lewat tengah malam (jadwal besok)
      if (start <= now) start.setDate(start.getDate() + 1);
      return Math.max(0, Math.floor((start.getTime() - now.getTime()) / 1000));
    };

    setWaitSeconds(calcWait());

    waitTimerRef.current = setInterval(() => {
      const secs = calcWait();
      setWaitSeconds(secs);
      if (secs <= 0) {
        clearInterval(waitTimerRef.current!);
        // Auto-reload saat waktu mulai tiba
        window.location.reload();
      }
    }, 1000);

    return () => clearInterval(waitTimerRef.current!);
  }, [error]);

  // ── Save answer (lokal saja — tidak POST ke backend) ──────────────────────

  const handleAnswer = useCallback((questionId: string, optionId?: string, text?: string, complexIds?: string[]) => {
    if (submitted) return;
    const q = questions.find(q => q.id === questionId);
    if (!q) return;

    // Simpan sebagai objek partial ExamAnswer di state lokal
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] ?? {} as ExamAnswer),
        question_id:         questionId,
        selected_option_id:  q.type === 'multiple_choice'         ? (optionId ?? null) : null,
        selected_option_ids: q.type === 'multiple_choice_complex' ? JSON.stringify(complexIds ?? []) : null,
        answer_text:         q.type === 'essay'                   ? (text ?? null) : null,
      } as ExamAnswer,
    }));
  }, [submitted, questions]);

  // ── POST semua jawaban ke backend ──────────────────────────────────────────

  const submitAllAnswers = useCallback(async () => {
    if (!attempt) return;
    const entries = Object.entries(answers);
    for (const [questionId, ans] of entries) {
      const q = questions.find(q => q.id === questionId);
      if (!q) continue;
      try {
        await saveAnswer({
          attempt_id:          attempt.id,
          question_id:         questionId,
          selected_option_id:  ans.selected_option_id  ?? null,
          selected_option_ids: q.type === 'multiple_choice_complex'
            ? (() => { try { return JSON.parse(ans.selected_option_ids ?? '[]'); } catch { return []; } })()
            : null,
          answer_text:         ans.answer_text ?? null,
        }, token());
      } catch {/* abaikan error per soal, lanjut soal berikutnya */}
    }
  }, [attempt, answers, questions]);

  // ── Timeout ────────────────────────────────────────────────────────────────

  const handleTimeout = useCallback(async () => {
    if (!attempt || submitted) return;
    try {
      await submitAllAnswers();
      await timeoutAttempt(attempt.id, token());
      setSubmitted(true);
      toast.error('Waktu Habis', 'Ujian otomatis dikumpulkan');
    } catch {/* ignore */}
  }, [attempt, submitted, submitAllAnswers]);

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!attempt || submitting) return;
    setSubmitting(true);
    setShowConfirm(false);
    try {
      await submitAllAnswers();
      const updated = await submitAttempt(attempt.id, token());
      setAttempt(updated);
      setSubmitted(true);
      clearInterval(timerRef.current!);
      toast.success('Ujian berhasil dikumpulkan');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gagal mengumpulkan';
      toast.error('Gagal', msg);
    } finally { setSubmitting(false); }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const formatWait = (s: number) => {
    if (s <= 0) return '00:00';
    const h   = Math.floor(s / 3600);
    const m   = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const answeredCount = questions.filter(q => {
    const ans = answers[q.id];
    if (!ans) return false;
    if (q.type === 'multiple_choice')         return !!ans.selected_option_id;
    if (q.type === 'multiple_choice_complex') {
      try { return JSON.parse(ans.selected_option_ids ?? '[]').length > 0; } catch { return false; }
    }
    return !!(ans.answer_text?.trim());
  }).length;
  const currentQ = questions[currentIdx];

  // ── Loading / Error ────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
        <div>
          <p className="font-semibold text-gray-700">Memuat Ujian</p>
          <p className="text-sm text-gray-400 mt-0.5">Menyiapkan soal dan sesi ujian...</p>
        </div>
      </div>
    </div>
  );

  if (error) {
    const isNotStarted = error.toLowerCase().includes('belum dimulai');
    // Ekstrak jam mulai dari pesan error untuk ditampilkan
    const timeMatch = error.match(/(\d{1,2}:\d{2})/);
    const startTimeStr = timeMatch ? timeMatch[1] : null;

    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 w-full max-w-md overflow-hidden">
          {/* Top accent */}
          <div className={`h-1.5 w-full ${isNotStarted ? 'bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400' : 'bg-gradient-to-r from-amber-400 via-orange-400 to-red-400'}`} />

          <div className="p-8 text-center space-y-5">
            {/* Icon */}
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto border-2 ${isNotStarted ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100'}`}>
              {isNotStarted
                ? <Timer className="w-10 h-10 text-blue-500" />
                : <AlertTriangle className="w-10 h-10 text-amber-500" />
              }
            </div>

            {/* Title */}
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {isNotStarted ? 'Ujian Belum Dimulai' : 'Tidak Dapat Memulai Ujian'}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {isNotStarted
                  ? startTimeStr ? `Ujian dijadwalkan mulai pukul ${startTimeStr}` : 'Tunggu hingga waktu ujian tiba'
                  : 'Terjadi kendala saat memuat sesi ujian'}
              </p>
            </div>

            {/* Countdown */}
            {isNotStarted && waitSeconds !== null && waitSeconds > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Ujian dimulai dalam</p>
                <div className="flex items-center justify-center gap-2">
                  {/* Render jam/menit/detik sebagai kotak terpisah */}
                  {(() => {
                    const h   = Math.floor(waitSeconds / 3600);
                    const m   = Math.floor((waitSeconds % 3600) / 60);
                    const sec = waitSeconds % 60;
                    const segments = h > 0
                      ? [{ val: h, label: 'Jam' }, { val: m, label: 'Menit' }, { val: sec, label: 'Detik' }]
                      : [{ val: m, label: 'Menit' }, { val: sec, label: 'Detik' }];
                    return segments.map((seg, i) => (
                      <div key={seg.label} className="flex items-center gap-2">
                        <div className="flex flex-col items-center">
                          <div className="bg-blue-600 text-white rounded-xl w-16 h-16 flex items-center justify-center">
                            <span className="text-2xl font-bold font-mono tabular-nums">
                              {String(seg.val).padStart(2, '0')}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400 mt-1">{seg.label}</span>
                        </div>
                        {i < segments.length - 1 && (
                          <span className="text-2xl font-bold text-gray-300 mb-4">:</span>
                        )}
                      </div>
                    ));
                  })()}
                </div>
                <p className="text-xs text-blue-500 mt-1">Halaman akan otomatis reload saat ujian dimulai</p>
              </div>
            )}

            {/* Sudah waktunya tapi masih error */}
            {isNotStarted && waitSeconds !== null && waitSeconds <= 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3">
                <p className="text-emerald-700 text-sm font-medium">Waktu mulai sudah tiba! Memuat ulang...</p>
              </div>
            )}

            {/* Error non-waktu */}
            {!isNotStarted && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
                <p className="text-amber-800 text-sm font-medium leading-relaxed">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => navigate('/dashboard/my-exams')}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Kembali ke Daftar Ujian
              </button>
              {!isNotStarted && (
                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
                >
                  Coba Lagi
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Submitted / Result ─────────────────────────────────────────────────────

  if (submitted && attempt) {
    const showScore = attempt.show_result && attempt.total_score !== null;
    const passed = showScore && attempt.passing_score !== null
      ? attempt.total_score! >= attempt.passing_score!
      : null;
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-sm w-full text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-800">Ujian Selesai!</h2>
          {showScore && (
            <div className="space-y-1">
              <p className="text-4xl font-bold text-gray-800">{attempt.total_score}</p>
              {passed !== null && (
                <p className={`font-semibold ${passed ? 'text-emerald-600' : 'text-red-600'}`}>
                  {passed ? '✓ Lulus' : '✗ Belum Lulus'}
                </p>
              )}
            </div>
          )}
          {!showScore && <p className="text-gray-500 text-sm">Nilai akan diumumkan oleh guru.</p>}
          <button onClick={() => navigate('/dashboard/my-exams')}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">
            Kembali ke Daftar Ujian
          </button>
        </div>
      </div>
    );
  }

  if (!currentQ) return null;

  // ── Exam UI ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Top bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-800 text-sm">{user?.profile?.full_name ?? user?.username}</p>
          <p className="text-xs text-gray-400">{answeredCount}/{questions.length} soal dijawab</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg ${timeLeft < 300 ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-700'}`}>
          <Clock className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>
        <button onClick={() => setShowConfirm(true)} disabled={submitting}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-60">
          <Send className="w-4 h-4" /> Kumpulkan
        </button>
      </div>

      <div className="flex gap-4">
        {/* Question area */}
        <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
          {/* Question meta */}
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
              {currentIdx + 1}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${currentQ.type === 'multiple_choice' ? 'bg-indigo-50 text-indigo-700' : 'bg-orange-50 text-orange-700'}`}>
              {currentQ.type === 'multiple_choice' ? 'Pilihan Ganda' : 'Essay'}
            </span>
            <span className="text-xs text-gray-400 ml-auto">{currentQ.points} poin</span>
          </div>

          {/* Question text */}
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{currentQ.question_text}</p>

          {/* Options — single MC */}
          {currentQ.type === 'multiple_choice' && (
            <div className="space-y-2">
              {currentQ.options?.map(opt => {
                const selected = answers[currentQ.id]?.selected_option_id === opt.id;
                return (
                  <button key={opt.id} onClick={() => handleAnswer(currentQ.id, opt.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm transition-all
                      ${selected
                        ? 'border-blue-500 bg-blue-50 text-blue-800 font-medium'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'}`}>
                    <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0
                      ${selected ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 text-gray-500'}`}>
                      {opt.label}
                    </span>
                    {opt.option_text}
                  </button>
                );
              })}
            </div>
          )}

          {/* Options — complex MC (checkboxes) */}
          {currentQ.type === 'multiple_choice_complex' && (
            <div className="space-y-2">
              <p className="text-xs text-orange-600 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
                Pilih <strong>semua</strong> jawaban yang benar — bisa lebih dari satu.
              </p>
              {currentQ.options?.map(opt => {
                let selectedIds: string[] = [];
                try {
                  const raw = answers[currentQ.id]?.selected_option_ids;
                  selectedIds = raw ? JSON.parse(raw) : [];
                } catch { selectedIds = []; }
                const checked = selectedIds.includes(opt.id);

                const toggleComplex = () => {
                  const current = (() => {
                    try {
                      const raw = answers[currentQ.id]?.selected_option_ids;
                      return raw ? JSON.parse(raw) as string[] : [];
                    } catch { return []; }
                  })();
                  const next = checked
                    ? current.filter((id: string) => id !== opt.id)
                    : [...current, opt.id];
                  handleAnswer(currentQ.id, undefined, undefined, next);
                };

                return (
                  <button key={opt.id} onClick={toggleComplex}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm transition-all
                      ${checked
                        ? 'border-orange-400 bg-orange-50 text-orange-900 font-medium'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'}`}>
                    <span className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
                      ${checked ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}`}>
                      {checked && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                    <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0
                      ${checked ? 'border-orange-400 bg-orange-100 text-orange-700' : 'border-gray-300 text-gray-500'}`}>
                      {opt.label}
                    </span>
                    {opt.option_text}
                  </button>
                );
              })}
            </div>
          )}

          {/* Essay textarea */}
          {currentQ.type === 'essay' && (
            <div>
              <div className="flex items-center gap-2 text-xs text-orange-600 mb-2">
                <AlignLeft className="w-4 h-4" /> Jawaban essay — tulis dengan jelas dan lengkap
              </div>
              <textarea
                rows={6}
                value={answers[currentQ.id]?.answer_text ?? ''}
                onChange={e => handleAnswer(currentQ.id, undefined, e.target.value)}
                placeholder="Tulis jawaban Anda di sini..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between pt-2">
            <button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" /> Sebelumnya
            </button>
            <button onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))} disabled={currentIdx === questions.length - 1}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">
              Selanjutnya <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Question navigator */}
        <div className="w-48 bg-white rounded-xl border border-gray-100 shadow-sm p-4 self-start">
          <p className="text-xs font-semibold text-gray-500 mb-3">Navigasi Soal</p>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((q, i) => {
              const ans = answers[q.id];
              const isAnswered = (() => {
                if (!ans) return false;
                if (q.type === 'multiple_choice')         return !!ans.selected_option_id;
                if (q.type === 'multiple_choice_complex') {
                  try { return JSON.parse(ans.selected_option_ids ?? '[]').length > 0; } catch { return false; }
                }
                return !!(ans.answer_text?.trim());
              })();
              const isCurrent  = i === currentIdx;
              return (
                <button key={q.id} onClick={() => setCurrentIdx(i)}
                  className={`w-full aspect-square rounded-lg text-xs font-bold transition-all
                    ${isCurrent  ? 'bg-blue-600 text-white' :
                      isAnswered ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' :
                                   'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300 flex-shrink-0" /> Dijawab
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-4 h-4 rounded bg-gray-100 flex-shrink-0" /> Belum
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-4 h-4 rounded bg-blue-600 flex-shrink-0" /> Sekarang
            </div>
          </div>
        </div>
      </div>

      {/* Confirm submit modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Send className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Kumpulkan Ujian?</h3>
                <p className="text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600">
              <p>Soal dijawab: <span className="font-bold text-gray-800">{answeredCount}</span> / {questions.length}</p>
              {answeredCount < questions.length && (
                <p className="text-amber-600 mt-1">⚠ {questions.length - answeredCount} soal belum dijawab</p>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">Kembali</button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60">
                {submitting ? 'Mengumpulkan...' : 'Ya, Kumpulkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
