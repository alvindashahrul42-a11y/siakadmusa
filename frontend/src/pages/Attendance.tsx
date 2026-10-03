import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Users, BarChart2, RefreshCw } from 'lucide-react';
import { bulkUpsertAttendance, getAttendanceByDate, getAttendanceSummary } from '../services/attendance.service';
import { getClassSubjects } from '../services/classSubject.service';
import { getClassStudents } from '../services/class.service';
import { getClassById } from '../services/class.service';
import type { Attendance as AttendanceType, AttendanceSummary, AttendanceStatus } from '../types/attendance';
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_COLORS } from '../types/attendance';
import type { ClassSubject } from '../types/classSubject';
import type { ClassStudent, Class } from '../types/class';
import { useAuth } from '../contexts/AuthContext';

const token = () => localStorage.getItem('token') ?? '';

const STATUSES: AttendanceStatus[] = ['present', 'late', 'sick', 'permission', 'absent'];

type ViewMode = 'input' | 'summary';

export default function Attendance() {
  const { classId, classSubjectId } = useParams<{ classId: string; classSubjectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit  = user?.role === 'superuser' || user?.role === 'teacher';

  const [classData, setClassData]     = useState<Class | null>(null);
  const [cs, setCs]                   = useState<ClassSubject | null>(null);
  const [students, setStudents]       = useState<ClassStudent[]>([]);
  const [viewMode, setViewMode]       = useState<ViewMode>('input');
  const [date, setDate]               = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [statuses, setStatuses]       = useState<Record<string, AttendanceStatus>>({});
  const [notes, setNotes]             = useState<Record<string, string>>({});
  const [existing, setExisting]       = useState<AttendanceType[]>([]);
  const [summary, setSummary]         = useState<AttendanceSummary[]>([]);
  const [loading, setLoading]         = useState(true);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [saveMsg, setSaveMsg]         = useState('');
  const [error, setError]             = useState<string | null>(null);

  // ── Load class + subject + students ───────────────────────────────────────

  useEffect(() => {
    if (!classId || !classSubjectId) return;
    const t = token();
    Promise.all([
      getClassById(classId, t),
      getClassSubjects(classId, { limit: 100 }, t),
      getClassStudents(classId, { limit: 100 }, t),
    ]).then(([cls, csRes, stRes]) => {
      setClassData(cls);
      setCs(csRes.data.find(x => x.id === classSubjectId) ?? null);
      setStudents(stRes.data);
      // Default all to 'present'
      const init: Record<string, AttendanceStatus> = {};
      stRes.data.forEach(s => { init[s.student_id] = 'present'; });
      setStatuses(init);
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, [classId, classSubjectId]);

  // ── Load existing attendance for selected date ─────────────────────────────

  const loadExisting = useCallback(async () => {
    if (!classSubjectId || !date) return;
    try {
      setLoadingExisting(true);
      const data = await getAttendanceByDate(classSubjectId, date, token());
      setExisting(data);
      // Pre-fill form with existing values
      if (data.length > 0) {
        const s: Record<string, AttendanceStatus> = {};
        const n: Record<string, string> = {};
        data.forEach(a => {
          s[a.student_id] = a.status;
          n[a.student_id] = a.notes ?? '';
        });
        setStatuses(prev => ({ ...prev, ...s }));
        setNotes(prev => ({ ...prev, ...n }));
      }
    } catch {
      // Ignore — no existing records is fine
    } finally {
      setLoadingExisting(false);
    }
  }, [classSubjectId, date]);

  useEffect(() => { if (viewMode === 'input') loadExisting(); }, [loadExisting, viewMode]);

  // ── Load summary ───────────────────────────────────────────────────────────

  const loadSummary = useCallback(async () => {
    if (!classSubjectId) return;
    try {
      const data = await getAttendanceSummary(classSubjectId, token());
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat rekap');
    }
  }, [classSubjectId]);

  useEffect(() => { if (viewMode === 'summary') loadSummary(); }, [loadSummary, viewMode]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setStatuses(prev => ({ ...prev, [studentId]: status }));
    setSaveMsg('');
  };

  const setNote = (studentId: string, note: string) => {
    setNotes(prev => ({ ...prev, [studentId]: note }));
  };

  const handleSave = async () => {
    if (!classSubjectId || students.length === 0) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const records = students.map(s => ({
        student_id: s.student_id,
        status:     statuses[s.student_id] ?? 'present',
        notes:      notes[s.student_id] || undefined,
      }));
      await bulkUpsertAttendance({ class_subject_id: classSubjectId, attendance_date: date, records }, token());
      setSaveMsg('Absensi berhasil disimpan');
      loadExisting();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setSaveMsg(axiosErr?.response?.data?.message ?? 'Gagal menyimpan absensi');
    } finally {
      setSaving(false);
    }
  };

  const setAllStatus = (status: AttendanceStatus) => {
    const all: Record<string, AttendanceStatus> = {};
    students.forEach(s => { all[s.student_id] = status; });
    setStatuses(all);
    setSaveMsg('');
  };

  // ── Render summary ─────────────────────────────────────────────────────────

  if (viewMode === 'summary') {
    return (
      <div className="space-y-5">
        <Header classData={classData} cs={cs} classId={classId!} navigate={navigate} />
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b bg-gray-50 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-gray-500" />
            <span className="font-semibold text-gray-700 text-sm">Rekap Kehadiran Siswa</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Siswa</th>
                  <th className="text-center px-4 py-3 font-semibold text-emerald-700">Hadir</th>
                  <th className="text-center px-4 py-3 font-semibold text-amber-700">Terlambat</th>
                  <th className="text-center px-4 py-3 font-semibold text-blue-700">Sakit</th>
                  <th className="text-center px-4 py-3 font-semibold text-violet-700">Izin</th>
                  <th className="text-center px-4 py-3 font-semibold text-red-600">Alpha</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Total</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">% Hadir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {summary.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-gray-400">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>Belum ada data absensi</p>
                    </td>
                  </tr>
                ) : summary.map((s, i) => {
                  const pct = s.total_meetings > 0
                    ? Math.round(((s.present_count + s.late_count) / s.total_meetings) * 100)
                    : 0;
                  return (
                    <tr key={s.student_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{s.student_name}</p>
                        <p className="text-xs text-gray-400 font-mono">{s.student_number}</p>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-emerald-700">{s.present_count}</td>
                      <td className="px-4 py-3 text-center font-semibold text-amber-600">{s.late_count}</td>
                      <td className="px-4 py-3 text-center font-semibold text-blue-600">{s.sick_count}</td>
                      <td className="px-4 py-3 text-center font-semibold text-violet-600">{s.permission_count}</td>
                      <td className="px-4 py-3 text-center font-semibold text-red-600">{s.absent_count}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{s.total_meetings}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${pct >= 75 ? 'bg-emerald-100 text-emerald-700' : pct >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ── Render input ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <Header classData={classData} cs={cs} classId={classId!} navigate={navigate} />
      <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">Memuat data...</div>
      ) : error ? (
        <div className="p-6 bg-white rounded-xl border text-center">
          <p className="text-red-600 mb-2">{error}</p>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 bg-white px-5 py-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-700">Tanggal:</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              <button onClick={loadExisting} disabled={loadingExisting}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" title="Muat ulang">
                <RefreshCw className={`w-4 h-4 text-gray-500 ${loadingExisting ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="flex items-center gap-2 ml-auto flex-wrap">
              <span className="text-xs text-gray-500 font-medium">Set semua:</span>
              {STATUSES.map(s => (
                <button key={s} onClick={() => setAllStatus(s)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${ATTENDANCE_STATUS_COLORS[s]}`}>
                  {ATTENDANCE_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Attendance table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {existing.length > 0 && (
              <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-100 text-xs text-emerald-700 font-medium">
                ✓ Data absensi tanggal ini sudah ada — perubahan akan menimpa data lama
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3.5 font-semibold text-gray-600">#</th>
                    <th className="text-left px-4 py-3.5 font-semibold text-gray-600">NIS</th>
                    <th className="text-left px-4 py-3.5 font-semibold text-gray-600">Nama Siswa</th>
                    <th className="text-center px-4 py-3.5 font-semibold text-gray-600">Status</th>
                    <th className="text-left px-4 py-3.5 font-semibold text-gray-600">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-400">
                        <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p>Belum ada siswa di kelas ini</p>
                      </td>
                    </tr>
                  ) : students.map((s, i) => {
                    const status = statuses[s.student_id] ?? 'present';
                    return (
                      <tr key={s.student_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                        <td className="px-4 py-3 font-mono text-gray-600 text-xs">{s.student_number}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{s.student_name}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {STATUSES.map(st => (
                              <button key={st}
                                onClick={() => canEdit && setStatus(s.student_id, st)}
                                disabled={!canEdit}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all
                                  ${status === st
                                    ? `${ATTENDANCE_STATUS_COLORS[st]} ring-2 ring-offset-1 ring-current`
                                    : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                                  } ${!canEdit ? 'cursor-default' : 'cursor-pointer'}`}>
                                {ATTENDANCE_STATUS_LABELS[st]}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input type="text"
                            value={notes[s.student_id] ?? ''}
                            onChange={e => setNote(s.student_id, e.target.value)}
                            disabled={!canEdit}
                            placeholder="Opsional..."
                            className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50 disabled:cursor-not-allowed" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Save bar */}
          {canEdit && students.length > 0 && (
            <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-xl border border-gray-100 shadow-sm">
              <p className={`text-sm font-medium ${saveMsg.startsWith('Absensi') ? 'text-emerald-600' : saveMsg ? 'text-red-600' : 'text-gray-400'}`}>
                {saveMsg || `${students.length} siswa · ${date}`}
              </p>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 disabled:opacity-60 font-semibold text-sm transition-colors shadow-sm">
                <Save className="w-4 h-4" />
                {saving ? 'Menyimpan...' : 'Simpan Absensi'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Header({ classData, cs, classId, navigate }: {
  classData: Class | null;
  cs: ClassSubject | null;
  classId: string;
  navigate: (path: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button onClick={() => navigate(`/dashboard/classes/${classId}/subjects`)}
        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
        <ArrowLeft className="w-4 h-4 text-gray-600" />
      </button>
      <div>
        <h1 className="text-xl font-bold text-gray-800">
          Absensi — {cs?.subject_name ?? '...'} · {classData?.name ?? '...'}
        </h1>
        <p className="text-sm text-gray-500">
          {classData ? `Kelas ${classData.grade_level} · ${classData.academic_year_name}` : ''}
          {cs?.teacher_name ? ` · ${cs.teacher_name}` : ''}
        </p>
      </div>
    </div>
  );
}

function ViewToggle({ viewMode, setViewMode }: {
  viewMode: 'input' | 'summary';
  setViewMode: (v: 'input' | 'summary') => void;
}) {
  return (
    <div className="flex bg-gray-100 p-1 rounded-xl w-fit gap-1">
      <button onClick={() => setViewMode('input')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
          ${viewMode === 'input' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
        <Users className="w-4 h-4" /> Input Absensi
      </button>
      <button onClick={() => setViewMode('summary')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
          ${viewMode === 'summary' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
        <BarChart2 className="w-4 h-4" /> Rekap
      </button>
    </div>
  );
}
