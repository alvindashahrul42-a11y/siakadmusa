import { ClipboardList, Construction } from 'lucide-react';

export default function GradesOverview() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
          <ClipboardList className="w-10 h-10 text-emerald-500" />
        </div>
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold mb-3">
            <Construction className="w-3.5 h-3.5" />
            Coming Soon
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Halaman Nilai</h1>
          <p className="text-gray-500 text-sm mt-2">
            Halaman rekap nilai siswa sedang dalam pengembangan.
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Sementara, nilai bisa diakses melalui{' '}
            <span className="font-medium text-gray-600">Kelas → Mata Pelajaran → Nilai</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
