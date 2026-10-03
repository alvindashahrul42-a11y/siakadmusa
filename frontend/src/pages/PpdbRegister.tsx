import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, Plus, Eye, EyeOff } from 'lucide-react';
import ppdbService from '../services/ppdb.service';
import { useAuth } from '../contexts/AuthContext';
import type {
  Step1Data, Step2And3Data, Step4Data, Step5Data,
  Step6Data, Step7Achievement, Step8ParentData,
} from '../types/ppdb';
import logoSmk from '../assets/logo-smk.png';

// ── Pilihan ──────────────────────────────────────────────────────────────────

const AGAMA = ['islam', 'kristen', 'katolik', 'hindu', 'buddha', 'konghucu'];
const TRANSPORTASI = ['Jalan kaki', 'Sepeda', 'Motor', 'Angkutan umum', 'Antar jemput', 'Lainnya'];
const TINGGAL = ['Bersama orang tua', 'Kos/kontrak', 'Asrama', 'Panti asuhan', 'Pesantren', 'Lainnya'];
const BAHASA = ['Bahasa Indonesia', 'Bahasa Jawa', 'Bahasa Sunda', 'Bahasa Banyumasan', 'Lainnya'];
const PENDIDIKAN_OT = ['Tidak sekolah', 'SD/MI', 'SMP/MTs', 'SMA/SMK/MA', 'D1/D2/D3', 'S1', 'S2', 'S3'];
const PEKERJAAN = ['PNS', 'TNI/Polri', 'Pegawai swasta', 'Wiraswasta', 'Petani', 'Nelayan', 'Buruh', 'Pensiunan', 'Tidak bekerja', 'Lainnya'];

const STEPS = [
  { number: 1, label: 'Akun' },
  { number: 2, label: 'Pendaftar' },
  { number: 3, label: 'Pendidikan' },
  { number: 4, label: 'Data Diri' },
  { number: 5, label: 'Kesehatan' },
  { number: 6, label: 'Dokumen' },
  { number: 7, label: 'Prestasi' },
  { number: 8, label: 'Orang Tua' },
];

// ── CSS helpers ──────────────────────────────────────────────────────────────

const inputCls = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm';
const selectCls = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm bg-white';

// ── Sub-komponen ─────────────────────────────────────────────────────────────

