import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoSmk from '../assets/logo-smk.png';

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'student' | 'teacher';

interface FormData {
  // step 1
  role: Role | '';
  // step 2
  full_name: string;
  email: string;
  username: string;
  password: string;
  confirm_password: string;
  // step 3
  gender: string;
  birth_place: string;
  birth_date: string;
  phone: string;
  address: string;
}

// ─── Step config ─────────────────────────────────────────────────────────────

const STEPS = [
  { number: 1, label: 'Jalur Pendaftaran', desc: 'Pilih peran Anda' },
  { number: 2, label: 'Data Akun',         desc: 'Email & password' },
  { number: 3, label: 'Data Diri',         desc: 'Informasi pribadi' },
  { number: 4, label: 'Konfirmasi',        desc: 'Periksa & kirim' },
];

const INITIAL_FORM: FormData = {
  role: '',
  full_name: '',
  email: '',
  username: '',
  password: '',
  confirm_password: '',
  gender: '',
  birth_place: '',
  birth_date: '',
  phone: '',
  address: '',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      {children}
    </label>
  );
}

function Input({
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
}: {
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none bg-gray-50 focus:bg-white focus:border-[#2E2D8F] transition-all duration-200 text-sm"
    />
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none bg-gray-50 focus:bg-white focus:border-[#2E2D8F] transition-all duration-200 text-sm"
    >
      {children}
    </select>
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none bg-gray-50 focus:bg-white focus:border-[#2E2D8F] transition-all duration-200 text-sm resize-none"
    />
  );
}

// ─── Step panels ─────────────────────────────────────────────────────────────

function Step1({
  form,
  setForm,
}: {
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
}) {
  const roles: { value: Role; label: string; desc: string; icon: string }[] = [
    {
      value: 'student',
      label: 'Siswa Baru',
      desc: 'Daftar sebagai calon peserta didik baru',
      icon: '🎓',
    },
    {
      value: 'teacher',
      label: 'Tenaga Pendidik',
      desc: 'Daftar sebagai guru atau staf pengajar',
      icon: '👩‍🏫',
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-gray-500 text-sm mb-6">
        Pilih jalur pendaftaran yang sesuai dengan peran Anda di sekolah.
      </p>
      {roles.map(r => (
        <button
          key={r.value}
          type="button"
          onClick={() => setForm(f => ({ ...f, role: r.value }))}
          className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200"
          style={
            form.role === r.value
              ? { borderColor: '#2E2D8F', background: '#f0f0ff' }
              : { borderColor: '#e5e7eb', background: 'white' }
          }
        >
          <span className="text-4xl">{r.icon}</span>
          <div className="flex-1">
            <p
              className="font-bold text-base"
              style={{ color: form.role === r.value ? '#2E2D8F' : '#111827' }}
            >
              {r.label}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">{r.desc}</p>
          </div>
          {/* Radio indicator */}
          <div
            className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
            style={{ borderColor: form.role === r.value ? '#2E2D8F' : '#d1d5db' }}
          >
            {form.role === r.value && (
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#2E2D8F' }} />
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

function Step2({
  form,
  setForm,
  showPass,
  setShowPass,
  showConfirm,
  setShowConfirm,
}: {
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  showPass: boolean;
  setShowPass: (v: boolean) => void;
  showConfirm: boolean;
  setShowConfirm: (v: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Nama Lengkap <span className="text-red-500">*</span></Label>
        <Input
          value={form.full_name}
          onChange={v => setForm(f => ({ ...f, full_name: v }))}
          placeholder="Masukkan nama lengkap"
          required
        />
      </div>
      <div>
        <Label>Email <span className="text-red-500">*</span></Label>
        <Input
          type="email"
          value={form.email}
          onChange={v => setForm(f => ({ ...f, email: v }))}
          placeholder="nama@example.com"
          required
        />
      </div>
      <div>
        <Label>Username <span className="text-red-500">*</span></Label>
        <Input
          value={form.username}
          onChange={v => setForm(f => ({ ...f, username: v }))}
          placeholder="Nama pengguna unik"
          required
        />
      </div>
      <div>
        <Label>Password <span className="text-red-500">*</span></Label>
        <div className="relative">
          <Input
            type={showPass ? 'text' : 'password'}
            value={form.password}
            onChange={v => setForm(f => ({ ...f, password: v }))}
            placeholder="Min. 8 karakter"
            required
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPass ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <div>
        <Label>Konfirmasi Password <span className="text-red-500">*</span></Label>
        <div className="relative">
          <Input
            type={showConfirm ? 'text' : 'password'}
            value={form.confirm_password}
            onChange={v => setForm(f => ({ ...f, confirm_password: v }))}
            placeholder="Ulangi password"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirm ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Step3({
  form,
  setForm,
}: {
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Jenis Kelamin</Label>
          <Select value={form.gender} onChange={v => setForm(f => ({ ...f, gender: v }))}>
            <option value="">-- Pilih --</option>
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </Select>
        </div>
        <div>
          <Label>Tempat Lahir</Label>
          <Input
            value={form.birth_place}
            onChange={v => setForm(f => ({ ...f, birth_place: v }))}
            placeholder="Kota lahir"
          />
        </div>
      </div>
      <div>
        <Label>Tanggal Lahir</Label>
        <Input
          type="date"
          value={form.birth_date}
          onChange={v => setForm(f => ({ ...f, birth_date: v }))}
        />
      </div>
      <div>
        <Label>No. Telepon / WhatsApp</Label>
        <Input
          type="tel"
          value={form.phone}
          onChange={v => setForm(f => ({ ...f, phone: v }))}
          placeholder="08xxxxxxxxxx"
        />
      </div>
      <div>
        <Label>Alamat Lengkap</Label>
        <Textarea
          value={form.address}
          onChange={v => setForm(f => ({ ...f, address: v }))}
          placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota"
        />
      </div>
    </div>
  );
}

function Step4({ form }: { form: FormData }) {
  const roleLabel = form.role === 'student' ? 'Siswa Baru' : 'Tenaga Pendidik';

  const rows: { label: string; value: string }[] = [
    { label: 'Jalur',          value: roleLabel },
    { label: 'Nama Lengkap',   value: form.full_name },
    { label: 'Email',          value: form.email },
    { label: 'Username',       value: form.username },
    { label: 'Jenis Kelamin',  value: form.gender || '-' },
    { label: 'Tempat Lahir',   value: form.birth_place || '-' },
    { label: 'Tanggal Lahir',  value: form.birth_date || '-' },
    { label: 'No. Telepon',    value: form.phone || '-' },
    { label: 'Alamat',         value: form.address || '-' },
  ];

  return (
    <div className="space-y-3">
      <p className="text-gray-500 text-sm mb-4">
        Periksa kembali data Anda sebelum mengirim pendaftaran.
      </p>
      <div className="rounded-2xl border border-gray-200 overflow-hidden">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex gap-3 px-4 py-3 text-sm ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
          >
            <span className="w-36 font-semibold text-gray-500 flex-shrink-0">{row.label}</span>
            <span className="text-gray-800 break-all">{row.value}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 pt-2">
        Dengan mendaftar, Anda menyetujui bahwa data yang diberikan adalah benar dan dapat dipertanggungjawabkan.
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // password visibility
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Validation per step ──────────────────────────────────────────────────

  function validate(): string {
    if (step === 1) {
      if (!form.role) return 'Silakan pilih jalur pendaftaran.';
    }
    if (step === 2) {
      if (!form.full_name.trim()) return 'Nama lengkap wajib diisi.';
      if (!form.email.trim()) return 'Email wajib diisi.';
      if (!form.username.trim()) return 'Username wajib diisi.';
      if (form.password.length < 8) return 'Password minimal 8 karakter.';
      if (form.password !== form.confirm_password) return 'Konfirmasi password tidak cocok.';
    }
    return '';
  }

  // ── Navigation ───────────────────────────────────────────────────────────

  function handleNext() {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setStep(s => s + 1);
  }

  function handleBack() {
    setError('');
    setStep(s => s - 1);
  }

  // ── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // TODO: ganti dengan API call yang sesungguhnya
      await new Promise(res => setTimeout(res, 1500));
      setSubmitted(true);
    } catch {
      setError('Pendaftaran gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  // ─── Success screen ──────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #1E1D6F 0%, #2E2D8F 60%, #3D3CAA 100%)' }}>
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: '#f0fdf4' }}>
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pendaftaran Terkirim!</h2>
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">
            Data pendaftaran Anda telah berhasil dikirim. Tim kami akan memproses dan menghubungi Anda melalui email <strong>{form.email}</strong>.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 rounded-xl font-bold text-white transition-all duration-300 hover:opacity-90"
            style={{ background: 'linear-gradient(to right, #2E2D8F, #1E1D6F)' }}
          >
            Masuk ke Akun
          </button>
          <button
            onClick={() => navigate('/')}
            className="mt-3 w-full py-3 rounded-xl font-semibold text-gray-600 border-2 border-gray-200 hover:border-gray-300 transition-all duration-200"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  // ─── Main layout ─────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'linear-gradient(135deg, #1E1D6F 0%, #2E2D8F 60%, #3D3CAA 100%)' }}
    >
      {/* ── LEFT: Step Progress ─────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col w-80 xl:w-96 flex-shrink-0 p-10 relative">
        {/* Subtle dot pattern */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#F5C518 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Logo */}
        <div className="relative z-10 mb-12">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 group">
            <img
              src={logoSmk}
              alt="Logo SMK Muhammadiyah Sempor"
              className="w-12 h-12 object-contain rounded-xl shadow-lg"
            />
            <div>
              <p className="text-white font-bold text-sm leading-tight">SMK Muhammadiyah</p>
              <p className="text-white/70 text-xs">Sempor</p>
            </div>
          </button>
        </div>

        {/* Title */}
        <div className="relative z-10 mb-10">
          <h2 className="text-3xl font-bold text-white mb-2">Formulir Pendaftaran</h2>
          <p className="text-white/60 text-sm leading-relaxed">
            Lengkapi setiap langkah untuk menyelesaikan pendaftaran Anda.
          </p>
        </div>

        {/* Steps */}
        <div className="relative z-10 flex flex-col gap-0">
          {STEPS.map((s, i) => {
            const isCompleted = step > s.number;
            const isActive    = step === s.number;
            const isUpcoming  = step < s.number;

            return (
              <div key={s.number} className="flex gap-4">
                {/* Connector column */}
                <div className="flex flex-col items-center">
                  {/* Circle */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm transition-all duration-300"
                    style={
                      isCompleted
                        ? { background: '#F5C518', color: '#1E1D6F' }
                        : isActive
                        ? { background: 'white', color: '#2E2D8F' }
                        : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }
                    }
                  >
                    {isCompleted ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      s.number
                    )}
                  </div>
                  {/* Vertical line (not after last) */}
                  {i < STEPS.length - 1 && (
                    <div
                      className="w-0.5 h-10 mt-1 transition-all duration-300"
                      style={{ background: isCompleted ? '#F5C518' : 'rgba(255,255,255,0.15)' }}
                    />
                  )}
                </div>

                {/* Text */}
                <div className="pb-10">
                  <p
                    className="font-semibold text-sm transition-all duration-300"
                    style={
                      isActive
                        ? { color: 'white' }
                        : isCompleted
                        ? { color: '#F5C518' }
                        : { color: 'rgba(255,255,255,0.4)' }
                    }
                  >
                    {s.label}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: isUpcoming ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.55)' }}
                  >
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom link */}
        <div className="relative z-10 mt-auto">
          <p className="text-white/50 text-xs">
            Sudah punya akun?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-[#F5C518] font-semibold hover:underline"
            >
              Masuk di sini
            </button>
          </p>
        </div>
      </div>

      {/* ── RIGHT: Form ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-lg">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <button onClick={() => navigate('/')} className="flex items-center gap-3">
              <img src={logoSmk} alt="Logo" className="w-10 h-10 object-contain rounded-lg shadow" />
              <span className="text-white font-bold text-sm">SMK Muhammadiyah Sempor</span>
            </button>
          </div>

          <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
            {/* Card header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: '#f0f0ff', color: '#2E2D8F' }}
                >
                  Langkah {step} dari {STEPS.length}
                </span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">{STEPS[step - 1].label}</h1>
              <p className="text-sm text-gray-400 mt-0.5">{STEPS[step - 1].desc}</p>

              {/* Progress bar */}
              <div className="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${((step - 1) / (STEPS.length - 1)) * 100}%`,
                    background: 'linear-gradient(to right, #2E2D8F, #F5C518)',
                  }}
                />
              </div>
            </div>

            {/* Mobile step pills */}
            <div className="lg:hidden flex gap-1.5 mb-6">
              {STEPS.map(s => (
                <div
                  key={s.number}
                  className="h-1 flex-1 rounded-full transition-all duration-300"
                  style={{
                    background:
                      step > s.number
                        ? '#F5C518'
                        : step === s.number
                        ? '#2E2D8F'
                        : '#e5e7eb',
                  }}
                />
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Step content */}
            <form onSubmit={step === STEPS.length ? handleSubmit : e => { e.preventDefault(); handleNext(); }}>
              {step === 1 && <Step1 form={form} setForm={setForm} />}
              {step === 2 && (
                <Step2
                  form={form}
                  setForm={setForm}
                  showPass={showPass}
                  setShowPass={setShowPass}
                  showConfirm={showConfirm}
                  setShowConfirm={setShowConfirm}
                />
              )}
              {step === 3 && <Step3 form={form} setForm={setForm} />}
              {step === 4 && <Step4 form={form} />}

              {/* Navigation buttons */}
              <div className="flex gap-3 mt-8">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 py-3 rounded-xl font-semibold border-2 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                  >
                    Kembali
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl font-bold text-white transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(to right, #2E2D8F, #1E1D6F)' }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Mengirim...
                    </span>
                  ) : step === STEPS.length ? (
                    'Kirim Pendaftaran'
                  ) : (
                    'Lanjut'
                  )}
                </button>
              </div>
            </form>

            {/* Bottom link (mobile) */}
            <p className="lg:hidden text-center text-sm text-gray-500 mt-6">
              Sudah punya akun?{' '}
              <button
                onClick={() => navigate('/login')}
                className="font-semibold hover:underline"
                style={{ color: '#2E2D8F' }}
              >
                Masuk di sini
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
