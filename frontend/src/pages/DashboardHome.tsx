import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ppdbService from '../services/ppdb.service';
import type { PpdbRegistration } from '../types/ppdb';
import {
  Users, GraduationCap, ClipboardCheck, FileText,
  Image, Building, BookOpen, CheckCircle, Clock, XCircle, AlertCircle,
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, sub, color = 'blue',
}: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string;
}) {
  const colors: Record<string, string> = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    amber:  'bg-amber-50 text-amber-600',
    red:    'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colors[color] ?? colors.blue}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-800 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function QuickLink({ icon, label, to, color = 'blue' }: {
  icon: React.ReactNode; label: string; to: string; color?: string;
}) {
  const navigate = useNavigate();
  const borders: Record<string, string> = {
    blue:   'border-blue-200 hover:bg-blue-50',
    green:  'border-green-200 hover:bg-green-50',
    indigo: 'border-indigo-200 hover:bg-indigo-50',
    amber:  'border-amber-200 hover:bg-amber-50',
    purple: 'border-purple-200 hover:bg-purple-50',
  };
  return (
    <button
      onClick={() => navigate(to)}
      className={`p-4 border-2 rounded-xl transition text-center flex flex-col items-center gap-2 ${borders[color] ?? borders.blue}`}
    >
      <div className="text-2xl">{icon}</div>
      <span className="text-xs font-semibold text-gray-700">{label}</span>
    </button>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-800">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Dashboard Superuser / Admin ───────────────────────────────────────────────

function DashboardAdmin({ role }: { role: string }) {
  const navigate = useNavigate();
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Users className="w-6 h-6" />}    label="Total Pengguna"  value="—" sub="Lihat di menu Pengguna" color="blue" />
        <StatCard icon={<GraduationCap className="w-6 h-6" />} label="Total Siswa" value="—" sub="Lihat di menu Siswa" color="green" />
        <StatCard icon={<ClipboardCheck className="w-6 h-6" />} label="PPDB Masuk" value="—" sub="Lihat di menu PPDB" color="indigo" />
        <StatCard icon={<FileText className="w-6 h-6" />}  label="Artikel"  value="—" sub="Lihat di menu Artikel" color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Aksi Cepat">
          <div className="grid grid-cols-3 gap-3">
            {role === 'superuser' && (
              <QuickLink icon={<Users className="w-6 h-6 text-blue-600" />}     label="Kelola Pengguna"  to="/dashboard/users"    color="blue" />
            )}
            <QuickLink icon={<ClipboardCheck className="w-6 h-6 text-indigo-600" />} label="Data PPDB"   to="/dashboard/ppdb"    color="indigo" />
            <QuickLink icon={<Image className="w-6 h-6 text-purple-600" />}     label="Hero Slide"       to="/dashboard/hero-slides" color="purple" />
            <QuickLink icon={<Building className="w-6 h-6 text-green-600" />}   label="Profil Sekolah"   to="/dashboard/school-profile" color="green" />
            <QuickLink icon={<FileText className="w-6 h-6 text-amber-600" />}   label="Artikel"          to="/dashboard/articles" color="amber" />
            <QuickLink icon={<BookOpen className="w-6 h-6 text-blue-600" />}    label="Program Sekolah"  to="/dashboard/school-programs" color="blue" />
          </div>
        </SectionCard>

        <SectionCard title="Informasi Sistem">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Role aktif</span>
              <span className="text-sm font-semibold text-gray-800 capitalize">{role}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Lingkungan</span>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Development</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">API</span>
              <span className="text-sm font-mono text-gray-500 text-xs truncate max-w-48">
                {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}
              </span>
            </div>
          </div>
        </SectionCard>
      </div>
    </>
  );
}

// ── Dashboard Kandidat ────────────────────────────────────────────────────────

const STATUS_INFO: Record<string, { icon: React.ReactNode; label: string; desc: string; color: string; bg: string }> = {
  draft: {
    icon: <AlertCircle className="w-6 h-6" />,
    label: 'Belum Disubmit',
    desc: 'Formulir pendaftaran Anda belum selesai diisi.',
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
  },
  submitted: {
    icon: <Clock className="w-6 h-6" />,
    label: 'Menunggu Verifikasi',
    desc: 'Pendaftaran Anda sedang dalam proses verifikasi oleh admin.',
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
  },
  verified: {
    icon: <CheckCircle className="w-6 h-6" />,
    label: 'Sedang Diproses',
    desc: 'Pendaftaran Anda telah diverifikasi dan sedang diproses.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 border-indigo-200',
  },
  accepted: {
    icon: <CheckCircle className="w-6 h-6" />,
    label: 'Diterima! 🎉',
    desc: 'Selamat! Anda telah diterima. Silakan hubungi sekolah untuk informasi selanjutnya.',
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
  },
  rejected: {
    icon: <XCircle className="w-6 h-6" />,
    label: 'Tidak Diterima',
    desc: 'Maaf, pendaftaran Anda tidak dapat kami terima saat ini.',
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
  },
};

