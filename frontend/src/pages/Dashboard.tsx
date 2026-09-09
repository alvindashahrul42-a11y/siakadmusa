import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="bg-white shadow-md">
          <div className="px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
              <p className="text-sm text-gray-600">Selamat datang kembali!</p>
            </div>

            <div className="flex items-center gap-4">
              {/* User Info with Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-3 hover:bg-gray-50 px-3 py-2 rounded-lg transition"
                >
                  <div className="text-right">
                    <div className="font-semibold text-gray-800">
                      {user?.profile?.full_name || user?.username}
                    </div>
                    <div className="text-sm text-gray-600 capitalize">
                      {user?.role}
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition"
                    >
                      <span className="text-xl">🚪</span>
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Total Siswa</p>
                  <p className="text-3xl font-bold text-gray-800">1,234</p>
                </div>
                <div className="text-5xl">👥</div>
              </div>
              <div className="mt-4 text-sm text-green-600">
                ↑ 12% dari bulan lalu
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Total Guru</p>
                  <p className="text-3xl font-bold text-gray-800">48</p>
                </div>
                <div className="text-5xl">👨‍🏫</div>
              </div>
              <div className="mt-4 text-sm text-green-600">
                ↑ 5% dari bulan lalu
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Total Kelas</p>
                  <p className="text-3xl font-bold text-gray-800">24</p>
                </div>
                <div className="text-5xl">📚</div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Sama dengan bulan lalu
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Kehadiran</p>
                  <p className="text-3xl font-bold text-gray-800">94%</p>
                </div>
                <div className="text-5xl">📊</div>
              </div>
              <div className="mt-4 text-sm text-green-600">
                ↑ 2% dari bulan lalu
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Feed */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-800">
                  Aktivitas Terbaru
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { icon: '📝', text: 'Nilai ujian matematika telah diinput', time: '2 jam lalu' },
                  { icon: '👤', text: '5 siswa baru telah terdaftar', time: '3 jam lalu' },
                  { icon: '📅', text: 'Jadwal semester baru telah dibuat', time: '5 jam lalu' },
                  { icon: '📊', text: 'Laporan bulanan telah dihasilkan', time: '1 hari lalu' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="text-2xl">{activity.icon}</div>
                    <div className="flex-1">
                      <p className="text-gray-800">{activity.text}</p>
                      <p className="text-sm text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-800">
                  Aksi Cepat
                </h3>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                <button className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition text-center">
                  <div className="text-3xl mb-2">➕</div>
                  <div className="text-sm font-semibold text-gray-800">Tambah Siswa</div>
                </button>
                <button className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition text-center">
                  <div className="text-3xl mb-2">📝</div>
                  <div className="text-sm font-semibold text-gray-800">Input Nilai</div>
                </button>
                <button className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition text-center">
                  <div className="text-3xl mb-2">📅</div>
                  <div className="text-sm font-semibold text-gray-800">Buat Jadwal</div>
                </button>
                <button className="p-4 border-2 border-orange-200 rounded-lg hover:bg-orange-50 transition text-center">
                  <div className="text-3xl mb-2">📊</div>
                  <div className="text-sm font-semibold text-gray-800">Lihat Laporan</div>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
