import http from 'k6/http';
import { check, sleep } from 'k6';

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║              SIAKAD — Load Testing Script (k6)                         ║
// ╚══════════════════════════════════════════════════════════════════════════╝
//
// Cara menjalankan:
//   1. Pastikan backend sudah aktif:
//        npm run dev
//
//   2. Install k6 (jika belum):
//        winget install k6 --source winget
//        atau: https://k6.io/docs/get-started/installation/
//
//   3. Buka terminal baru di folder ini, lalu jalankan:
//        k6 run loadtest.js
//
// ── Penjelasan Pengaturan (options.stages) ────────────────────────────────────
//
//   Pengaturan        │ Fungsi
//   ──────────────────┼────────────────────────────────────────────────────────
//   target: 50        │ Menaikkan jumlah user virtual menjadi 50
//   target: 100       │ Menaikkan jumlah user virtual menjadi 100
//   target: 200       │ Menaikkan jumlah user virtual menjadi 200
//   sleep(1)          │ Setiap virtual user menunggu ~1 detik sebelum iterasi berikutnya
//   p(95)<500         │ Target agar 95% waktu respons berada di bawah 500 ms
//   rate<0.01         │ Target agar tingkat kegagalan request di bawah 1%
//
//   Catatan: 500ms dan 1% adalah TARGET pengujian yang bisa disesuaikan,
//   bukan jaminan bahwa aplikasi harus selalu mencapainya.
//
//   Dengan konfigurasi ini, pengujian berlangsung ±3 menit.
//   Jumlah user virtual meningkat bertahap hingga 200, lalu diturunkan kembali.
//
// ── Metrik Hasil yang Perlu Diperhatikan ─────────────────────────────────────
//
//   Metrik                │ Artinya
//   ──────────────────────┼──────────────────────────────────────────────────
//   http_req_duration     │ Waktu respons HTTP
//   http_req_failed       │ Persentase request yang gagal
//   http_reqs             │ Jumlah total request yang dikirim
//   iterations            │ Jumlah iterasi yang diselesaikan
//   vus_max               │ Jumlah maksimum virtual user yang digunakan
//
//   ⚠  Perhatikan http_req_duration bagian p(95).
//      Metrik ini menunjukkan waktu respons yang tidak terlampaui oleh
//      95% request yang diukur.
//      Jika p(95) mencapai beberapa detik atau banyak request gagal,
//      kamu perlu menyelidiki penyebabnya.
//
// ─────────────────────────────────────────────────────────────────────────────

// ── Kredensial (gunakan EMAIL, bukan username) ────────────────────────────────
const STUDENT_EMAIL = 'andi@siswa.sch.id';
const TEACHER_EMAIL = 'guru.bin@sekolah.sch.id';
const PASSWORD      = 'password';

const BASE_URL = 'http://localhost:8080';

export const options = {
  stages: [
    { duration: '30s', target: 50  }, // Ramp-up: 0 → 50 VU dalam 30 detik
    { duration: '1m',  target: 100 }, // Naik: 50 → 100 VU selama 1 menit
    { duration: '1m',  target: 200 }, // Puncak: 100 → 200 VU selama 1 menit
    { duration: '30s', target: 0   }, // Ramp-down: 200 → 0 VU dalam 30 detik
  ],

  thresholds: {
    // Kurang dari 1% request boleh gagal
    http_req_failed: ['rate<0.01'],
    // 95% request harus selesai di bawah 500ms
    http_req_duration: ['p(95)<500'],
  },
};

// ── Helper: Login dan ambil token ─────────────────────────────────────────────
function getToken(email, password) {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(res, {
    'login status 200': (r) => r.status === 200,
    'login token ada':  (r) => {
      try { return !!JSON.parse(r.body)?.data?.token; } catch { return false; }
    },
  });

  try {
    return JSON.parse(res.body)?.data?.token || '';
  } catch {
    return '';
  }
}

// ── Skenario Utama ────────────────────────────────────────────────────────────
export default function () {

  // ── 1. Public endpoint — tidak butuh login ──────────────────────────────────
  const publicRes = http.get(`${BASE_URL}/api/school-profile`);
  check(publicRes, {
    'school-profile status 200': (r) => r.status === 200,
  });

  sleep(0.5);

  // ── 2. Login — stress test auth endpoint ───────────────────────────────────
  const token = getToken(STUDENT_EMAIL, PASSWORD);

  sleep(0.5);

  if (!token) return; // skip skenario berikutnya jika login gagal

  const authHeaders = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json',
    },
  };

  // ── 3. Ujian saya (heavy JOIN query) ───────────────────────────────────────
  const myExamsRes = http.get(`${BASE_URL}/api/exam-attempts/my`, authHeaders);
  check(myExamsRes, {
    'my-exams status 200': (r) => r.status === 200,
  });

  sleep(0.5);

  // ── 4. Nilai saya ──────────────────────────────────────────────────────────
  const gradesRes = http.get(`${BASE_URL}/api/grades/my`, authHeaders);
  check(gradesRes, {
    'grades/my status 200': (r) => r.status === 200,
  });

  sleep(0.5);

  // ── 5. Jadwal kelas siswa ──────────────────────────────────────────────────
  const scheduleRes = http.get(`${BASE_URL}/api/schedules/my`, authHeaders);
  check(scheduleRes, {
    'schedules/my status 200': (r) => r.status === 200,
  });

  sleep(1);
}