function DashboardCandidate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [registration, setRegistration] = useState<PpdbRegistration | null>(null);
  const [loadingReg, setLoadingReg] = useState(true);

  useEffect(() => {
    ppdbService.getMyRegistration()
      .then(res => { if (res.success) setRegistration(res.data.registration); })
      .catch(() => {})
      .finally(() => setLoadingReg(false));
  }, []);

  const status = registration?.registration_status ?? 'draft';
  const statusInfo = STATUS_INFO[status] ?? STATUS_INFO.draft;
  const currentStep = registration?.current_step ?? 1;
  const totalSteps = 8;
  const progressPct = Math.round(((currentStep - 1) / (totalSteps - 1)) * 100);

  return (
    <div className="max-w-2xl">
      {/* Salam */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-6 text-white">
        <p className="text-blue-100 text-sm mb-1">Selamat datang,</p>
        <h2 className="text-2xl font-bold">{user?.username ?? 'Calon Siswa'} 👋</h2>
        <p className="text-blue-100 text-sm mt-1">
          Lengkapi formulir pendaftaran Anda untuk melanjutkan proses PPDB.
        </p>
      </div>

      {/* Status box */}
      <div className={`border rounded-2xl p-5 mb-6 ${statusInfo.bg}`}>
        <div className="flex items-start gap-4">
          <div className={`mt-0.5 ${statusInfo.color}`}>{statusInfo.icon}</div>
          <div className="flex-1">
            <p className={`font-bold text-base ${statusInfo.color}`}>{statusInfo.label}</p>
            <p className="text-sm text-gray-600 mt-1">{statusInfo.desc}</p>
            {registration?.notes && (
              <div className="mt-3 bg-white rounded-xl p-3 border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 mb-1">Catatan Admin:</p>
                <p className="text-sm text-gray-800">{registration.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress pengisian */}
      {(status === 'draft') && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-gray-800 text-sm">Progress Pengisian Formulir</p>
            <span className="text-sm font-bold text-blue-600">{progressPct}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }} />
          </div>
          {loadingReg ? (
            <p className="text-xs text-gray-400">Memuat data...</p>
          ) : (
            <p className="text-xs text-gray-500">
              {registration
                ? `Sudah sampai step ${currentStep} dari ${totalSteps}`
                : 'Belum ada data. Mulai isi formulir sekarang.'}
            </p>
          )}
          <button
            onClick={() => navigate('/dashboard/ppdb-form')}
            className="mt-4 w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition shadow-md">
            {registration ? '✏️ Lanjutkan Pengisian' : '📝 Mulai Isi Formulir'}
          </button>
        </div>
      )}

      {/* Info detail pendaftar kalau sudah ada */}
      {registration?.full_name && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4 text-sm">Ringkasan Data Pendaftaran</h3>
          <div className="space-y-2.5">
            {[
              { label: 'Nama Lengkap', value: registration.full_name },
              { label: 'Jurusan', value: registration.major === 'TKJ' ? 'Teknik Komputer & Jaringan (TKJ)' : 'Teknik Otomotif' },
              { label: 'Sistem Pendidikan', value: registration.education_system },
              { label: 'Asal Sekolah', value: registration.school_origin },
              { label: 'No HP', value: registration.phone },
            ].map(row => (
              <div key={row.label} className="flex gap-3 text-sm">
                <span className="w-36 text-gray-500 shrink-0">{row.label}</span>
                <span className="text-gray-800 font-medium">{row.value || '-'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Dashboard Guru ────────────────────────────────────────────────────────────

function DashboardTeacher() {
  const { user } = useAuth();
  return (
    <>
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-6 mb-6 text-white">
        <p className="text-green-100 text-sm mb-1">Selamat datang,</p>
        <h2 className="text-2xl font-bold">
          {(user?.profile as any)?.full_name || user?.username || 'Guru'} 👨‍🏫
        </h2>
        <p className="text-green-100 text-sm mt-1">Semangat mengajar hari ini!</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<GraduationCap className="w-6 h-6" />} label="Data Siswa"    value="—" color="green" />
        <StatCard icon={<BookOpen className="w-6 h-6" />}      label="Mata Pelajaran" value="—" color="blue" />
        <StatCard icon={<FileText className="w-6 h-6" />}      label="Laporan"        value="—" color="amber" />
        <StatCard icon={<Users className="w-6 h-6" />}         label="Data Guru"      value="—" color="indigo" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <p className="text-gray-500 text-sm text-center py-4">
          Fitur akademik akan tersedia segera. 🚧
        </p>
      </div>
    </>
  );
}

// ── Dashboard Siswa ───────────────────────────────────────────────────────────

function DashboardStudent() {
  const { user } = useAuth();
  return (
    <>
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 mb-6 text-white">
        <p className="text-purple-100 text-sm mb-1">Halo,</p>
        <h2 className="text-2xl font-bold">
          {(user?.profile as any)?.full_name || user?.username || 'Siswa'} 🎓
        </h2>
        <p className="text-purple-100 text-sm mt-1">
          Kelas {(user?.profile as any)?.class_name || '—'} · {(user?.profile as any)?.major || '—'}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<BookOpen className="w-6 h-6" />}  label="Mata Pelajaran" value="—" color="purple" />
        <StatCard icon={<FileText className="w-6 h-6" />}  label="Nilai Saya"     value="—" color="green" />
        <StatCard icon={<Users className="w-6 h-6" />}     label="Jadwal Kelas"   value="—" color="blue" />
        <StatCard icon={<GraduationCap className="w-6 h-6" />} label="Absensi"    value="—" color="amber" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <p className="text-gray-500 text-sm text-center py-4">
          Fitur akademik siswa akan tersedia segera. 🚧
        </p>
      </div>
    </>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function DashboardHome() {
  const { user } = useAuth();
  const role = user?.role ?? '';

  if (role === 'candidate')             return <DashboardCandidate />;
  if (role === 'teacher')               return <DashboardTeacher />;
  if (role === 'student')               return <DashboardStudent />;
  if (role === 'admin' || role === 'superuser') return <DashboardAdmin role={role} />;

  return (
    <div className="text-center py-12 text-gray-400">
      <p className="text-4xl mb-3">🔒</p>
      <p className="font-semibold">Role tidak dikenali: <code>{role}</code></p>
    </div>
  );
}
