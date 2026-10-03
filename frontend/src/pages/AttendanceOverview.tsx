import { ClipboardCheck, Construction } from 'lucide-react';

export default function AttendanceOverview() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
          <ClipboardCheck className="w-10 h-10 text-amber-500" />
        </div>
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold mb-3">
            <Construction className="w-3.5 h-3.5" />
            Coming Soon
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Halaman Absensi</h1>
          <p className="text-gray-500 text-sm mt-2">
            Halaman rekap absensi siswa sedang dalam pengembangan.
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Sementara, absensi bisa diakses melalui{' '}
            <span className="font-medium text-gray-600">Kelas → Mata Pelajaran → Absensi</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