function StepTitle({ number, title, desc }: { number: number; title: string; desc: string }) {
  return (
    <div className="mb-6 pb-4 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
          {number}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <p className="text-sm text-gray-500">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className="flex-1 h-px bg-blue-100" />
        {title}
        <span className="flex-1 h-px bg-blue-100" />
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Field({ label, required, children, className = '' }: {
  label: string; required?: boolean; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function StepNav({ onPrev, loading, isLast, onNext, nextLabel }: {
  onPrev: (() => void) | null;
  loading?: boolean;
  isLast?: boolean;
  onNext?: () => void;
  nextLabel?: string;
}) {
  return (
    <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
      {onPrev ? (
        <button type="button" onClick={onPrev} disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition font-semibold disabled:opacity-50">
          ← Sebelumnya
        </button>
      ) : <div />}
      <button type={onNext ? 'button' : 'submit'} onClick={onNext} disabled={loading}
        className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold disabled:opacity-60 shadow-md hover:shadow-lg">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {isLast ? 'Submit Pendaftaran' : (nextLabel || 'Lanjutkan →')}
      </button>
    </div>
  );
}

// ── Inisial state ────────────────────────────────────────────────────────────

const initialStep4: Step4Data = {
  nik: '', nisn: '', full_name: '', nickname: '', nationality: 'WNI',
  birth_place: '', birth_date: '', gender: '', religion: '', family_status: '',
  child_order: '', total_siblings: '', total_biological_siblings: '',
  total_step_siblings: '', total_adopted_siblings: '',
  school_origin: '', study_duration: '', diploma_number: '', diploma_date: '', npsn: '',
  has_kip: false, kip_number: '',
  living_status: '', daily_language: '', siblings_in_school: '0',
  transportation: '', distance_to_school: '', travel_time: '',
  photoFile: null,
  phone: '', contact_email: '', province: '', city: '', district: '',
  village: '', rt: '', rw: '', full_address: '',
};

const initialParent: Step8ParentData = {
  full_name: '', nik: '', education: '', occupation: '',
  marital_status: '', phone: '', birth_place: '', birth_date: '',
  nationality: 'WNI', religion: '', monthly_income: '',
};

// ── Komponen Utama ───────────────────────────────────────────────────────────

export default function PpdbRegister() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const [step1, setStep1] = useState<Step1Data>({ full_name: '', email: '', password: '', confirm_password: '' });
  const [generatedUsername, setGeneratedUsername] = useState<string | null>(null);
  const [step23, setStep23] = useState<Step2And3Data>({ registered_by: '', major: '', education_system: '' });
  const [step4, setStep4] = useState<Step4Data>(initialStep4);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [step5, setStep5] = useState<Step5Data>({ health_history: '', disability: '', height: '', weight: '' });
  const [step6, setStep6] = useState<Step6Data>({ kk_document: null, diploma_document: null });
  const [step6Names, setStep6Names] = useState({ kk: '', diploma: '' });
  const [achievements, setAchievements] = useState<Array<{ id?: string; achievement_name: string; documentFile?: File | null }>>([]);
  const [newAch, setNewAch] = useState<Step7Achievement>({ achievement_name: '', documentFile: null });
  const [ayah, setAyah] = useState<Step8ParentData>(initialParent);
  const [ibu, setIbu] = useState<Step8ParentData>(initialParent);
  const [submitted, setSubmitted] = useState(false);

  const setErr = (msgs: string[]) => { setErrors(msgs); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const clearErr = () => setErrors([]);

  const goNext = () => { clearErr(); setCurrentStep(s => s + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const goPrev = () => { clearErr(); setCurrentStep(s => s - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  // ── Handler tiap step ─────────────────────────────────

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step1.password !== step1.confirm_password) { setErr(['Konfirmasi kata sandi tidak cocok']); return; }
    if (step1.password.length < 8) { setErr(['Kata sandi minimal 8 karakter']); return; }
    setLoading(true);
    try {
      const res = await ppdbService.register(step1);
      if (!res.success) { setErr([res.message]); return; }
      if (res.data?.username) setGeneratedUsername(res.data.username);
      // Refresh AuthContext agar token baru dikenali, lalu redirect ke dashboard PPDB
      await refreshUser();
      navigate('/dashboard/ppdb-form');
    } catch (err: any) {
      setErr([err.response?.data?.message || 'Gagal membuat akun']);
    } finally { setLoading(false); }
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!step23.registered_by) { setErr(['Pilih siapa yang mendaftarkan']); return; }
    goNext();
  };

  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!step23.major || !step23.education_system) { setErr(['Semua field wajib diisi']); return; }
    setLoading(true);
    try {
      const res = await ppdbService.saveStep2And3(step23);
      if (!res.success) { setErr([res.message]); return; }
      goNext();
    } catch (err: any) {
      setErr([err.response?.data?.message || 'Gagal menyimpan data']);
    } finally { setLoading(false); }
  };

  const handleStep4 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!step4.photoFile) { setErr(['Pas foto wajib diupload']); return; }
    setLoading(true);
    try {
      const res = await ppdbService.saveStep4(step4);
      if (!res.success) { setErr([res.message]); return; }
      goNext();
    } catch (err: any) {
      const errs = err.response?.data?.errors;
      setErr(Array.isArray(errs) ? errs : [err.response?.data?.message || 'Gagal menyimpan data diri']);
    } finally { setLoading(false); }
  };

  const handleStep5 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await ppdbService.saveStep5(step5);
      if (!res.success) { setErr([res.message]); return; }
      goNext();
    } catch (err: any) {
      setErr([err.response?.data?.message || 'Gagal menyimpan data kesehatan']);
    } finally { setLoading(false); }
  };

  const handleStep6 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!step6.kk_document || !step6.diploma_document) {
      setErr(['Dokumen KK dan Ijazah/SKL wajib diupload']); return;
    }
    setLoading(true);
    try {
      const res = await ppdbService.saveStep6(step6);
      if (!res.success) { setErr([res.message]); return; }
      goNext();
    } catch (err: any) {
      setErr([err.response?.data?.message || 'Gagal mengupload dokumen']);
    } finally { setLoading(false); }
  };

  const handleAddAchievement = async () => {
    if (!newAch.achievement_name.trim()) { setErr(['Nama prestasi wajib diisi']); return; }
    setLoading(true);
    try {
      await ppdbService.addAchievement(newAch);
      setAchievements(prev => [...prev, { achievement_name: newAch.achievement_name }]);
      setNewAch({ achievement_name: '', documentFile: null });
      clearErr();
    } catch (err: any) {
      setErr([err.response?.data?.message || 'Gagal menambah prestasi']);
    } finally { setLoading(false); }
  };

  const handleStep8 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const [resAyah, resIbu] = await Promise.all([
        ppdbService.saveParent('ayah', ayah),
        ppdbService.saveParent('ibu', ibu),
      ]);
      const errs: string[] = [];
      if (!resAyah.success) errs.push(resAyah.message);
      if (!resIbu.success) errs.push(resIbu.message);
      if (errs.length) { setErr(errs); return; }

      const submitRes = await ppdbService.submit();
      if (!submitRes.success) {
        const missing = (submitRes as any).errors;
        setErr(Array.isArray(missing) ? missing : [submitRes.message]);
        return;
      }
      ppdbService.clearToken();
      setSubmitted(true);
    } catch (err: any) {
      const errs = err.response?.data?.errors;
      setErr(Array.isArray(errs) ? errs : [err.response?.data?.message || 'Gagal submit pendaftaran']);
    } finally { setLoading(false); }
  };

  // ── Sukses ────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Pendaftaran Berhasil!</h2>
          <p className="text-gray-500 mb-2">Formulir PPDB Anda telah berhasil disubmit.</p>
          <p className="text-gray-500 mb-8">Silakan tunggu informasi verifikasi dari sekolah melalui email yang Anda daftarkan.</p>
          <button onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  // ── Layout ────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <img src={logoSmk} alt="Logo" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="font-bold text-gray-800 text-base leading-tight">SMK Muhammadiyah Sempor</h1>
            <p className="text-xs text-gray-500">Formulir Pendaftaran Peserta Didik Baru (PPDB)</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Step Indicator */}
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex items-center min-w-max mx-auto">
            {STEPS.map((step, idx) => {
              const done = currentStep > step.number;
              const active = currentStep === step.number;
              return (
                <div key={step.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200
                      ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white ring-4 ring-blue-200' : 'bg-gray-200 text-gray-500'}`}>
                      {done ? <CheckCircle className="w-5 h-5" /> : step.number}
                    </div>
                    <span className={`text-xs mt-1 font-medium whitespace-nowrap
                      ${active ? 'text-blue-600' : done ? 'text-green-600' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`w-8 h-0.5 mb-4 mx-0.5 transition-colors duration-200 ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">

          {/* Error */}
          {errors.length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="font-semibold text-red-700 mb-1 text-sm">Terdapat kesalahan:</p>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((e, i) => <li key={i} className="text-red-600 text-sm">{e}</li>)}
              </ul>
            </div>
          )}

          {/* ════════════════════════════════════════════════
              STEP 1 — Akun
          ════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1}>
              <StepTitle number={1} title="Pendaftaran Akun" desc="Buat akun untuk melanjutkan proses pendaftaran" />
              <div className="space-y-4 max-w-lg">
                <Field label="Nama Lengkap" required>
                  <input type="text" value={step1.full_name}
                    onChange={e => setStep1(p => ({ ...p, full_name: e.target.value }))}
                    className={inputCls} placeholder="Nama sesuai kartu identitas" required />
                </Field>
                <Field label="Email" required>
                  <input type="email" value={step1.email}
                    onChange={e => setStep1(p => ({ ...p, email: e.target.value }))}
                    className={inputCls} placeholder="contoh@email.com" required />
                </Field>
                <Field label="Kata Sandi" required>
                  <div className="relative">
                    <input type={showPwd ? 'text' : 'password'} value={step1.password}
                      onChange={e => setStep1(p => ({ ...p, password: e.target.value }))}
                      className={inputCls + ' pr-10'} placeholder="Minimal 8 karakter" required minLength={8} />
                    <button type="button" onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </Field>
                <Field label="Konfirmasi Kata Sandi" required>
                  <div className="relative">
                    <input type={showConfirmPwd ? 'text' : 'password'} value={step1.confirm_password}
                      onChange={e => setStep1(p => ({ ...p, confirm_password: e.target.value }))}
                      className={inputCls + ' pr-10'} placeholder="Ulangi kata sandi" required />
                    <button type="button" onClick={() => setShowConfirmPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirmPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </Field>
              </div>
              <StepNav onPrev={null} loading={loading} />
              <p className="mt-4 text-center text-sm text-gray-500">
                Sudah punya akun?{' '}
                <button type="button" onClick={() => navigate('/login')} className="text-blue-600 hover:underline font-semibold">
                  Masuk di sini
                </button>
              </p>
            </form>
          )}

          {/* ════════════════════════════════════════════════
              STEP 2 — Didaftarkan Oleh
          ════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <form onSubmit={handleStep2}>
              <StepTitle number={2} title="Didaftarkan Oleh" desc="Siapa yang mendaftarkan calon siswa ini?" />
              {generatedUsername && (
                <div className="mb-5 flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">Akun berhasil dibuat!</p>
                    <p className="text-xs text-green-700 mt-0.5">
                      Username Anda: <span className="font-bold tracking-wide">{generatedUsername}</span>
                      <span className="ml-2 text-green-600">(simpan untuk login)</span>
                    </p>
                  </div>
                </div>
              )}
              <div className="max-w-sm">
                <Field label="Didaftarkan Oleh" required>
                  <select value={step23.registered_by}
                    onChange={e => setStep23(p => ({ ...p, registered_by: e.target.value }))}
                    className={selectCls} required>
                    <option value="">-- Pilih --</option>
                    <option value="diri_sendiri">Diri Sendiri</option>
                    <option value="ayah">Ayah</option>
                    <option value="ibu">Ibu</option>
                    <option value="saudara">Saudara</option>
                    <option value="guru">Guru</option>
                  </select>
                </Field>
              </div>
              <StepNav onPrev={goPrev} loading={loading} />
            </form>
          )}

          {/* ════════════════════════════════════════════════
              STEP 3 — Pendidikan
          ════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <form onSubmit={handleStep3}>
              <StepTitle number={3} title="Pilihan Pendidikan" desc="Pilih jurusan dan sistem pendidikan yang diinginkan" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
                <Field label="Jurusan" required>
                  <select value={step23.major}
                    onChange={e => setStep23(p => ({ ...p, major: e.target.value }))}
                    className={selectCls} required>
                    <option value="">-- Pilih Jurusan --</option>
                    <option value="TKJ">Teknik Komputer & Jaringan (TKJ)</option>
                    <option value="teknik_otomotif">Teknik Otomotif</option>
                  </select>
                </Field>
                <Field label="Sistem Pendidikan" required>
                  <select value={step23.education_system}
                    onChange={e => setStep23(p => ({ ...p, education_system: e.target.value }))}
                    className={selectCls} required>
                    <option value="">-- Pilih Sistem --</option>
                    <option value="reguler">Reguler</option>
                    <option value="pondok">Pondok (Pesantren)</option>
                    <option value="panti">Panti Asuhan</option>
                  </select>
                </Field>
              </div>
              <StepNav onPrev={goPrev} loading={loading} />
            </form>
          )}

          {/* ════════════════════════════════════════════════
              STEP 4 — Data Diri
          ════════════════════════════════════════════════ */}
          {currentStep === 4 && (
            <form onSubmit={handleStep4}>
              <StepTitle number={4} title="Data Diri Calon Siswa" desc="Isi data diri lengkap sesuai dokumen resmi" />

              {/* Identitas */}
              <Section title="Identitas">
                <Field label="NIK / KIA (16 digit)" required>
                  <input type="text" value={step4.nik}
                    onChange={e => setStep4(p => ({ ...p, nik: e.target.value }))}
                    className={inputCls} placeholder="16 digit angka" maxLength={16} required />
                </Field>
                <Field label="NISN (10 digit)" required>
                  <input type="text" value={step4.nisn}
                    onChange={e => setStep4(p => ({ ...p, nisn: e.target.value }))}
                    className={inputCls} placeholder="10 digit angka" maxLength={10} required />
                </Field>
                <Field label="Nama Lengkap (sesuai ijazah)" required className="md:col-span-2">
                  <input type="text" value={step4.full_name}
                    onChange={e => setStep4(p => ({ ...p, full_name: e.target.value }))}
                    className={inputCls} required />
                </Field>
                <Field label="Nama Panggilan">
                  <input type="text" value={step4.nickname}
                    onChange={e => setStep4(p => ({ ...p, nickname: e.target.value }))}
                    className={inputCls} />
                </Field>
                <Field label="Kewarganegaraan" required>
                  <input type="text" value={step4.nationality}
                    onChange={e => setStep4(p => ({ ...p, nationality: e.target.value }))}
                    className={inputCls} required />
                </Field>
                <Field label="Tempat Lahir" required>
                  <input type="text" value={step4.birth_place}
                    onChange={e => setStep4(p => ({ ...p, birth_place: e.target.value }))}
                    className={inputCls} required />
                </Field>
                <Field label="Tanggal Lahir" required>
                  <input type="date" value={step4.birth_date}
                    onChange={e => setStep4(p => ({ ...p, birth_date: e.target.value }))}
                    className={inputCls} required />
                </Field>
                <Field label="Jenis Kelamin" required>
                  <select value={step4.gender}
                    onChange={e => setStep4(p => ({ ...p, gender: e.target.value }))}
                    className={selectCls} required>
                    <option value="">-- Pilih --</option>
                    <option value="laki-laki">Laki-laki</option>
                    <option value="perempuan">Perempuan</option>
                  </select>
                </Field>
                <Field label="Agama" required>
                  <select value={step4.religion}
                    onChange={e => setStep4(p => ({ ...p, religion: e.target.value }))}
                    className={selectCls} required>
                    <option value="">-- Pilih --</option>
                    {AGAMA.map(a => <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
                  </select>
                </Field>
                <Field label="Status Keluarga" required>
                  <select value={step4.family_status}
                    onChange={e => setStep4(p => ({ ...p, family_status: e.target.value }))}
                    className={selectCls} required>
                    <option value="">-- Pilih --</option>
                    <option value="lengkap">Lengkap</option>
                    <option value="yatim">Yatim</option>
                    <option value="piatu">Piatu</option>
                    <option value="yatim_piatu">Yatim Piatu</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </Field>
              </Section>

              {/* Status Keluarga */}
              <Section title="Status Dalam Keluarga">
                <Field label="Anak Ke-" required>
                  <input type="number" value={step4.child_order}
                    onChange={e => setStep4(p => ({ ...p, child_order: e.target.value }))}
                    className={inputCls} min={1} required />
                </Field>
                <Field label="Dari Berapa Saudara" required>
                  <input type="number" value={step4.total_siblings}
                    onChange={e => setStep4(p => ({ ...p, total_siblings: e.target.value }))}
                    className={inputCls} min={0} required />
                </Field>
                <Field label="Total Saudara Kandung" required>
                  <input type="number" value={step4.total_biological_siblings}
                    onChange={e => setStep4(p => ({ ...p, total_biological_siblings: e.target.value }))}
                    className={inputCls} min={0} required />
                </Field>
                <Field label="Total Saudara Tiri">
                  <input type="number" value={step4.total_step_siblings}
                    onChange={e => setStep4(p => ({ ...p, total_step_siblings: e.target.value }))}
                    className={inputCls} min={0} />
                </Field>
                <Field label="Total Saudara Angkat">
                  <input type="number" value={step4.total_adopted_siblings}
                    onChange={e => setStep4(p => ({ ...p, total_adopted_siblings: e.target.value }))}
                    className={inputCls} min={0} />
                </Field>
              </Section>

              {/* Asal Sekolah */}
              <Section title="Asal Sekolah">
                <Field label="Nama Sekolah Asal" required className="md:col-span-2">
                  <input type="text" value={step4.school_origin}
                    onChange={e => setStep4(p => ({ ...p, school_origin: e.target.value }))}
                    className={inputCls} required />
                </Field>
                <Field label="Lama Belajar (tahun)" required>
                  <input type="number" value={step4.study_duration}
                    onChange={e => setStep4(p => ({ ...p, study_duration: e.target.value }))}
                    className={inputCls} min={1} max={10} required />
                </Field>
                <Field label="NPSN" required>
                  <input type="text" value={step4.npsn}
                    onChange={e => setStep4(p => ({ ...p, npsn: e.target.value }))}
                    className={inputCls} required />
                </Field>
                <Field label="Nomor Ijazah" required>
                  <input type="text" value={step4.diploma_number}
                    onChange={e => setStep4(p => ({ ...p, diploma_number: e.target.value }))}
                    className={inputCls} required />
                </Field>
                <Field label="Tanggal Ijazah" required>
                  <input type="date" value={step4.diploma_date}
                    onChange={e => setStep4(p => ({ ...p, diploma_date: e.target.value }))}
                    className={inputCls} required />
                </Field>
              </Section>

              {/* KIP */}
              <Section title="Kartu Indonesia Pintar (KIP)">
                <Field label="Penerima KIP?" className="md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <input type="checkbox" checked={step4.has_kip}
                      onChange={e => setStep4(p => ({ ...p, has_kip: e.target.checked, kip_number: '' }))}
                      className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm text-gray-700">Ya, saya penerima KIP</span>
                  </label>
                </Field>
                {step4.has_kip && (
                  <Field label="Nomor KIP" required>
                    <input type="text" value={step4.kip_number}
                      onChange={e => setStep4(p => ({ ...p, kip_number: e.target.value }))}
                      className={inputCls} required />
                  </Field>
                )}
              </Section>

              {/* Info Lainnya */}
              <Section title="Informasi Lainnya">
                <Field label="Status Tinggal" required>
                  <select value={step4.living_status}
                    onChange={e => setStep4(p => ({ ...p, living_status: e.target.value }))}
                    className={selectCls} required>
                    <option value="">-- Pilih --</option>
                    {TINGGAL.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Bahasa Sehari-hari di Rumah" required>
                  <select value={step4.daily_language}
                    onChange={e => setStep4(p => ({ ...p, daily_language: e.target.value }))}
                    className={selectCls} required>
                    <option value="">-- Pilih --</option>
                    {BAHASA.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </Field>
                <Field label="Saudara Kandung yang Sekolah di Sini">
                  <input type="number" value={step4.siblings_in_school}
                    onChange={e => setStep4(p => ({ ...p, siblings_in_school: e.target.value }))}
                    className={inputCls} min={0} />
                </Field>
                <Field label="Moda Transportasi" required>
                  <select value={step4.transportation}
                    onChange={e => setStep4(p => ({ ...p, transportation: e.target.value }))}
                    className={selectCls} required>
                    <option value="">-- Pilih --</option>
                    {TRANSPORTASI.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Jarak ke Sekolah (km)" required>
                  <input type="number" value={step4.distance_to_school}
                    onChange={e => setStep4(p => ({ ...p, distance_to_school: e.target.value }))}
                    className={inputCls} step="0.1" min={0} required />
                </Field>
                <Field label="Waktu Tempuh (jam)" required>
                  <input type="number" value={step4.travel_time}
                    onChange={e => setStep4(p => ({ ...p, travel_time: e.target.value }))}
                    className={inputCls} step="0.1" min={0} required />
                </Field>
                <Field label="Pas Foto 3×4 (JPG/PNG, maks 10MB)" required className="md:col-span-2">
                  {photoPreview && (
                    <img src={photoPreview} alt="Preview" className="w-24 h-32 object-cover rounded-lg border mb-2" />
                  )}
                  <input type="file" accept="image/jpeg,image/jpg,image/png"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setStep4(p => ({ ...p, photoFile: file }));
                        const reader = new FileReader();
                        reader.onloadend = () => setPhotoPreview(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    required />
                </Field>
              </Section>

              {/* Kontak & Alamat */}
              <Section title="Kontak & Alamat">
                <Field label="No HP (diawali 08)" required>
                  <input type="tel" value={step4.phone}
                    onChange={e => setStep4(p => ({ ...p, phone: e.target.value }))}
                    className={inputCls} placeholder="08xxxxxxxxxx" required />
                </Field>
                <Field label="Email Kontak">
                  <input type="email" value={step4.contact_email}
                    onChange={e => setStep4(p => ({ ...p, contact_email: e.target.value }))}
                    className={inputCls} placeholder="opsional" />
                </Field>
                <Field label="Provinsi" required>
                  <input type="text" value={step4.province}
                    onChange={e => setStep4(p => ({ ...p, province: e.target.value }))}
                    className={inputCls} required />
                </Field>
                <Field label="Kabupaten / Kota" required>
                  <input type="text" value={step4.city}
                    onChange={e => setStep4(p => ({ ...p, city: e.target.value }))}
                    className={inputCls} required />
                </Field>
                <Field label="Kecamatan" required>
                  <input type="text" value={step4.district}
                    onChange={e => setStep4(p => ({ ...p, district: e.target.value }))}
                    className={inputCls} required />
                </Field>
                <Field label="Desa / Kelurahan" required>
                  <input type="text" value={step4.village}
                    onChange={e => setStep4(p => ({ ...p, village: e.target.value }))}
                    className={inputCls} required />
                </Field>
                <Field label="RT" required>
                  <input type="text" value={step4.rt}
                    onChange={e => setStep4(p => ({ ...p, rt: e.target.value }))}
                    className={inputCls} maxLength={3} required />
                </Field>
                <Field label="RW" required>
                  <input type="text" value={step4.rw}
                    onChange={e => setStep4(p => ({ ...p, rw: e.target.value }))}
                    className={inputCls} maxLength={3} required />
                </Field>
                <Field label="Alamat Lengkap" required className="md:col-span-2">
                  <textarea value={step4.full_address}
                    onChange={e => setStep4(p => ({ ...p, full_address: e.target.value }))}
                    className={inputCls} rows={3} required />
                </Field>
              </Section>

              <StepNav onPrev={goPrev} loading={loading} />
            </form>
          )}

          {/* ════════════════════════════════════════════════
              STEP 5 — Kesehatan
          ════════════════════════════════════════════════ */}
          {currentStep === 5 && (
            <form onSubmit={handleStep5}>
              <StepTitle number={5} title="Data Kesehatan" desc="Semua field bersifat opsional" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
                <Field label="Tinggi Badan (cm)">
                  <input type="number" value={step5.height}
                    onChange={e => setStep5(p => ({ ...p, height: e.target.value }))}
                    className={inputCls} step="0.1" min={0} placeholder="Contoh: 165" />
                </Field>
                <Field label="Berat Badan (kg)">
                  <input type="number" value={step5.weight}
                    onChange={e => setStep5(p => ({ ...p, weight: e.target.value }))}
                    className={inputCls} step="0.1" min={0} placeholder="Contoh: 55" />
                </Field>
                <Field label="Riwayat Penyakit / Kesehatan" className="md:col-span-2">
                  <textarea value={step5.health_history}
                    onChange={e => setStep5(p => ({ ...p, health_history: e.target.value }))}
                    className={inputCls} rows={3} placeholder="Kosongkan jika tidak ada" />
                </Field>
                <Field label="Disabilitas" className="md:col-span-2">
                  <textarea value={step5.disability}
                    onChange={e => setStep5(p => ({ ...p, disability: e.target.value }))}
                    className={inputCls} rows={2} placeholder="Kosongkan jika tidak ada" />
                </Field>
              </div>
              <StepNav onPrev={goPrev} loading={loading} nextLabel="Lanjutkan →" />
            </form>
          )}

          {/* ════════════════════════════════════════════════
              STEP 6 — Dokumen
          ════════════════════════════════════════════════ */}
          {currentStep === 6 && (
            <form onSubmit={handleStep6}>
              <StepTitle number={6} title="Upload Dokumen" desc="Upload dokumen dalam format PDF, JPG, atau PNG (maks 10MB)" />
              <div className="space-y-6 max-w-xl">
                <Field label="Kartu Keluarga (KK)" required>
                  <div className={`border-2 border-dashed rounded-xl p-4 transition-colors ${step6.kk_document ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
                    {step6Names.kk && (
                      <p className="text-sm text-green-700 font-medium mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> {step6Names.kk}
                      </p>
                    )}
                    <input type="file" accept=".pdf,image/jpeg,image/jpg,image/png"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setStep6(p => ({ ...p, kk_document: file }));
                          setStep6Names(p => ({ ...p, kk: file.name }));
                        }
                      }}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      required />
                    <p className="text-xs text-gray-400 mt-2">Format: PDF, JPG, PNG — Maks 10MB</p>
                  </div>
                </Field>
                <Field label="Ijazah / Surat Keterangan Lulus (SKL)" required>
                  <div className={`border-2 border-dashed rounded-xl p-4 transition-colors ${step6.diploma_document ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
                    {step6Names.diploma && (
                      <p className="text-sm text-green-700 font-medium mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> {step6Names.diploma}
                      </p>
                    )}
                    <input type="file" accept=".pdf,image/jpeg,image/jpg,image/png"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setStep6(p => ({ ...p, diploma_document: file }));
                          setStep6Names(p => ({ ...p, diploma: file.name }));
                        }
                      }}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      required />
                    <p className="text-xs text-gray-400 mt-2">Format: PDF, JPG, PNG — Maks 10MB</p>
                  </div>
                </Field>
              </div>
              <StepNav onPrev={goPrev} loading={loading} />
            </form>
          )}

          {/* ════════════════════════════════════════════════
              STEP 7 — Prestasi
          ════════════════════════════════════════════════ */}
          {currentStep === 7 && (
            <div>
              <StepTitle number={7} title="Prestasi" desc="Tambahkan prestasi yang pernah diraih (opsional, bisa lebih dari satu)" />

              {/* Daftar prestasi */}
              {achievements.length > 0 && (
                <div className="mb-6 space-y-2">
                  {achievements.map((ach, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="text-sm font-medium text-gray-800">{ach.achievement_name}</span>
                        {ach.documentFile && <span className="text-xs text-gray-500">— {ach.documentFile.name}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Form tambah prestasi */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Tambah Prestasi Baru</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Nama Prestasi">
                    <input type="text" value={newAch.achievement_name}
                      onChange={e => setNewAch(p => ({ ...p, achievement_name: e.target.value }))}
                      className={inputCls} placeholder="Contoh: Juara 1 Olimpiade Matematika" />
                  </Field>
                  <Field label="Bukti Dokumen (opsional)">
                    <input type="file" accept=".pdf,image/jpeg,image/jpg,image/png"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) setNewAch(p => ({ ...p, documentFile: file }));
                      }}
                      className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  </Field>
                </div>
                <button type="button" onClick={handleAddAchievement} disabled={loading}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60">
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Tambah Prestasi
                </button>
              </div>

              <StepNav onPrev={goPrev} loading={loading} onNext={goNext} nextLabel="Lanjutkan →" />
            </div>
          )}

          {/* ════════════════════════════════════════════════
              STEP 8 — Data Orang Tua
          ════════════════════════════════════════════════ */}
          {currentStep === 8 && (
            <form onSubmit={handleStep8}>
              <StepTitle number={8} title="Data Orang Tua" desc="Isi data ayah dan ibu lengkap" />

              {(['ayah', 'ibu'] as const).map(type => {
                const data = type === 'ayah' ? ayah : ibu;
                const setData = type === 'ayah' ? setAyah : setIbu;
                const label = type === 'ayah' ? 'Ayah' : 'Ibu';

                return (
                  <div key={type} className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${type === 'ayah' ? 'bg-blue-500' : 'bg-pink-500'}`}>
                        {type === 'ayah' ? '♂' : '♀'}
                      </div>
                      <h3 className="text-base font-bold text-gray-800">Data {label}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label={`Nama ${label}`} required className="md:col-span-2">
                        <input type="text" value={data.full_name}
                          onChange={e => setData(p => ({ ...p, full_name: e.target.value }))}
                          className={inputCls} required />
                      </Field>
                      <Field label="NIK (16 digit)" required>
                        <input type="text" value={data.nik}
                          onChange={e => setData(p => ({ ...p, nik: e.target.value }))}
                          className={inputCls} maxLength={16} required />
                      </Field>
                      <Field label="Pendidikan Terakhir" required>
                        <select value={data.education}
                          onChange={e => setData(p => ({ ...p, education: e.target.value }))}
                          className={selectCls} required>
                          <option value="">-- Pilih --</option>
                          {PENDIDIKAN_OT.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </Field>
                      <Field label="Pekerjaan" required>
                        <select value={data.occupation}
                          onChange={e => setData(p => ({ ...p, occupation: e.target.value }))}
                          className={selectCls} required>
                          <option value="">-- Pilih --</option>
                          {PEKERJAAN.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </Field>
                      <Field label="Status Pernikahan" required>
                        <select value={data.marital_status}
                          onChange={e => setData(p => ({ ...p, marital_status: e.target.value }))}
                          className={selectCls} required>
                          <option value="">-- Pilih --</option>
                          <option value="menikah">Menikah</option>
                          <option value="cerai_hidup">Cerai Hidup</option>
                          <option value="cerai_mati">Cerai Mati</option>
                          <option value="lainnya">Lainnya</option>
                        </select>
                      </Field>
                      <Field label="No HP (diawali 08)" required>
                        <input type="tel" value={data.phone}
                          onChange={e => setData(p => ({ ...p, phone: e.target.value }))}
                          className={inputCls} placeholder="08xxxxxxxxxx" required />
                      </Field>
                      <Field label="Tempat Lahir" required>
                        <input type="text" value={data.birth_place}
                          onChange={e => setData(p => ({ ...p, birth_place: e.target.value }))}
                          className={inputCls} required />
                      </Field>
                      <Field label="Tanggal Lahir" required>
                        <input type="date" value={data.birth_date}
                          onChange={e => setData(p => ({ ...p, birth_date: e.target.value }))}
                          className={inputCls} required />
                      </Field>
                      <Field label="Kewarganegaraan" required>
                        <input type="text" value={data.nationality}
                          onChange={e => setData(p => ({ ...p, nationality: e.target.value }))}
                          className={inputCls} required />
                      </Field>
                      <Field label="Agama" required>
                        <select value={data.religion}
                          onChange={e => setData(p => ({ ...p, religion: e.target.value }))}
                          className={selectCls} required>
                          <option value="">-- Pilih --</option>
                          {AGAMA.map(a => <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
                        </select>
                      </Field>
                      <Field label="Penghasilan per Bulan (Rp)" className="md:col-span-2">
                        <input type="number" value={data.monthly_income}
                          onChange={e => setData(p => ({ ...p, monthly_income: e.target.value }))}
                          className={inputCls} placeholder="Contoh: 3000000" min={0} />
                      </Field>
                    </div>
                    {type === 'ayah' && <hr className="my-6 border-gray-200" />}
                  </div>
                );
              })}

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-amber-800 font-medium">
                  ⚠️ Pastikan semua data sudah benar sebelum submit. Pendaftaran yang sudah disubmit tidak bisa diubah.
                </p>
              </div>

              <StepNav onPrev={goPrev} loading={loading} isLast />
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
