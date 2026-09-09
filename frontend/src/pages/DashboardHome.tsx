export default function DashboardHome() {
  return (
    <>
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
    </>
  );
}
