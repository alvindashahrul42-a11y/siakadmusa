import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Search, ChevronLeft, ChevronRight, X, Users, ArrowLeft, UserPlus } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getClassStudents,
  getAvailableStudents,
  addStudentToClass,
  removeStudentFromClass,
} from '../services/class.service';
import { getClassById } from '../services/class.service';
import type { Class, ClassStudent, AvailableStudent } from '../types/class';

const token = () => localStorage.getItem('token') ?? '';

export default function ClassStudents() {
  const { classId } = useParams<{ classId: string }>();
  const navigate    = useNavigate();

  const [classData, setClassData]   = useState<Class | null>(null);
  const [students, setStudents]     = useState<ClassStudent[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  // pagination & filter
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [search, setSearch]         = useState('');
  const [searchInput, setSearchInput] = useState('');
  const LIMIT = 10;

  // Add student modal
  const [showAddModal, setShowAddModal]   = useState(false);
  const [available, setAvailable]         = useState<AvailableStudent[]>([]);
  const [availSearch, setAvailSearch]     = useState('');
  const [availLoading, setAvailLoading]   = useState(false);
  const [addingId, setAddingId]           = useState<string | null>(null);

  // delete
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToRemove, setItemToRemove]       = useState<ClassStudent | null>(null);
  const [removing, setRemoving]               = useState(false);

  // ── Load class info ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!classId) return;
    getClassById(classId, token()).then(setClassData).catch(() => {});
  }, [classId]);

  // ── Fetch enrolled students ────────────────────────────────────────────────

  const fetchStudents = useCallback(async () => {
    if (!classId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getClassStudents(
        classId,
        { page, limit: LIMIT, search: search || undefined },
        token()
      );
      setStudents(res.data);
      setTotal(res.metadata.total);
      setTotalPages(res.metadata.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat siswa');
    } finally {
      setLoading(false);
    }
  }, [classId, page, search]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  // ── Available students ─────────────────────────────────────────────────────

  const openAddModal = async () => {
    setShowAddModal(true);
    setAvailSearch('');
    await loadAvailable('');
  };

  const loadAvailable = async (q: string) => {
    if (!classId) return;
    setAvailLoading(true);
    try {
      const data = await getAvailableStudents(classId, q, token());
      setAvailable(data);
    } catch {
      setAvailable([]);
    } finally {
      setAvailLoading(false);
    }
  };

  const handleAvailSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setAvailSearch(q);
    loadAvailable(q);
  };

  const handleAdd = async (studentId: string) => {
    if (!classId) return;
    setAddingId(studentId);
    try {
      await addStudentToClass(classId, studentId, token());
      await loadAvailable(availSearch);
      fetchStudents();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menambahkan');
    } finally {
      setAddingId(null);
    }
  };

  // ── Remove ─────────────────────────────────────────────────────────────────

  const openRemove    = (s: ClassStudent) => { setItemToRemove(s); setShowDeleteModal(true); };

  const confirmRemove = async () => {
    if (!classId || !itemToRemove) return;
    setRemoving(true);
    try {
      await removeStudentFromClass(classId, itemToRemove.student_id, token());
      setShowDeleteModal(false);
      setItemToRemove(null);
      fetchStudents();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal mengeluarkan siswa');
    } finally {
      setRemoving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard/classes')}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Siswa Kelas {classData?.name ?? '...'}
          </h1>
          {classData && (
            <p className="text-sm text-gray-500">
              {classData.academic_year_name}
              {classData.major_code ? ` · ${classData.major_code}` : ''}
              {classData.homeroom_teacher_name ? ` · Wali: ${classData.homeroom_teacher_name}` : ''}
              {classData.capacity
                ? ` · Kapasitas: ${total}/${classData.capacity}`
                : ` · ${total} siswa`}
            </p>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama / NIS..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button onClick={handleSearch}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
            Cari
          </button>
        </div>
        <button onClick={openAddModal}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-2.5 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md font-semibold text-sm">
          <UserPlus className="w-4 h-4" />
          Tambah Siswa
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">Memuat data...</div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-600 mb-3">{error}</p>
            <button onClick={fetchStudents} className="text-sm text-blue-600 underline">Coba lagi</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">#</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">NIS</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Nama Lengkap</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Jenis Kelamin</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Tahun Masuk</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Email</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Status</th>
                  <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-gray-400">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Belum ada siswa di kelas ini</p>
                    </td>
                  </tr>
                ) : students.map((s, i) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-gray-400">{(page - 1) * LIMIT + i + 1}</td>
                    <td className="px-5 py-4 font-mono text-gray-700">{s.student_number}</td>
                    <td className="px-5 py-4 font-medium text-gray-800">{s.student_name}</td>
                    <td className="px-5 py-4 text-gray-600 capitalize">{s.gender ?? '—'}</td>
                    <td className="px-5 py-4 text-gray-600">{s.enrollment_year ?? '—'}</td>
                    <td className="px-5 py-4 text-gray-600">{s.email}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                        {s.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-center">
                        <button onClick={() => openRemove(s)} title="Keluarkan dari kelas"
                          className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-xl border border-gray-100 shadow-sm">
        <p className="text-sm text-gray-500">
          Menampilkan{' '}
          <span className="font-semibold text-gray-800">
            {total === 0 ? 0 : (page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)}
          </span>{' '}
          dari <span className="font-semibold text-gray-800">{total}</span> siswa
        </p>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage(1)} disabled={page === 1}
            className="px-2.5 py-1.5 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">«</button>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce<(number | '...')[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
              acc.push(p);
              return acc;
            }, [])
            .map((p, idx) =>
              p === '...' ? <span key={`e-${idx}`} className="px-2 text-gray-400 text-sm">…</span> : (
                <button key={p} onClick={() => setPage(p as number)}
                  className={`min-w-[32px] h-8 rounded-lg text-sm font-medium border transition-colors ${page === p ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                  {p}
                </button>
              )
            )}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => setPage(totalPages)} disabled={page === totalPages || totalPages === 0}
            className="px-2.5 py-1.5 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">»</button>
        </div>
      </div>

      {/* Add student modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center px-6 py-5 border-b shrink-0">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-gray-800">Tambah Siswa ke Kelas</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 pt-4 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari siswa berdasarkan nama / NIS..."
                  value={availSearch}
                  onChange={handleAvailSearch}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">Menampilkan siswa yang belum terdaftar di kelas ini</p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2">
              {availLoading ? (
                <div className="text-center py-8 text-gray-400 text-sm">Mencari siswa...</div>
              ) : available.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <Plus className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  {availSearch ? 'Tidak ada siswa cocok' : 'Semua siswa sudah terdaftar'}
                </div>
              ) : available.map(s => (
                <div key={s.student_id}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{s.student_name}</p>
                    <p className="text-xs text-gray-500">
                      NIS: {s.student_number}
                      {s.enrollment_year ? ` · Angkatan ${s.enrollment_year}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAdd(s.student_id)}
                    disabled={addingId === s.student_id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                  >
                    {addingId === s.student_id ? 'Menambahkan...' : <><Plus className="w-3.5 h-3.5" /> Tambah</>}
                  </button>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t shrink-0">
              <button onClick={() => setShowAddModal(false)}
                className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold text-sm">
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove confirm modal */}
      {showDeleteModal && itemToRemove && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Keluarkan Siswa</h3>
                <p className="text-sm text-gray-500">Dari kelas {classData?.name}</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Yakin ingin mengeluarkan <span className="font-semibold">"{itemToRemove.student_name}"</span> dari kelas ini?
            </p>
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setItemToRemove(null); }}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold text-sm">
                Batal
              </button>
              <button onClick={confirmRemove} disabled={removing}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-sm disabled:opacity-60">
                {removing ? 'Mengeluarkan...' : 'Ya, Keluarkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
