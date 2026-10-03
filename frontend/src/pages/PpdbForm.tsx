import { useState, useEffect } from 'react';
import {
  CheckCircle, Loader2, Plus, AlertCircle,
  User, BookOpen, Heart, FileText, Trophy, Users,
  ChevronRight, ChevronLeft, Upload, X,
} from 'lucide-react';
import ppdbService from '../services/ppdb.service';
import type {
  Step2And3Data, Step4Data, Step5Data,
  Step6Data, Step7Achievement, Step8ParentData,
  PpdbRegistration,
} from '../types/ppdb';

// ── Konstanta ─────────────────────────────────────────────────────────────────

const AGAMA        = ['islam','kristen','katolik','hindu','buddha','konghucu'];
const TRANSPORTASI = ['Jalan kaki','Sepeda','Motor','Angkutan umum','Antar jemput','Lainnya'];
const TINGGAL      = ['Bersama orang tua','Kos/kontrak','Asrama','Panti asuhan','Pesantren','Lainnya'];
const BAHASA       = ['Bahasa Indonesia','Bahasa Jawa','Bahasa Sunda','Bahasa Banyumasan','Lainnya'];
const PENDIDIKAN   = ['Tidak sekolah','SD/MI','SMP/MTs','SMA/SMK/MA','D1/D2/D3','S1','S2','S3'];
const PEKERJAAN    = ['PNS','TNI/Polri','Pegawai swasta','Wiraswasta','Petani','Nelayan','Buruh','Pensiunan','Tidak bekerja','Lainnya'];

// Step utama (angka yang dikirim ke backend)
const MAIN_STEPS = [
  { number: 2, label: 'Pendaftar',  icon: <User     className="w-4 h-4" /> },
  { number: 3, label: 'Pendidikan', icon: <BookOpen className="w-4 h-4" /> },
  { number: 4, label: 'Data Diri',  icon: <User     className="w-4 h-4" /> },
  { number: 5, label: 'Kesehatan',  icon: <Heart    className="w-4 h-4" /> },
  { number: 6, label: 'Dokumen',    icon: <FileText className="w-4 h-4" /> },
  { number: 7, label: 'Prestasi',   icon: <Trophy   className="w-4 h-4" /> },
  { number: 8, label: 'Orang Tua',  icon: <Users    className="w-4 h-4" /> },
];

// Sub-step untuk step 4
const SUB4 = [
  { id: '4a', label: 'Identitas' },
  { id: '4b', label: 'Keluarga' },
  { id: '4c', label: 'Asal Sekolah' },
  { id: '4d', label: 'Info & Foto' },
  { id: '4e', label: 'Alamat' },
];

// ── CSS helpers ───────────────────────────────────────────────────────────────

const inp = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white placeholder:text-gray-300';
const sel = inp + ' cursor-pointer';

// ── Atom bricks ───────────────────────────────────────────────────────────────

