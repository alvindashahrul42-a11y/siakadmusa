import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, ClipboardList, ChevronLeft, ChevronRight, Download, Upload, FileSpreadsheet } from 'lucide-react';
import { getGrades, upsertGrade, downloadGradeTemplate, importGrades as importGradesApi } from '../services/grade.service';
import { getClassSubjects } from '../services/classSubject.service';
import { getClassById } from '../services/class.service';
import type { Grade, GradeFormData } from '../types/grade';
import type { ClassSubject } from '../types/classSubject';
import type { Class } from '../types/class';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/Toast';

const token = () => localStorage.getItem('token') ?? '';

export default function Grades() {
  const { classId, classSubjectId } = useParams<{ classId: string; classSubjectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit  = user?.role === 'superuser' || user?.role === 'teacher';

  const [classData, setClassData]     = useState<Class | null>(null);
  const [cs, setCs]                   = useState<ClassSubject | null>(null);
  const [grades, setGrades]           = useState<Grade[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [total, setTotal]             = useState(0);
  const LIMIT = 50;

  // In-memory edits: studentId -> partial form values
  const [edits, setEdits] = useState<Record<string, Partial<GradeFormData>>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved,  setSaved]  = useState<Record<string, boolean>>({});

  // Import Excel state
  const fileInputRef              = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  // ── Load class + classSubject info ─────────────────────────────────────────

  useEffect(() => {
    if (!classId || !classSubjectId) return;
    const t = token();
    Promise.all([
      getClassById(classId, t),
      getClassSubjects(classId, { limit: 100 }, t),
    ]).then(([cls, csRes]) => {
      setClassData(cls);
      const found = csRes.data.find(x => x.id === classSubjectId);
      setCs(found ?? null);
    }).catch(() => {});
  }, [classId, classSubjectId]);

  // ── Fetch grades ───────────────────────────────────────────────────────────

  const fetchGrades = useCallback(async () => {
    if (!classSubjectId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getGrades({ class_subject_id: classSubjectId, page, limit: LIMIT }, token());
      setGrades(res.data);
      setTotal(res.metadata.total);
      setTotalPages(res.metadata.total_pages);
      setEdits({});
      setSaved({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat nilai');
    } finally {
      setLoading(false);
    }
  }, [classSubjectId, page]);

  useEffect(() => { fetchGrades(); }, [fetchGrades]);

  // ── Inline edit helpers ────────────────────────────────────────────────────

  const handleCellChange = (studentId: string, field: keyof GradeFormData, value: string) => {
    setEdits(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value },
    }));
    setSaved(prev => ({ ...prev, [studentId]: false }));
  };

  const handleSaveRow = async (grade: Grade) => {
    const edit = edits[grade.student_id];
    if (!edit || Object.keys(edit).length === 0) return;

    setSaving(prev => ({ ...prev, [grade.student_id]: true }));
    try {
      const payload: GradeFormData = {
        class_subject_id:   classSubjectId!,
        student_id:          grade.student_id,
        assignment_score:    edit.assignment_score  !== undefined ? edit.assignment_score  : grade.assignment_score  ?? '',
        midterm_score:       edit.midterm_score     !== undefined ? edit.midterm_score     : grade.midterm_score     ?? '',
        final_exam_score:    edit.final_exam_score  !== undefined ? edit.final_exam_score  : grade.final_exam_score  ?? '',
        final_score:         edit.final_score       !== undefined ? edit.final_score       : grade.final_score       ?? '',
        notes:               edit.notes             !== undefined ? edit.notes             : grade.notes             ?? '',
      };
      await upsertGrade(payload, token());
      setSaved(prev => ({ ...prev, [grade.student_id]: true }));
      fetchGrades();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      alert(axiosErr?.response?.data?.message ?? 'Gagal menyimpan nilai');
    } finally {
      setSaving(prev => ({ ...prev, [grade.student_id]: false }));
    }
  };

  const getValue = (grade: Grade, field: keyof GradeFormData) => {
    const edit = edits[grade.student_id];
    if (edit && field in edit) return edit[field as keyof typeof edit] as string ?? '';
    const raw = grade[field as keyof Grade];
    return raw !== null && raw !== undefined ? String(raw) : '';
  };

  // ── Import / Export Excel ──────────────────────────────────────────────────

  const handleDownloadTemplate = async () => {
    if (!classSubjectId) return;
    try {
      const blob     = await downloadGradeTemplate(classSubjectId, token());
      const filename = `template_nilai_${cs?.subject_name?.replace(/\s+/g, '_') ?? 'mapel'}.xlsx`;
      const url      = URL.createObjectURL(blob);
      const a        = document.createElement('a');
      a.href         = url;
      a.download     = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Template berhasil diunduh');
    } catch {
      toast.error('Gagal mengunduh template');
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !classSubjectId) return;
    e.target.value = '';

    setImporting(true);
    try {
      const result = await importGradesApi(classSubjectId, file, token());
      toast.success(`${result.imported_count} data nilai berhasil diimport`);
      fetchGrades();
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { message?: string; errors?: { row: number; nis: string; message: string }[] } } };
      const errs  = axErr?.response?.data?.errors;
      if (errs && errs.length > 0) {
        toast.error(`Import gagal: ${errs.map(e => `Baris ${e.row} (${e.nis}): ${e.message}`).join(' | ')}`);
      } else {
        toast.error(axErr?.response?.data?.message ?? 'Gagal mengimport nilai');
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
        <button onClick={() => navigate(`/dashboard/classes/${classId}/subjects`)}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Nilai — {cs?.subject_name ?? '...'} · {classData?.name ?? '...'}
          </h1>
          <p className="text-sm text-gray-500">
            {classData ? `Kelas ${classData.grade_level} · ${classData.academic_year_name}` : ''}
            {cs?.teacher_name ? ` · ${cs.teacher_name}` : ''}
          </p>
        </div>
        {canEdit && (
          <div className="ml-auto flex items-center gap-2">
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
              title="Download template Excel nilai"
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
              title="Upload nilai dari file Excel"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">{importing ? 'Mengimport...' : 'Upload Excel'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">Memuat nilai...</div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-600 mb-3">{error}</p>
            <button onClick={fetchGrades} className="text-sm text-blue-600 underline">Coba lagi</button>
          </div>
        ) : grades.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Belum ada data nilai</p>
            <p className="text-xs mt-1">Pastikan siswa sudah terdaftar di kelas ini</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3.5 font-semibold text-gray-600">#</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-gray-600">NIS</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-gray-600">Nama Siswa</th>
                  <th className="text-center px-4 py-3.5 font-semibold text-gray-600">Tugas</th>
                  <th className="text-center px-4 py-3.5 font-semibold text-gray-600">UTS</th>
                  <th className="text-center px-4 py-3.5 font-semibold text-gray-600">UAS</th>
                  <th className="text-center px-4 py-3.5 font-semibold text-gray-600">Nilai Akhir</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-gray-600">Catatan</th>
                  {canEdit && <th className="text-center px-4 py-3.5 font-semibold text-gray-600">Simpan</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {grades.map((g, i) => {
                  const hasEdit  = !!edits[g.student_id] && Object.keys(edits[g.student_id]).length > 0;
                  const isSaving = saving[g.student_id];
                  const isSaved  = saved[g.student_id];
                  const finalVal = parseFloat(getValue(g, 'final_score'));
                  const finalColor = isNaN(finalVal) ? '' : finalVal >= 75 ? 'text-emerald-700 font-bold' : finalVal >= 60 ? 'text-amber-600 font-bold' : 'text-red-600 font-bold';

                  return (
                    <tr key={g.student_id} className={`transition-colors ${hasEdit ? 'bg-amber-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-3 text-gray-400">{(page - 1) * LIMIT + i + 1}</td>
                      <td className="px-4 py-3 font-mono text-gray-600 text-xs">{g.student_number}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{g.student_name}</td>

                      {(['assignment_score', 'midterm_score', 'final_exam_score', 'final_score'] as const).map(field => (
                        <td key={field} className="px-4 py-3 text-center">
                          {canEdit ? (
                            <input
                              type="number" min="0" max="100" step="0.01"
                              value={getValue(g, field)}
                              onChange={e => handleCellChange(g.student_id, field, e.target.value)}
                              className={`w-16 text-center px-2 py-1 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400
                                ${field === 'final_score' ? finalColor : ''}
                                ${hasEdit ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}`}
                              placeholder="—"
                            />
                          ) : (
                            <span className={field === 'final_score' ? finalColor : 'text-gray-700'}>
                              {getValue(g, field) || '—'}
                            </span>
                          )}
                        </td>
                      ))}

                      <td className="px-4 py-3">
                        {canEdit ? (
                          <input
                            type="text"
                            value={getValue(g, 'notes')}
                            onChange={e => handleCellChange(g.student_id, 'notes', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="—"
                          />
                        ) : (
                          <span className="text-gray-500">{getValue(g, 'notes') || '—'}</span>
                        )}
                      </td>

                      {canEdit && (
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleSaveRow(g)}
                            disabled={!hasEdit || isSaving}
                            title="Simpan baris ini"
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                              ${isSaved  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                hasEdit  ? 'bg-blue-600 text-white hover:bg-blue-700' :
                                           'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                          >
                            <Save className="w-3.5 h-3.5" />
                            {isSaving ? 'Simpan...' : isSaved ? 'Tersimpan' : 'Simpan'}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">
            Menampilkan <span className="font-semibold">{(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)}</span> dari <span className="font-semibold">{total}</span> siswa
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

      {canEdit && grades.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          Klik di kolom nilai untuk mengedit, lalu tekan tombol <strong>Simpan</strong> di baris yang bersangkutan.
        </p>
      )}
    </div>
  );
}
