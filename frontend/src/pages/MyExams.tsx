import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, PlayCircle, CheckCircle2, AlertTriangle, Star } from 'lucide-react';
import { getMyExamSchedules } from '../services/examOnline.service';
import type { StudentExamSchedule, AttemptStatus } from '../types/examOnline';

const token = () => localStorage.getItem('token') ?? '';

const statusInfo = (s: AttemptStatus | null, questionSetId: string | null, submittedAt?: string | null) => {
  if (!questionSetId) return { label: 'Belum ada soal', color: 'bg-gray-100 text-gray-400', canStart: false };
  if (!s)            return { label: 'Belum dikerjakan', color: 'bg-blue-50 text-blue-600', canStart: true };

  // Kalau in_progress tapi submitted_at sudah ada = orphan attempt, anggap waktu habis
  if (s === 'in_progress' && submittedAt) {
    return { label: 'Waktu habis', color: 'bg-red-100 text-red-600', canStart: false };
  }

  const m: Record<AttemptStatus, { label: string; color: string; canStart: boolean }> = {
    in_progress: { label: 'Sedang dikerjakan', color: 'bg-amber-100 text-amber-700', canStart: true },
    submitted:   { label: 'Dikumpulkan',       color: 'bg-emerald-100 text-emerald-700', canStart: false },
    timed_out:   { label: 'Waktu habis',        color: 'bg-red-100 text-red-600',        canStart: false },
    graded:      { label: 'Sudah dinilai',      color: 'bg-indigo-100 text-indigo-700',  canStart: false },
  };
  return m[s];
};

export default function MyExams() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<StudentExamSchedule[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getMyExamSchedules(token())
      .then(setSchedules)
      .catch(err => setError(err instanceof Error ? err.message : 'Gagal memuat ujian'))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  const upcoming = schedules.filter(s => s.exam_date > today);
  const todayExams = schedules.filter(s => s.exam_date === today);
  const past = schedules.filter(s => s.exam_date < today);

  const renderSection = (title: string, items: StudentExamSchedule[], highlight = false) => {
    if (items.length === 0) return null;
    return (
      <div>
        <h2 className={`text-sm font-semibold mb-3 ${highlight ? 'text-blue-700' : 'text-gray-500'}`}>{title}</h2>
        <div className="space-y-3">
          {items.map(s => {
            const info = statusInfo(s.attempt_status, s.question_set_id, s.submitted_at);
            const isToday = s.exam_date === today;
            return (
              <div key={s.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${highlight ? 'border-blue-200' : 'border-gray-100'}`}>
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${isToday ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    <span className="text-lg font-bold leading-none">{new Date(s.exam_date).getDate()}</span>
                    <span className="text-xs">{new Date(s.exam_date).toLocaleString('id-ID', { month: 'short' })}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800">{s.exam_name}</p>
                    <p className="text-sm text-gray-600">{s.subject_name} · {s.class_name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}
                      </span>
                      {s.duration_minutes && (
                        <span>{s.duration_minutes} menit</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${info.color}`}>
                      {info.label}
                    </span>
                    {s.total_score !== null && (
                      <span className="flex items-center gap-1 text-sm font-bold text-gray-700">
                        <Star className="w-3.5 h-3.5 text-amber-500" />{s.total_score}
                      </span>
                    )}
                    {info.canStart && isToday && (
                      <button onClick={() => navigate(`/dashboard/exam-taking/${s.id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700">
                        {s.attempt_status === 'in_progress'
                          ? <><PlayCircle className="w-3.5 h-3.5" /> Lanjutkan</>
                          : <><PlayCircle className="w-3.5 h-3.5" /> Mulai Ujian</>}
                      </button>
                    )}
                    {s.attempt_status === 'graded' && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Ujian Saya</h1>
        <p className="text-sm text-gray-500">Daftar semua jadwal ujian yang perlu Anda ikuti</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">Memuat jadwal ujian...</div>
      ) : error ? (
        <div className="p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-2" />
          <p className="text-red-600 mb-2">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm text-blue-600 underline">Coba lagi</button>
        </div>
      ) : schedules.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center text-gray-400">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Belum ada jadwal ujian</p>
        </div>
      ) : (
        <>
          {renderSection('Ujian Hari Ini', todayExams, true)}
          {renderSection('Ujian Mendatang', upcoming)}
          {renderSection('Ujian Selesai', past)}
        </>
      )}
    </div>
  );
}
