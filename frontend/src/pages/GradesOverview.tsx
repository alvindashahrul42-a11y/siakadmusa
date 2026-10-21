import { useState, useEffect } from 'react';
import {
  ClipboardList, BookOpen, Star, ChevronDown, ChevronUp,
  Trophy, TrendingUp, AlertCircle,
} from 'lucide-react';
import { getMyGrades, type MyGradeItem, type MyExamScoreItem } from '../services/grade.service';
import { useAuth } from '../contexts/AuthContext';

const token = () => localStorage.getItem('token') ?? '';

// ── Helpers ───────────────────────────────────────────────────────────────────
function scoreColor(score: number | null): string {
  if (score === null) return 'text-gray-400';
  if (score >= 85) return 'text-emerald-600 font-bold';
  if (score >= 70) return 'text-blue-600 font-semibold';
  if (score >= 60) return 'text-amber-600 font-semibold';
  return 'text-red-600 font-bold';
}

function scoreBadge(score: number | null) {
  if (score === null) return <span className="text-gray-300 text-xs">—</span>;
  return (
    <span className={`text-sm tabular-nums ${scoreColor(score)}`}>
      {Number(score).toFixed(0)}
    </span>
  );
}

function ScorePill({ score }: { score: number | null }) {
  if (score === null) return <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full text-xs">—</span>;
  const cls =
    score >= 85 ? 'bg-emerald-100 text-emerald-700' :
    score >= 70 ? 'bg-blue-100 text-blue-700' :
    score >= 60 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700';
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums ${cls}`}>
      {Number(score).toFixed(0)}
    </span>
  );
}

// ── Group grades by academic year ─────────────────────────────────────────────
function groupByYear(grades: MyGradeItem[]) {
  const map = new Map<string, { active: boolean; items: MyGradeItem[] }>();
  for (const g of grades) {
    if (!map.has(g.academic_year_name)) {
      map.set(g.academic_year_name, { active: !!g.year_is_active, items: [] });
    }
    map.get(g.academic_year_name)!.items.push(g);
  }
  // Sort: active year first, then by name desc
  return [...map.entries()].sort((a, b) => {
    if (a[1].active !== b[1].active) return a[1].active ? -1 : 1;
    return b[0].localeCompare(a[0]);
  });
}

// ── Main component ────────────────────────────────────────────────────────────
export default function GradesOverview() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';

  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [grades, setGrades]       = useState<MyGradeItem[]>([]);
  const [examScores, setExamScores] = useState<MyExamScoreItem[]>([]);
  const [studentInfo, setStudentInfo] = useState<{ full_name: string; student_number: string } | null>(null);

  // collapse state per year
  const [collapsed, setCollapsed]   = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab]   = useState<'academic' | 'exam'>('academic');

  useEffect(() => {
    if (!isStudent) return;
    setLoading(true);
    getMyGrades(token())
      .then(data => {
        setStudentInfo(data.student);
        setGrades(data.grades);
        setExamScores(data.exam_scores);
      })
      .catch(err => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setError(msg ?? 'Gagal memuat nilai');
      })
      .finally(() => setLoading(false));
  }, [isStudent]);

  const toggleYear = (year: string) =>
    setCollapsed(prev => ({ ...prev, [year]: !prev[year] }));

  // ── Non-student view ──────────────────────────────────────────────────────
  if (!isStudent) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Rekap Nilai</h1>
          <p className="text-sm text-gray-500">Lihat nilai siswa melalui Kelas → Mata Pelajaran → Nilai</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Pilih kelas dan mata pelajaran untuk melihat nilai siswa.</p>
        </div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-400">Memuat nilai...</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm text-blue-600 underline">
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  const byYear = groupByYear(grades);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Nilai Saya</h1>
          {studentInfo && (
            <p className="text-sm text-gray-500">
              {studentInfo.full_name} · NIS {studentInfo.student_number}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('academic')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'academic'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Akademik</span>
              <span className="xs:hidden">Nilai</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('exam')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'exam'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Ujian Online</span>
              <span className="xs:hidden">Ujian</span>
            </span>
          </button>
        </div>
      </div>

      {/* ── TAB: Nilai Akademik ── */}
      {activeTab === 'academic' && (
        <>
          {byYear.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center text-gray-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Belum ada data nilai akademik</p>
              <p className="text-xs mt-1">Nilai akan muncul setelah guru menginput nilai</p>
            </div>
          ) : (
            byYear.map(([year, { active, items }]) => {
              const isOpen = collapsed[year] !== true;
              // hitung rata-rata nilai akhir
              const finals = items.map(i => Number(i.final_score)).filter(v => !isNaN(v) && v > 0);
              const avg    = finals.length > 0 ? finals.reduce((a, b) => a + b, 0) / finals.length : null;

              return (
                <div key={year} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Year header */}
                  <button
                    onClick={() => toggleYear(year)}
                    className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                      <span className="font-bold text-gray-800 text-sm sm:text-base truncate">TA {year}</span>
                      {active && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold flex-shrink-0">
                          Aktif
                        </span>
                      )}
                      <span className="text-xs text-gray-400 hidden sm:inline flex-shrink-0">{items.length} mapel</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {avg !== null && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
                          <span className={`text-xs sm:text-sm font-bold ${scoreColor(avg)}`}>
                            {avg.toFixed(1)}
                          </span>
                        </div>
                      )}
                      {isOpen
                        ? <ChevronUp className="w-4 h-4 text-gray-400" />
                        : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>

                  {/* Grade table */}
                  {isOpen && (
                    <div className="overflow-x-auto border-t border-gray-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-gray-600">
                            <th className="text-left px-4 py-3 font-semibold">Mata Pelajaran</th>
                            <th className="text-left px-3 py-3 font-semibold text-xs hidden md:table-cell">Guru</th>
                            <th className="text-center px-3 py-3 font-semibold text-xs sm:text-sm">Tugas</th>
                            <th className="text-center px-3 py-3 font-semibold text-xs sm:text-sm">UTS</th>
                            <th className="text-center px-3 py-3 font-semibold text-xs sm:text-sm">UAS</th>
                            <th className="text-center px-3 py-3 font-semibold text-xs sm:text-sm">Akhir</th>
                            <th className="text-left px-3 py-3 font-semibold text-xs hidden lg:table-cell">Catatan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {items.map(g => (
                            <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-mono hidden sm:inline">
                                    {g.subject_code}
                                  </span>
                                  <span className="font-medium text-gray-800 text-sm">{g.subject_name}</span>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-xs text-gray-400 hidden md:table-cell">
                                {g.teacher_name ?? '—'}
                              </td>
                              <td className="px-3 py-3 text-center">{scoreBadge(g.assignment_score)}</td>
                              <td className="px-3 py-3 text-center">{scoreBadge(g.midterm_score)}</td>
                              <td className="px-3 py-3 text-center">{scoreBadge(g.final_exam_score)}</td>
                              <td className="px-3 py-3 text-center">
                                <ScorePill score={g.final_score} />
                              </td>
                              <td className="px-3 py-3 text-xs text-gray-400 hidden lg:table-cell">
                                {g.notes ?? ''}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </>
      )}

      {/* ── TAB: Nilai Ujian Online ── */}
      {activeTab === 'exam' && (
        <>
          {examScores.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center text-gray-400">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Belum ada nilai ujian online</p>
              <p className="text-xs mt-1">Nilai akan muncul setelah ujian selesai dinilai</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-600">
                      <th className="text-left px-5 py-3.5 font-semibold">Ujian</th>
                      <th className="text-left px-4 py-3.5 font-semibold">Mata Pelajaran</th>
                      <th className="text-left px-4 py-3.5 font-semibold text-xs text-gray-400">Kelas</th>
                      <th className="text-center px-4 py-3.5 font-semibold text-xs text-gray-400">Tanggal</th>
                      <th className="text-center px-4 py-3.5 font-semibold">Status</th>
                      <th className="text-center px-5 py-3.5 font-semibold">Nilai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {examScores.map((e, i) => {
                      const statusMap: Record<string, { label: string; cls: string }> = {
                        graded:    { label: 'Sudah dinilai',  cls: 'bg-indigo-100 text-indigo-700' },
                        submitted: { label: 'Dikumpulkan',    cls: 'bg-emerald-100 text-emerald-700' },
                        timed_out: { label: 'Waktu habis',    cls: 'bg-red-100 text-red-600' },
                      };
                      const st = statusMap[e.attempt_status] ?? { label: e.attempt_status, cls: 'bg-gray-100 text-gray-500' };

                      return (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3.5">
                            <div>
                              <p className="font-medium text-gray-800">{e.exam_name}</p>
                              <span className="text-xs text-gray-400">{e.exam_type_code}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-mono">
                                {e.subject_code}
                              </span>
                              <span className="text-gray-800">{e.subject_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-gray-400">{e.class_name}</td>
                          <td className="px-4 py-3.5 text-center text-xs text-gray-500">
                            {new Date(e.exam_date).toLocaleDateString('id-ID', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${st.cls}`}>
                              {st.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            {e.total_score !== null ? (
                              <div className="flex items-center justify-center gap-1">
                                <Star className="w-3.5 h-3.5 text-amber-500" />
                                <span className={`text-sm font-bold tabular-nums ${scoreColor(e.total_score)}`}>
                                  {Number(e.total_score).toFixed(1)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">Belum dinilai</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Legend */}
      {activeTab === 'academic' && grades.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 px-1">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> ≥85 Sangat Baik</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> 70–84 Baik</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> 60–69 Cukup</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> &lt;60 Kurang</span>
        </div>
      )}
    </div>
  );
}