function Lbl({ text, req }: { text: string; req?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
      {text}{req && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function F({ label, req, children, span2 }: {
  label: string; req?: boolean; children: React.ReactNode; span2?: boolean;
}) {
  return (
    <div className={span2 ? 'md:col-span-3' : ''}>
      <Lbl text={label} req={req} />
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{children}</div>;
}

function Nav({ onPrev, loading, isLast, onNext, skipLabel }: {
  onPrev?: () => void; loading?: boolean; isLast?: boolean;
  onNext?: () => void; skipLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-100">
      <div>
        {onPrev && (
          <button type="button" onClick={onPrev} disabled={loading}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-40">
            <ChevronLeft className="w-4 h-4" /> Sebelumnya
          </button>
        )}
      </div>
      <button type={onNext ? 'button' : 'submit'} onClick={onNext} disabled={loading}
        className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition shadow-sm disabled:opacity-50">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {isLast ? 'Submit Pendaftaran 🎉' : (skipLabel ?? <><span>Simpan & Lanjut</span><ChevronRight className="w-4 h-4" /></>)}
      </button>
    </div>
  );
}

// ── Initial state ─────────────────────────────────────────────────────────────

const INIT4: Step4Data = {
  nik:'',nisn:'',full_name:'',nickname:'',nationality:'WNI',
  birth_place:'',birth_date:'',gender:'',religion:'',family_status:'',
  child_order:'',total_siblings:'',total_biological_siblings:'',
  total_step_siblings:'',total_adopted_siblings:'',
  school_origin:'',study_duration:'',diploma_number:'',diploma_date:'',npsn:'',
  has_kip:false,kip_number:'',
  living_status:'',daily_language:'',siblings_in_school:'0',
  transportation:'',distance_to_school:'',travel_time:'',photoFile:null,
  phone:'',contact_email:'',province:'',city:'',district:'',
  village:'',rt:'',rw:'',full_address:'',
};

const INIT_PARENT: Step8ParentData = {
  full_name:'',nik:'',education:'',occupation:'',marital_status:'',
  phone:'',birth_place:'',birth_date:'',nationality:'WNI',religion:'',monthly_income:'',
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PpdbForm() {
  const [pageLoading, setPageLoading]   = useState(true);
  const [registration, setRegistration] = useState<PpdbRegistration | null>(null);
  const [step, setStep]                 = useState(2);       // step utama (2-8)
  const [sub4, setSub4]                 = useState('4a');    // sub-step step 4
  const [loading, setLoading]           = useState(false);
  const [errors, setErrors]             = useState<string[]>([]);
  const [submitted, setSubmitted]       = useState(false);

  const [s23, setS23]     = useState<Step2And3Data>({ registered_by:'', major:'', education_system:'' });
  const [s4, setS4]       = useState<Step4Data>(INIT4);
  const [photoPrev, setPhotoPrev] = useState<string | null>(null);
  const [s5, setS5]       = useState<Step5Data>({ health_history:'', disability:'', height:'', weight:'' });
  const [s6, setS6]       = useState<Step6Data>({ kk_document:null, diploma_document:null });
  const [s6Names, setS6Names] = useState({ kk:'', diploma:'' });
  const [achievements, setAchievements] = useState<{ achievement_name: string }[]>([]);
  const [newAch, setNewAch] = useState<Step7Achievement>({ achievement_name:'', documentFile:null });
  const [ayah, setAyah]   = useState<Step8ParentData>(INIT_PARENT);
  const [ibu, setIbu]     = useState<Step8ParentData>(INIT_PARENT);

  const setErr  = (msgs: string[]) => { setErrors(msgs); window.scrollTo({ top:0, behavior:'smooth' }); };
  const clearErr = () => setErrors([]);

  // ── Navigasi utama ────────────────────────────────────────────────────

  const goMainNext = () => { clearErr(); setStep(s => Math.min(s+1, 8)); window.scrollTo({ top:0, behavior:'smooth' }); };
  const goMainPrev = () => { clearErr(); setStep(s => Math.max(s-1, 2)); window.scrollTo({ top:0, behavior:'smooth' }); };

  // ── Navigasi sub-step 4 ───────────────────────────────────────────────

  const sub4List = SUB4.map(s => s.id);

  const goSub4Next = () => {
    clearErr();
    const idx = sub4List.indexOf(sub4);
    if (idx < sub4List.length - 1) {
      setSub4(sub4List[idx + 1]);
    }
    window.scrollTo({ top:0, behavior:'smooth' });
  };

  const goSub4Prev = () => {
    clearErr();
    const idx = sub4List.indexOf(sub4);
    if (idx > 0) {
      setSub4(sub4List[idx - 1]);
    } else {
      // Kembali ke step 3
      goMainPrev();
    }
    window.scrollTo({ top:0, behavior:'smooth' });
  };

  // ── Load / prefill ────────────────────────────────────────────────────

  useEffect(() => {
    ppdbService.getMyRegistration().then(res => {
      if (!res.success || !res.data.registration) return;
      const r = res.data.registration;
      setRegistration(r);
      setS23({ registered_by: r.registered_by||'', major: r.major||'', education_system: r.education_system||'' });
      if (r.full_name) {
        setS4({
          nik: r.nik||'', nisn: r.nisn||'', full_name: r.full_name||'', nickname: r.nickname||'',
          nationality: r.nationality||'WNI', birth_place: r.birth_place||'', birth_date: r.birth_date||'',
          gender: r.gender||'', religion: r.religion||'', family_status: r.family_status||'',
          child_order: String(r.child_order||''), total_siblings: String(r.total_siblings||''),
          total_biological_siblings: String(r.total_biological_siblings||''),
          total_step_siblings: String(r.total_step_siblings||''),
          total_adopted_siblings: String(r.total_adopted_siblings||''),
          school_origin: r.school_origin||'', study_duration: String(r.study_duration||''),
          diploma_number: r.diploma_number||'', diploma_date: r.diploma_date||'', npsn: r.npsn||'',
          has_kip: Boolean(r.has_kip), kip_number: r.kip_number||'',
          living_status: r.living_status||'', daily_language: r.daily_language||'',
          siblings_in_school: String(r.siblings_in_school||'0'), transportation: r.transportation||'',
          distance_to_school: String(r.distance_to_school||''), travel_time: String(r.travel_time||''),
          photoFile: null, phone: r.phone||'', contact_email: r.contact_email||'',
          province: r.province||'', city: r.city||'', district: r.district||'',
          village: r.village||'', rt: r.rt||'', rw: r.rw||'', full_address: r.full_address||'',
        });
        if (r.photo) setPhotoPrev(`${import.meta.env.VITE_API_BASE_URL?.replace('/api','')}/${r.photo}`);
      }
      if (r.health) setS5({ health_history: r.health.health_history||'', disability: r.health.disability||'', height: String(r.health.height||''), weight: String(r.health.weight||'') });
      if (r.documents) setS6Names({ kk: r.documents.kk_document ? '✓ Sudah diupload' : '', diploma: r.documents.diploma_document ? '✓ Sudah diupload' : '' });
      if (r.achievements) setAchievements(r.achievements.map(a => ({ achievement_name: a.achievement_name })));
      if (r.parents) {
        const a = r.parents.find(p => p.parent_type==='ayah');
        const b = r.parents.find(p => p.parent_type==='ibu');
        if (a) setAyah({ ...a, monthly_income: String(a.monthly_income||'') });
        if (b) setIbu({ ...b, monthly_income: String(b.monthly_income||'') });
      }
      const last = r.current_step || 2;
      setStep(Math.min(last, 8));
      if (r.registration_status !== 'draft') setSubmitted(true);
    }).catch(()=>{}).finally(()=>setPageLoading(false));
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────

  const onStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!s23.registered_by) { setErr(['Pilih siapa yang mendaftarkan']); return; }
    goMainNext();
  };

  const onStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!s23.major || !s23.education_system) { setErr(['Semua field wajib diisi']); return; }
    setLoading(true);
    try { const r = await ppdbService.saveStep2And3(s23); if (!r.success) { setErr([r.message]); return; } goMainNext(); setSub4('4a'); }
    catch (e: any) { setErr([e.response?.data?.message||'Gagal menyimpan']); }
    finally { setLoading(false); }
  };

  // Sub-step 4 — validasi per sub & kirim ke API hanya saat 4e selesai
  const onSub4Next = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi per sub
    if (sub4 === '4a') {
      if (!s4.nik || s4.nik.length !== 16) { setErr(['NIK harus 16 digit']); return; }
      if (!s4.nisn || s4.nisn.length !== 10) { setErr(['NISN harus 10 digit']); return; }
      if (!s4.full_name || !s4.birth_place || !s4.birth_date || !s4.gender || !s4.religion || !s4.family_status) {
        setErr(['Semua field wajib diisi']); return;
      }
      goSub4Next(); return;
    }

    if (sub4 === '4b') {
      if (!s4.child_order || !s4.total_siblings || !s4.total_biological_siblings) {
        setErr(['Anak ke-, dari berapa saudara, dan total saudara kandung wajib diisi']); return;
      }
      goSub4Next(); return;
    }

    if (sub4 === '4c') {
      if (!s4.school_origin || !s4.npsn || !s4.diploma_number || !s4.diploma_date || !s4.study_duration) {
        setErr(['Semua field asal sekolah wajib diisi']); return;
      }
      goSub4Next(); return;
    }

    if (sub4 === '4d') {
      if (!s4.living_status || !s4.daily_language || !s4.transportation || !s4.distance_to_school || !s4.travel_time) {
        setErr(['Semua field wajib diisi']); return;
      }
      if (!s4.photoFile && !photoPrev) { setErr(['Pas foto wajib diupload']); return; }
      goSub4Next(); return;
    }

    // 4e — kirim ke API
    if (!s4.phone || !s4.province || !s4.city || !s4.district || !s4.village || !s4.rt || !s4.rw || !s4.full_address) {
      setErr(['Semua field alamat wajib diisi']); return;
    }
    setLoading(true);
    try {
      const r = await ppdbService.saveStep4(s4);
      if (!r.success) { setErr([r.message]); return; }
      goMainNext();
    } catch (e: any) {
      const es = e.response?.data?.errors;
      setErr(Array.isArray(es) ? es : [e.response?.data?.message||'Gagal menyimpan data diri']);
    } finally { setLoading(false); }
  };

  const onStep5 = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { const r = await ppdbService.saveStep5(s5); if (!r.success) { setErr([r.message]); return; } goMainNext(); }
    catch (e: any) { setErr([e.response?.data?.message||'Gagal menyimpan']); }
    finally { setLoading(false); }
  };

  const onStep6 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!s6.kk_document && !s6Names.kk) { setErr(['Dokumen KK wajib diupload']); return; }
    if (!s6.diploma_document && !s6Names.diploma) { setErr(['Dokumen Ijazah/SKL wajib diupload']); return; }
    if (!s6.kk_document && !s6.diploma_document) { goMainNext(); return; }
    setLoading(true);
    try { const r = await ppdbService.saveStep6(s6); if (!r.success) { setErr([r.message]); return; } goMainNext(); }
    catch (e: any) { setErr([e.response?.data?.message||'Gagal upload dokumen']); }
    finally { setLoading(false); }
  };

  const onAddAch = async () => {
    if (!newAch.achievement_name.trim()) { setErr(['Nama prestasi wajib diisi']); return; }
    setLoading(true);
    try {
      await ppdbService.addAchievement(newAch);
      setAchievements(p => [...p, { achievement_name: newAch.achievement_name }]);
      setNewAch({ achievement_name:'', documentFile:null }); clearErr();
    } catch (e: any) { setErr([e.response?.data?.message||'Gagal menambah prestasi']); }
    finally { setLoading(false); }
  };

  const onStep8 = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const [ra, ri] = await Promise.all([ppdbService.saveParent('ayah',ayah), ppdbService.saveParent('ibu',ibu)]);
      const es: string[] = [];
      if (!ra.success) es.push(ra.message);
      if (!ri.success) es.push(ri.message);
      if (es.length) { setErr(es); return; }
      const sr = await ppdbService.submit();
      if (!sr.success) { const ms = (sr as any).errors; setErr(Array.isArray(ms) ? ms : [sr.message]); return; }
      ppdbService.clearToken();
      setSubmitted(true);
    } catch (e: any) { const es = e.response?.data?.errors; setErr(Array.isArray(es) ? es : [e.response?.data?.message||'Gagal submit']); }
    finally { setLoading(false); }
  };

  // ── Loading ───────────────────────────────────────────────────────────

  if (pageLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-3" />
        <p className="text-sm text-gray-400">Memuat data pendaftaran...</p>
      </div>
    </div>
  );

  // ── Status setelah submit ─────────────────────────────────────────────

  if (submitted) {
    const s = registration?.registration_status;
    const MAP = {
      submitted: { bg:'bg-blue-50',   border:'border-blue-200',   icon:'⏳', title:'Menunggu Verifikasi',  color:'text-blue-700',   desc:'Data Anda sedang diverifikasi oleh admin.' },
      verified:  { bg:'bg-indigo-50', border:'border-indigo-200', icon:'🔍', title:'Sedang Diproses',       color:'text-indigo-700', desc:'Pendaftaran Anda telah diverifikasi dan sedang diproses.' },
      accepted:  { bg:'bg-green-50',  border:'border-green-200',  icon:'🎉', title:'Selamat, Diterima!',    color:'text-green-700',  desc:'Anda telah diterima. Silakan hubungi sekolah.' },
      rejected:  { bg:'bg-red-50',    border:'border-red-200',    icon:'❌', title:'Tidak Diterima',        color:'text-red-700',    desc:'Maaf, pendaftaran Anda tidak dapat diterima.' },
    } as const;
    const cfg = MAP[(s as keyof typeof MAP)] ?? MAP.submitted;
    return (
      <div className="max-w-lg mx-auto mt-4">
        <div className={`${cfg.bg} ${cfg.border} border rounded-2xl p-8`}>
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">{cfg.icon}</div>
            <h2 className={`text-xl font-bold ${cfg.color} mb-2`}>{cfg.title}</h2>
            <p className="text-gray-600 text-sm">{cfg.desc}</p>
          </div>
          {registration?.notes && (
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Catatan Admin</p>
              <p className="text-sm text-gray-800">{registration.notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Hitung progress ───────────────────────────────────────────────────

  // Setiap main step = 1 unit, step 4 dipecah jadi 5 sub (bobot = 5 unit)
  // Total unit = 6 main-step non-4 + 5 sub-step = 6 + 5 = 11 unit
  const TOTAL_UNITS = 11;
  let doneUnits = 0;
  if (step > 2) doneUnits++; // step 2 done
  if (step > 3) doneUnits++; // step 3 done
  if (step > 4) {
    doneUnits += 5; // semua sub-step 4 done
  } else if (step === 4) {
    doneUnits += sub4List.indexOf(sub4); // berapa sub yang sudah lewat
  }
  if (step > 5) doneUnits++;
  if (step > 6) doneUnits++;
  if (step > 7) doneUnits++;
  const pct = Math.round((doneUnits / TOTAL_UNITS) * 100);

  // Label step aktif untuk header
  const activeLabel = step === 4
    ? `Data Diri — ${SUB4.find(s => s.id === sub4)?.label}`
    : MAIN_STEPS.find(s => s.number === step)?.label ?? '';

  const activeStepNum = step === 4
    ? `4 (${sub4List.indexOf(sub4)+1}/${SUB4.length})`
    : String(step);

  return (
    <div className="w-full">
      {/* ── Stepper ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-700">Progres Pengisian</p>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{pct}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full mb-4">
          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }} />
        </div>
        {/* Main step chips */}
        <div className="flex gap-1.5 flex-wrap">
          {MAIN_STEPS.map(s => {
            const done   = step > s.number;
            const active = step === s.number;
            return (
              <span key={s.number}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all
                  ${done   ? 'bg-green-100 text-green-700'
                  : active ? 'bg-blue-600 text-white shadow-sm'
                           : 'bg-gray-100 text-gray-400'}`}>
                {done ? <CheckCircle className="w-3 h-3" /> : s.icon}
                {s.label}
              </span>
            );
          })}
        </div>

        {/* Sub-step chips untuk step 4 */}
        {step === 4 && (
          <div className="flex gap-1.5 flex-wrap mt-2 pt-2 border-t border-gray-100">
            {SUB4.map((s, idx) => {
              const curIdx  = sub4List.indexOf(sub4);
              const done    = idx < curIdx;
              const active  = s.id === sub4;
              return (
                <span key={s.id}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all
                    ${done   ? 'bg-green-100 text-green-600'
                    : active ? 'bg-indigo-600 text-white shadow-sm'
                             : 'bg-gray-100 text-gray-400'}`}>
                  {done && <CheckCircle className="w-3 h-3" />}
                  {s.label}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Form card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        {/* Card header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {step}
            </div>
            <div>
              <h2 className="font-bold text-gray-800 text-base">{activeLabel}</h2>
              <p className="text-xs text-gray-400">Langkah {activeStepNum} dari 8</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Error */}
          {errors.length > 0 && (
            <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <ul className="space-y-0.5">
                {errors.map((e, i) => <li key={i} className="text-red-600 text-sm">{e}</li>)}
              </ul>
            </div>
          )}

          {/* ══ Step 2 ══ */}
          {step === 2 && (
            <form onSubmit={onStep2}>
              <p className="text-sm text-gray-500 mb-5">Pilih siapa yang melakukan pendaftaran ini.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
                {[
                  { val:'diri_sendiri', label:'Diri Sendiri', icon:'👤' },
                  { val:'ayah',         label:'Ayah',          icon:'👨' },
                  { val:'ibu',          label:'Ibu',           icon:'👩' },
                  { val:'saudara',      label:'Saudara',       icon:'🤝' },
                  { val:'guru',         label:'Guru',          icon:'👨‍🏫' },
                ].map(opt => (
                  <button key={opt.val} type="button"
                    onClick={() => setS23(p => ({ ...p, registered_by: opt.val }))}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all
                      ${s23.registered_by === opt.val ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                    <span className="text-2xl">{opt.icon}</span>
                    <span className={`font-semibold text-sm ${s23.registered_by === opt.val ? 'text-blue-700' : 'text-gray-700'}`}>{opt.label}</span>
                    {s23.registered_by === opt.val && <CheckCircle className="w-4 h-4 text-blue-500 ml-auto" />}
                  </button>
                ))}
              </div>
              <Nav loading={loading} />
            </form>
          )}

          {/* ══ Step 3 ══ */}
          {step === 3 && (
            <form onSubmit={onStep3}>
              <p className="text-sm text-gray-500 mb-5">Pilih jurusan dan sistem pendidikan.</p>
              <Grid>
                <F label="Jurusan" req>
                  <select value={s23.major} onChange={e => setS23(p => ({ ...p, major: e.target.value }))} className={sel} required>
                    <option value="">-- Pilih --</option>
                    <option value="TKJ">Teknik Komputer & Jaringan (TKJ)</option>
                    <option value="teknik_otomotif">Teknik Otomotif</option>
                  </select>
                </F>
                <F label="Sistem Pendidikan" req>
                  <select value={s23.education_system} onChange={e => setS23(p => ({ ...p, education_system: e.target.value }))} className={sel} required>
                    <option value="">-- Pilih --</option>
                    <option value="reguler">Reguler</option>
                    <option value="pondok">Pondok (Pesantren)</option>
                    <option value="panti">Panti Asuhan</option>
                  </select>
                </F>
              </Grid>
              <Nav onPrev={goMainPrev} loading={loading} />
            </form>
          )}

          {/* ══ Step 4 — sub-steps ══ */}
          {step === 4 && (
            <form onSubmit={onSub4Next}>

              {/* 4a — Identitas */}
              {sub4 === '4a' && (
                <>
                  <p className="text-sm text-gray-500 mb-5">Isi data identitas sesuai dokumen resmi.</p>
                  <Grid>
                    <F label="NIK / KIA (16 digit)" req><input type="text" value={s4.nik} onChange={e=>setS4(p=>({...p,nik:e.target.value}))} className={inp} maxLength={16} placeholder="16 digit" required /></F>
                    <F label="NISN (10 digit)" req><input type="text" value={s4.nisn} onChange={e=>setS4(p=>({...p,nisn:e.target.value}))} className={inp} maxLength={10} placeholder="10 digit" required /></F>
                    <F label="Kewarganegaraan" req><input type="text" value={s4.nationality} onChange={e=>setS4(p=>({...p,nationality:e.target.value}))} className={inp} required /></F>
                    <F label="Nama Lengkap (sesuai ijazah)" req span2><input type="text" value={s4.full_name} onChange={e=>setS4(p=>({...p,full_name:e.target.value}))} className={inp} required /></F>
                    <F label="Nama Panggilan"><input type="text" value={s4.nickname} onChange={e=>setS4(p=>({...p,nickname:e.target.value}))} className={inp} /></F>
                    <F label="Tempat Lahir" req><input type="text" value={s4.birth_place} onChange={e=>setS4(p=>({...p,birth_place:e.target.value}))} className={inp} required /></F>
                    <F label="Tanggal Lahir" req><input type="date" value={s4.birth_date} onChange={e=>setS4(p=>({...p,birth_date:e.target.value}))} className={inp} required /></F>
                    <F label="Jenis Kelamin" req>
                      <select value={s4.gender} onChange={e=>setS4(p=>({...p,gender:e.target.value}))} className={sel} required>
                        <option value="">-- Pilih --</option>
                        <option value="laki-laki">Laki-laki</option>
                        <option value="perempuan">Perempuan</option>
                      </select>
                    </F>
                    <F label="Agama" req>
                      <select value={s4.religion} onChange={e=>setS4(p=>({...p,religion:e.target.value}))} className={sel} required>
                        <option value="">-- Pilih --</option>
                        {AGAMA.map(a=><option key={a} value={a}>{a.charAt(0).toUpperCase()+a.slice(1)}</option>)}
                      </select>
                    </F>
                    <F label="Status Keluarga" req>
                      <select value={s4.family_status} onChange={e=>setS4(p=>({...p,family_status:e.target.value}))} className={sel} required>
                        <option value="">-- Pilih --</option>
                        {['lengkap','yatim','piatu','yatim_piatu','lainnya'].map(v=><option key={v} value={v}>{v.replace('_',' ')}</option>)}
                      </select>
                    </F>
                  </Grid>
                </>
              )}

              {/* 4b — Keluarga */}
              {sub4 === '4b' && (
                <>
                  <p className="text-sm text-gray-500 mb-5">Informasi posisi dalam keluarga.</p>
                  <Grid>
                    <F label="Anak Ke-" req><input type="number" value={s4.child_order} onChange={e=>setS4(p=>({...p,child_order:e.target.value}))} className={inp} min={1} required /></F>
                    <F label="Dari Berapa Saudara" req><input type="number" value={s4.total_siblings} onChange={e=>setS4(p=>({...p,total_siblings:e.target.value}))} className={inp} min={0} required /></F>
                    <F label="Jumlah Saudara Kandung" req><input type="number" value={s4.total_biological_siblings} onChange={e=>setS4(p=>({...p,total_biological_siblings:e.target.value}))} className={inp} min={0} required /></F>
                    <F label="Jumlah Saudara Tiri"><input type="number" value={s4.total_step_siblings} onChange={e=>setS4(p=>({...p,total_step_siblings:e.target.value}))} className={inp} min={0} /></F>
                    <F label="Jumlah Saudara Angkat"><input type="number" value={s4.total_adopted_siblings} onChange={e=>setS4(p=>({...p,total_adopted_siblings:e.target.value}))} className={inp} min={0} /></F>
                  </Grid>
                </>
              )}

              {/* 4c — Asal Sekolah + KIP */}
              {sub4 === '4c' && (
                <>
                  <p className="text-sm text-gray-500 mb-5">Data sekolah asal dan dokumen ijazah.</p>
                  <Grid>
                    <F label="Nama Sekolah Asal" req span2><input type="text" value={s4.school_origin} onChange={e=>setS4(p=>({...p,school_origin:e.target.value}))} className={inp} required /></F>
                    <F label="NPSN" req><input type="text" value={s4.npsn} onChange={e=>setS4(p=>({...p,npsn:e.target.value}))} className={inp} required /></F>
                    <F label="Lama Belajar (tahun)" req><input type="number" value={s4.study_duration} onChange={e=>setS4(p=>({...p,study_duration:e.target.value}))} className={inp} min={1} max={10} required /></F>
                    <F label="Nomor Ijazah" req><input type="text" value={s4.diploma_number} onChange={e=>setS4(p=>({...p,diploma_number:e.target.value}))} className={inp} required /></F>
                    <F label="Tanggal Ijazah" req><input type="date" value={s4.diploma_date} onChange={e=>setS4(p=>({...p,diploma_date:e.target.value}))} className={inp} required /></F>
                  </Grid>
                  <div className="mt-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Kartu Indonesia Pintar (KIP)</p>
                    <label className="flex items-center gap-3 cursor-pointer w-fit mb-3">
                      <input type="checkbox" checked={s4.has_kip} onChange={e=>setS4(p=>({...p,has_kip:e.target.checked,kip_number:''}))} className="w-4 h-4 text-blue-600 rounded" />
                      <span className="text-sm font-medium text-gray-700">Saya penerima KIP</span>
                    </label>
                    {s4.has_kip && (
                      <div className="max-w-xs">
                        <F label="Nomor KIP" req><input type="text" value={s4.kip_number} onChange={e=>setS4(p=>({...p,kip_number:e.target.value}))} className={inp} required /></F>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* 4d — Info & Foto */}
              {sub4 === '4d' && (
                <>
                  <p className="text-sm text-gray-500 mb-5">Informasi tempat tinggal, transportasi, dan pas foto.</p>
                  <Grid>
                    <F label="Status Tinggal" req>
                      <select value={s4.living_status} onChange={e=>setS4(p=>({...p,living_status:e.target.value}))} className={sel} required>
                        <option value="">-- Pilih --</option>
                        {TINGGAL.map(t=><option key={t} value={t}>{t}</option>)}
                      </select>
                    </F>
                    <F label="Bahasa Sehari-hari" req>
                      <select value={s4.daily_language} onChange={e=>setS4(p=>({...p,daily_language:e.target.value}))} className={sel} required>
                        <option value="">-- Pilih --</option>
                        {BAHASA.map(b=><option key={b} value={b}>{b}</option>)}
                      </select>
                    </F>
                    <F label="Saudara di Sekolah Ini"><input type="number" value={s4.siblings_in_school} onChange={e=>setS4(p=>({...p,siblings_in_school:e.target.value}))} className={inp} min={0} /></F>
                    <F label="Transportasi ke Sekolah" req>
                      <select value={s4.transportation} onChange={e=>setS4(p=>({...p,transportation:e.target.value}))} className={sel} required>
                        <option value="">-- Pilih --</option>
                        {TRANSPORTASI.map(t=><option key={t} value={t}>{t}</option>)}
                      </select>
                    </F>
                    <F label="Jarak ke Sekolah (km)" req><input type="number" value={s4.distance_to_school} onChange={e=>setS4(p=>({...p,distance_to_school:e.target.value}))} className={inp} step="0.1" min={0} required /></F>
                    <F label="Waktu Tempuh (jam)" req><input type="number" value={s4.travel_time} onChange={e=>setS4(p=>({...p,travel_time:e.target.value}))} className={inp} step="0.1" min={0} required /></F>
                  </Grid>
                  <div className="mt-5">
                    <Lbl text="Pas Foto 3×4 (JPG/PNG, maks 10MB)" req />
                    <div className="flex items-start gap-4 mt-1">
                      {photoPrev && (
                        <div className="relative shrink-0">
                          <img src={photoPrev} alt="Foto" className="w-24 h-32 object-cover rounded-xl border border-gray-200 shadow-sm" />
                          <button type="button" onClick={()=>{setPhotoPrev(null);setS4(p=>({...p,photoFile:null}))}}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <label className="flex-1 flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition max-w-sm">
                        <Upload className="w-6 h-6 text-gray-400" />
                        <span className="text-xs text-gray-500 text-center">Klik untuk upload foto<br /><span className="text-gray-400">JPG, PNG</span></span>
                        <input type="file" accept="image/jpeg,image/jpg,image/png" className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) { setS4(p=>({...p,photoFile:f})); const r=new FileReader(); r.onloadend=()=>setPhotoPrev(r.result as string); r.readAsDataURL(f); } }}
                          required={!photoPrev} />
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* 4e — Alamat */}
              {sub4 === '4e' && (
                <>
                  <p className="text-sm text-gray-500 mb-5">Isi nomor HP dan alamat tempat tinggal saat ini.</p>
                  <Grid>
                    <F label="No HP (diawali 08)" req><input type="tel" value={s4.phone} onChange={e=>setS4(p=>({...p,phone:e.target.value}))} className={inp} placeholder="08xxxxxxxxxx" required /></F>
                    <F label="Email Kontak"><input type="email" value={s4.contact_email} onChange={e=>setS4(p=>({...p,contact_email:e.target.value}))} className={inp} /></F>
                    <F label="Provinsi" req><input type="text" value={s4.province} onChange={e=>setS4(p=>({...p,province:e.target.value}))} className={inp} required /></F>
                    <F label="Kabupaten / Kota" req><input type="text" value={s4.city} onChange={e=>setS4(p=>({...p,city:e.target.value}))} className={inp} required /></F>
                    <F label="Kecamatan" req><input type="text" value={s4.district} onChange={e=>setS4(p=>({...p,district:e.target.value}))} className={inp} required /></F>
                    <F label="Desa / Kelurahan" req><input type="text" value={s4.village} onChange={e=>setS4(p=>({...p,village:e.target.value}))} className={inp} required /></F>
                    <F label="RT" req><input type="text" value={s4.rt} onChange={e=>setS4(p=>({...p,rt:e.target.value}))} className={inp} maxLength={3} required /></F>
                    <F label="RW" req><input type="text" value={s4.rw} onChange={e=>setS4(p=>({...p,rw:e.target.value}))} className={inp} maxLength={3} required /></F>
                    <F label="Alamat Lengkap" req span2><textarea value={s4.full_address} onChange={e=>setS4(p=>({...p,full_address:e.target.value}))} className={inp} rows={3} required /></F>
                  </Grid>
                </>
              )}

              <Nav
                onPrev={goSub4Prev}
                loading={loading}
                skipLabel={sub4 === '4e' ? undefined : 'Lanjut →'}
              />
            </form>
          )}

          {/* ══ Step 5 ══ */}
          {step === 5 && (
            <form onSubmit={onStep5}>
              <p className="text-sm text-gray-500 mb-5">Semua field bersifat opsional.</p>
              <Grid>
                <F label="Tinggi Badan (cm)"><input type="number" value={s5.height} onChange={e=>setS5(p=>({...p,height:e.target.value}))} className={inp} step="0.1" min={0} placeholder="165" /></F>
                <F label="Berat Badan (kg)"><input type="number" value={s5.weight} onChange={e=>setS5(p=>({...p,weight:e.target.value}))} className={inp} step="0.1" min={0} placeholder="55" /></F>
              </Grid>
              <div className="space-y-4 mt-4">
                <F label="Riwayat Penyakit / Kesehatan"><textarea value={s5.health_history} onChange={e=>setS5(p=>({...p,health_history:e.target.value}))} className={inp} rows={3} placeholder="Kosongkan jika tidak ada" /></F>
                <F label="Disabilitas"><textarea value={s5.disability} onChange={e=>setS5(p=>({...p,disability:e.target.value}))} className={inp} rows={2} placeholder="Kosongkan jika tidak ada" /></F>
              </div>
              <Nav onPrev={goMainPrev} loading={loading} />
            </form>
          )}

          {/* ══ Step 6 ══ */}
          {step === 6 && (
            <form onSubmit={onStep6}>
              <p className="text-sm text-gray-500 mb-5">Format PDF, JPG, atau PNG — maks 10MB per file.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {([
                  { key:'kk' as const, label:'Kartu Keluarga (KK)', field:'kk_document' as const },
                  { key:'diploma' as const, label:'Ijazah / SKL', field:'diploma_document' as const },
                ]).map(doc => {
                  const saved = s6Names[doc.key];
                  const file  = s6[doc.field];
                  return (
                    <div key={doc.key}>
                      <Lbl text={doc.label} req />
                      <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition
                        ${file || saved ? 'border-green-400 bg-green-50' : 'border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50'}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${file || saved ? 'bg-green-100' : 'bg-gray-100'}`}>
                          {file || saved ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Upload className="w-5 h-5 text-gray-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${file || saved ? 'text-green-700' : 'text-gray-500'}`}>
                            {file ? file.name : saved || 'Klik untuk memilih file'}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">PDF, JPG, PNG — maks 10MB</p>
                        </div>
                        <input type="file" accept=".pdf,image/jpeg,image/jpg,image/png" className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) { setS6(p=>({...p,[doc.field]:f})); setS6Names(p=>({...p,[doc.key]:f.name})); } }} />
                      </label>
                    </div>
                  );
                })}
              </div>
              <Nav onPrev={goMainPrev} loading={loading} />
            </form>
          )}

          {/* ══ Step 7 ══ */}
          {step === 7 && (
            <div>
              <p className="text-sm text-gray-500 mb-5">Opsional — tambahkan prestasi jika ada.</p>
              {achievements.length > 0 && (
                <div className="mb-4 space-y-2">
                  {achievements.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                      <Trophy className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="text-sm font-medium text-gray-800">{a.achievement_name}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-4">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Tambah Prestasi</p>
                <Grid>
                  <F label="Nama Prestasi"><input type="text" value={newAch.achievement_name} onChange={e=>setNewAch(p=>({...p,achievement_name:e.target.value}))} className={inp} placeholder="Contoh: Juara 1 Olimpiade" /></F>
                  <F label="Bukti Dokumen (opsional)">
                    <label className="flex items-center gap-2 p-2.5 border border-gray-200 rounded-xl cursor-pointer hover:bg-white transition">
                      <Upload className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-xs text-gray-500 truncate">{newAch.documentFile?.name || 'Pilih file...'}</span>
                      <input type="file" accept=".pdf,image/jpeg,image/jpg,image/png" className="hidden"
                        onChange={e=>{const f=e.target.files?.[0]; if(f) setNewAch(p=>({...p,documentFile:f}));}} />
                    </label>
                  </F>
                </Grid>
                <button type="button" onClick={onAddAch} disabled={loading}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Tambah
                </button>
              </div>
              <Nav onPrev={goMainPrev} loading={loading} onNext={goMainNext} skipLabel="Lanjutkan →" />
            </div>
          )}

          {/* ══ Step 8 ══ */}
          {step === 8 && (
            <form onSubmit={onStep8}>
              {(['ayah','ibu'] as const).map(type => {
                const data    = type === 'ayah' ? ayah : ibu;
                const setData = type === 'ayah' ? setAyah : setIbu;
                return (
                  <div key={type} className="mb-8 last:mb-0">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold mb-4 ${type==='ayah' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                      {type==='ayah' ? '♂' : '♀'} Data {type==='ayah' ? 'Ayah' : 'Ibu'}
                    </div>
                    <Grid>
                      <F label={`Nama ${type==='ayah'?'Ayah':'Ibu'}`} req span2><input type="text" value={data.full_name} onChange={e=>setData(p=>({...p,full_name:e.target.value}))} className={inp} required /></F>
                      <F label="NIK (16 digit)" req><input type="text" value={data.nik} onChange={e=>setData(p=>({...p,nik:e.target.value}))} className={inp} maxLength={16} required /></F>
                      <F label="Pendidikan Terakhir" req>
                        <select value={data.education} onChange={e=>setData(p=>({...p,education:e.target.value}))} className={sel} required>
                          <option value="">-- Pilih --</option>
                          {PENDIDIKAN.map(v=><option key={v} value={v}>{v}</option>)}
                        </select>
                      </F>
                      <F label="Pekerjaan" req>
                        <select value={data.occupation} onChange={e=>setData(p=>({...p,occupation:e.target.value}))} className={sel} required>
                          <option value="">-- Pilih --</option>
                          {PEKERJAAN.map(v=><option key={v} value={v}>{v}</option>)}
                        </select>
                      </F>
                      <F label="Status Pernikahan" req>
                        <select value={data.marital_status} onChange={e=>setData(p=>({...p,marital_status:e.target.value}))} className={sel} required>
                          <option value="">-- Pilih --</option>
                          <option value="menikah">Menikah</option>
                          <option value="cerai_hidup">Cerai Hidup</option>
                          <option value="cerai_mati">Cerai Mati</option>
                          <option value="lainnya">Lainnya</option>
                        </select>
                      </F>
                      <F label="No HP (diawali 08)" req><input type="tel" value={data.phone} onChange={e=>setData(p=>({...p,phone:e.target.value}))} className={inp} placeholder="08xxxxxxxxxx" required /></F>
                      <F label="Tempat Lahir" req><input type="text" value={data.birth_place} onChange={e=>setData(p=>({...p,birth_place:e.target.value}))} className={inp} required /></F>
                      <F label="Tanggal Lahir" req><input type="date" value={data.birth_date} onChange={e=>setData(p=>({...p,birth_date:e.target.value}))} className={inp} required /></F>
                      <F label="Kewarganegaraan" req><input type="text" value={data.nationality} onChange={e=>setData(p=>({...p,nationality:e.target.value}))} className={inp} required /></F>
                      <F label="Agama" req>
                        <select value={data.religion} onChange={e=>setData(p=>({...p,religion:e.target.value}))} className={sel} required>
                          <option value="">-- Pilih --</option>
                          {AGAMA.map(a=><option key={a} value={a}>{a.charAt(0).toUpperCase()+a.slice(1)}</option>)}
                        </select>
                      </F>
                      <F label="Penghasilan / Bulan (Rp)"><input type="number" value={data.monthly_income} onChange={e=>setData(p=>({...p,monthly_income:e.target.value}))} className={inp} min={0} placeholder="Contoh: 3000000" /></F>
                    </Grid>
                    {type === 'ayah' && <hr className="my-6 border-gray-100" />}
                  </div>
                );
              })}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-2 flex gap-3">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">Pastikan semua data sudah benar. Pendaftaran yang sudah disubmit tidak dapat diubah.</p>
              </div>
              <Nav onPrev={goMainPrev} loading={loading} isLast />
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
