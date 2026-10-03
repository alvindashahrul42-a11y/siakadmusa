import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, X, ChevronDown, Search } from 'lucide-react';
import { getSchedulesByClass, getMySchedules } from '../services/schedule.service';
import { getClasses } from '../services/class.service';
import type { Schedule } from '../types/schedule';
import type { Class } from '../types/class';
import { DAY_NAMES } from '../types/schedule';
import { useAuth } from '../contexts/AuthContext';

const token = () => localStorage.getItem('token') ?? '';

const DAY_ORDER = [1, 2, 3, 4, 5, 6];

const DAY_COLORS: Record<number, { border: string; badge: string }> = {
  1: { border: 'border-l-blue-400',    badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  2: { border: 'border-l-violet-400',  badge: 'bg-violet-50 text-violet-700 border-violet-200' },
  3: { border: 'border-l-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  4: { border: 'border-l-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  5: { border: 'border-l-rose-400',    badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  6: { border: 'border-l-gray-400',    badge: 'bg-gray-100 text-gray-600 border-gray-200' },
};

export default function Schedules() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const isStudent = user?.role === 'student';

  // ── Class search / select state (hanya untuk non-siswa) ──────────────────

  const [classSearch, setClassSearch]   = useState('');
  const [classOptions, setClassOptions] = useState<Class[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef   = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch classes whenever search changes (hanya untuk non-siswa)
  useEffect(() => {
    if (isStudent) return; // siswa tidak butuh dropdown kelas
    setLoadingClasses(true);
    getClasses({ search: classSearch || undefined, limit: 50 }, token())
      .then(res => {
        setClassOptions(res.data);
        // Auto-select first on initial load (no search)
        if (!classSearch && !selectedClass && res.data.length > 0) {
          setSelectedClass(res.data[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingClasses(false));
  }, [classSearch, isStudent]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectClass = (cls: Class) => {
    setSelectedClass(cls);
    setDropdownOpen(false);
    setClassSearch('');
  };

  const handleClearClass = () => {
    setSelectedClass(null);
    setClassSearch('');
    setSchedules([]);
  };

  // ── Schedule state ─────────────────────────────────────────────────────────

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [filterDay, setFilterDay] = useState('');

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isStudent) {
        // Siswa: ambil jadwal kelas sendiri langsung dari backend
        const data = await getMySchedules(
          filterDay ? { day_of_week: parseInt(filterDay) } : undefined,
          token()
        );
        setSchedules(data);
      } else {
        if (!selectedClass) { setSchedules([]); setLoading(false); return; }
        const data = await getSchedulesByClass(
          selectedClass.id,
          filterDay ? { day_of_week: parseInt(filterDay) } : undefined,
          token()
        );
        setSchedules(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat jadwal');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, filterDay, isStudent]);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  // ── Grouped by day ─────────────────────────────────────────────────────────

  const grouped = DAY_ORDER.reduce<Record<number, Schedule[]>>((acc, d) => {
    acc[d] = schedules.filter(s => Number(s.day_of_week) === d);
    return acc;
  }, {} as Record<number, Schedule[]>);

  const activeDays = filterDay
    ? [parseInt(filterDay)]
    : DAY_ORDER.filter(d => grouped[d].length > 0);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-800">Jadwal Pelajaran</h1>
        <p className="text-sm text-gray-500">Jadwal mingguan per kelas</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">

        {/* ── Searchable class picker (hanya untuk guru/admin) ── */}
        {!isStudent && (
          <div className="relative" ref={dropdownRef}>
            <div
              onClick={() => {
                setDropdownOpen(v => !v);
                setTimeout(() => searchRef.current?.focus(), 50);
              }}
              className="flex items-center gap-2 px-3 py-2.5 border border-gray-300 rounded-lg bg-white cursor-pointer min-w-[240px] hover:border-gray-400 transition-colors"
            >
              {selectedClass ? (
                <>
                  <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                    {selectedClass.name}
                    <span className="text-xs text-gray-400 ml-1.5 font-normal">
                      {selectedClass.academic_year_name}
                    </span>
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); handleClearClass(); }}
                    className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-gray-400">Pilih kelas...</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </div>

            {dropdownOpen && (
              <div className="absolute z-30 mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {/* Search input inside dropdown */}
                <div className="p-2 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      ref={searchRef}
                      type="text"
                      placeholder="Cari nama kelas..."
                      value={classSearch}
                      onChange={e => setClassSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Options list */}
                <div className="max-h-64 overflow-y-auto">
                  {loadingClasses ? (
                    <p className="text-center py-6 text-sm text-gray-400">Memuat...</p>
                  ) : classOptions.length === 0 ? (
                    <p className="text-center py-6 text-sm text-gray-400">
                      {classSearch ? `Tidak ditemukan "${classSearch}"` : 'Belum ada data kelas'}
                    </p>
                  ) : (
                    classOptions.map(cls => (
                      <button
                        key={cls.id}
                        onClick={() => handleSelectClass(cls)}
                        className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center justify-between gap-3
                          ${selectedClass?.id === cls.id ? 'bg-blue-50' : ''}`}
                      >
                        <div>
                          <p className={`text-sm font-medium ${selectedClass?.id === cls.id ? 'text-blue-700' : 'text-gray-800'}`}>
                            {cls.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {cls.academic_year_name}
                            {cls.major_name && ` · ${cls.major_name}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-500">Kelas {cls.grade_level}</span>
                          {!cls.is_active && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Nonaktif</span>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Day filter */}
        <div className="relative">
          <select
            value={filterDay}
            onChange={e => setFilterDay(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="">Semua Hari</option>
            {DAY_ORDER.map(d => (
              <option key={d} value={d}>{DAY_NAMES[d]}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {filterDay && (
          <button
            onClick={() => setFilterDay('')}
            className="flex items-center gap-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            <X className="w-4 h-4" /> Reset hari
          </button>
        )}

        <div className="ml-auto flex items-center gap-3">
          {schedules.length > 0 && (
            <span className="text-sm text-gray-500">
              <span className="font-semibold text-gray-800">{schedules.length}</span> slot
            </span>
          )}
          {!isStudent && selectedClass && (
            <button
              onClick={() => navigate(`/dashboard/classes/${selectedClass.id}/schedules`)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
            >
              <CalendarDays className="w-4 h-4" />
              Kelola Jadwal
            </button>
          )}
        </div>

      </div>

      {/* ── Content ── */}
      {!isStudent && !selectedClass ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center text-gray-400">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Pilih kelas untuk melihat jadwal</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">
          Memuat jadwal...
        </div>
      ) : error ? (
        <div className="p-6 text-center bg-white rounded-xl border">
          <p className="text-red-600 mb-3">{error}</p>
          <button onClick={fetchSchedules} className="text-sm text-blue-600 underline">Coba lagi</button>
        </div>
      ) : activeDays.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center text-gray-400">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
          {isStudent
            ? <p>Belum ada jadwal untuk kelasmu</p>
            : <p>Belum ada jadwal untuk kelas <strong>{selectedClass?.name}</strong></p>
          }
          {!isStudent && selectedClass && (
            <button
              onClick={() => navigate(`/dashboard/classes/${selectedClass.id}/schedules`)}
              className="mt-3 text-blue-600 text-sm underline"
            >
              Tambah jadwal sekarang
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {activeDays.map(day => (
            <div key={day} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className={`px-5 py-3 border-b border-l-4 ${DAY_COLORS[day].border} flex items-center justify-between`}>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${DAY_COLORS[day].badge}`}>
                  {DAY_NAMES[day]}
                </span>
                <span className="text-xs text-gray-400">{grouped[day].length} mata pelajaran</span>
              </div>

              <div className="divide-y divide-gray-50">
                {grouped[day]
                  .slice()
                  .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)))
                  .map(item => (
                    <div key={item.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-1.5 text-gray-500 text-sm w-28 flex-shrink-0">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="font-mono">
                          {String(item.start_time).slice(0, 5)}–{String(item.end_time).slice(0, 5)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-mono flex-shrink-0">
                            {item.subject_code}
                          </span>
                          <span className="font-medium text-gray-800 text-sm truncate">
                            {item.subject_name}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.teacher_name
                            ? item.teacher_name
                            : <span className="italic text-gray-400">Belum ada guru</span>}
                          {item.room && <span className="text-gray-400 ml-2">· {item.room}</span>}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
