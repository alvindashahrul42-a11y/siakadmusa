/**
 * run_seed.js — Jalankan: node src/migration/run_seed.js
 * Membuat data ujian lengkap untuk testing:
 *   - 1 academic year, 2 majors, 2 classes
 *   - 2 teachers, 4 students
 *   - class_subjects & class_students
 *   - 1 exam (UTS), 2 question_sets, 19 soal (9 MC + 1 essay) x2 mapel
 *   - 3 exam_schedules (hari ini + 1 hari & 2 hari ke depan)
 */

require('dotenv').config();
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

// ── helper ────────────────────────────────────────────────────────────────────
const id = () => uuidv4();
const exec = (sql, params) => pool.execute(sql, params);

// tanggal hari ini dan ke depan
const today     = new Date().toISOString().slice(0, 10);
const tomorrow  = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const dayAfter  = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);

async function seed() {
  console.log('▶ Mulai seeding...\n');

  // Password hash "password"
  const pwHash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

  // ── 1. Roles (sudah ada, ambil ID) ──────────────────────────────────────────
  const [[teacherRole]] = await exec(`SELECT id FROM roles WHERE name = 'teacher'`);
  const [[studentRole]] = await exec(`SELECT id FROM roles WHERE name = 'student'`);
  if (!teacherRole) throw new Error('Role teacher tidak ditemukan. Jalankan schema.sql dulu!');

  // ── 2. Academic Year ─────────────────────────────────────────────────────────
  const ayId = id();
  await exec(
    `INSERT IGNORE INTO academic_years (id, name, start_date, end_date, is_active) VALUES (?,?,?,?,?)`,
    [ayId, '2026/2027', '2026-07-14', '2027-06-30', true]
  );
  const [[ay]] = await exec(`SELECT id FROM academic_years WHERE name = '2026/2027' LIMIT 1`);
  console.log('✓ Academic Year:', ay.id);

  // ── 3. Majors ────────────────────────────────────────────────────────────────
  const majorTkjId = id(); const majorToId = id();
  await exec(`INSERT IGNORE INTO majors (id, code, name) VALUES (?,?,?)`, [majorTkjId, 'TKJ', 'Teknik Komputer dan Jaringan']);
  await exec(`INSERT IGNORE INTO majors (id, code, name) VALUES (?,?,?)`, [majorToId,  'TO',  'Teknik Otomotif']);
  const [[mTkj]] = await exec(`SELECT id FROM majors WHERE code = 'TKJ'`);
  const [[mTo]]  = await exec(`SELECT id FROM majors WHERE code = 'TO'`);
  console.log('✓ Majors: TKJ =', mTkj.id, '| TO =', mTo.id);

  // ── 4. Classes ───────────────────────────────────────────────────────────────
  const clsTkj1Id = id(); const clsTo1Id = id();
  await exec(`INSERT IGNORE INTO classes (id, academic_year_id, major_id, name, grade_level, is_active) VALUES (?,?,?,?,?,?)`,
    [clsTkj1Id, ay.id, mTkj.id, 'X TKJ 1', 10, true]);
  await exec(`INSERT IGNORE INTO classes (id, academic_year_id, major_id, name, grade_level, is_active) VALUES (?,?,?,?,?,?)`,
    [clsTo1Id, ay.id, mTo.id, 'X TO 1', 10, true]);
  const [[cTkj1]] = await exec(`SELECT id FROM classes WHERE name = 'X TKJ 1' AND academic_year_id = ?`, [ay.id]);
  const [[cTo1]]  = await exec(`SELECT id FROM classes WHERE name = 'X TO 1'  AND academic_year_id = ?`, [ay.id]);
  console.log('✓ Classes: X TKJ 1 =', cTkj1.id, '| X TO 1 =', cTo1.id);

  // ── 5. Subjects (sudah ada, ambil ID) ────────────────────────────────────────
  const [[sBin]] = await exec(`SELECT id FROM subjects WHERE code = 'BIN'`);
  const [[sMtk]] = await exec(`SELECT id FROM subjects WHERE code = 'MTK'`);
  if (!sBin || !sMtk) throw new Error('Subject BIN/MTK tidak ditemukan. Cek schema.sql!');

  // ── 6. Teachers ──────────────────────────────────────────────────────────────
  const uBinId = id(); const uMtkId = id();
  await exec(`INSERT IGNORE INTO users (id, role_id, username, email, password, is_active) VALUES (?,?,?,?,?,?)`,
    [uBinId, teacherRole.id, 'guru_bin', 'guru.bin@sekolah.sch.id', pwHash, true]);
  await exec(`INSERT IGNORE INTO users (id, role_id, username, email, password, is_active) VALUES (?,?,?,?,?,?)`,
    [uMtkId, teacherRole.id, 'guru_mtk', 'guru.mtk@sekolah.sch.id', pwHash, true]);
  const [[uBin]] = await exec(`SELECT id FROM users WHERE username = 'guru_bin'`);
  const [[uMtk]] = await exec(`SELECT id FROM users WHERE username = 'guru_mtk'`);

  const tBinId = id(); const tMtkId = id();
  await exec(`INSERT IGNORE INTO teachers (id, user_id, teacher_number, full_name, gender) VALUES (?,?,?,?,?)`,
    [tBinId, uBin.id, 'GTK-001', 'Siti Rahayu, S.Pd.', 'Perempuan']);
  await exec(`INSERT IGNORE INTO teachers (id, user_id, teacher_number, full_name, gender) VALUES (?,?,?,?,?)`,
    [tMtkId, uMtk.id, 'GTK-002', 'Budi Santoso, S.Pd.', 'Laki-laki']);
  const [[tBin]] = await exec(`SELECT id FROM teachers WHERE teacher_number = 'GTK-001'`);
  const [[tMtk]] = await exec(`SELECT id FROM teachers WHERE teacher_number = 'GTK-002'`);
  console.log('✓ Teachers: BIN =', tBin.id, '| MTK =', tMtk.id);

  // ── 7. Students ───────────────────────────────────────────────────────────────
  const students = [
    { uid: id(), sid: id(), uname: 'andi2026',  email: 'andi@siswa.sch.id',  nim: '2026001', name: 'Andi Prasetyo',    gender: 'Laki-laki',  cls: null },
    { uid: id(), sid: id(), uname: 'dewi2026',  email: 'dewi@siswa.sch.id',  nim: '2026002', name: 'Dewi Anggraini',   gender: 'Perempuan',  cls: null },
    { uid: id(), sid: id(), uname: 'fajar2026', email: 'fajar@siswa.sch.id', nim: '2026003', name: 'Fajar Ramadhan',   gender: 'Laki-laki',  cls: null },
    { uid: id(), sid: id(), uname: 'gita2026',  email: 'gita@siswa.sch.id',  nim: '2026004', name: 'Gita Puspitasari', gender: 'Perempuan',  cls: null },
  ];

  for (const s of students) {
    await exec(`INSERT IGNORE INTO users (id, role_id, username, email, password, is_active) VALUES (?,?,?,?,?,?)`,
      [s.uid, studentRole.id, s.uname, s.email, pwHash, true]);
    const [[u]] = await exec(`SELECT id FROM users WHERE username = ?`, [s.uname]);
    await exec(`INSERT IGNORE INTO students (id, user_id, student_number, full_name, gender, enrollment_year) VALUES (?,?,?,?,?,?)`,
      [s.sid, u.id, s.nim, s.name, s.gender, 2026]);
    const [[stu]] = await exec(`SELECT id FROM students WHERE student_number = ?`, [s.nim]);
    s.dbId = stu.id;
  }
  console.log('✓ Students:', students.map(s => s.name).join(', '));

  // ── 8. Class Subjects ────────────────────────────────────────────────────────
  const csBinTkj1Id = id(); const csMtkTkj1Id = id(); const csBinTo1Id = id();
  await exec(`INSERT IGNORE INTO class_subjects (id, class_id, subject_id, teacher_id) VALUES (?,?,?,?)`,
    [csBinTkj1Id, cTkj1.id, sBin.id, tBin.id]);
  await exec(`INSERT IGNORE INTO class_subjects (id, class_id, subject_id, teacher_id) VALUES (?,?,?,?)`,
    [csMtkTkj1Id, cTkj1.id, sMtk.id, tMtk.id]);
  await exec(`INSERT IGNORE INTO class_subjects (id, class_id, subject_id, teacher_id) VALUES (?,?,?,?)`,
    [csBinTo1Id,  cTo1.id,  sBin.id, tBin.id]);
  const [[csBinTkj1]] = await exec(`SELECT id FROM class_subjects WHERE class_id=? AND subject_id=?`, [cTkj1.id, sBin.id]);
  const [[csMtkTkj1]] = await exec(`SELECT id FROM class_subjects WHERE class_id=? AND subject_id=?`, [cTkj1.id, sMtk.id]);
  const [[csBinTo1]]  = await exec(`SELECT id FROM class_subjects WHERE class_id=? AND subject_id=?`, [cTo1.id,  sBin.id]);
  console.log('✓ Class Subjects: BIN/TKJ1, MTK/TKJ1, BIN/TO1');

  // ── 9. Class Students ────────────────────────────────────────────────────────
  // Andi & Dewi → X TKJ 1 | Fajar & Gita → X TO 1
  const classMaps = [
    { stuId: students[0].dbId, clsId: cTkj1.id },
    { stuId: students[1].dbId, clsId: cTkj1.id },
    { stuId: students[2].dbId, clsId: cTo1.id  },
    { stuId: students[3].dbId, clsId: cTo1.id  },
  ];
  for (const cm of classMaps) {
    await exec(`INSERT IGNORE INTO class_students (id, class_id, student_id) VALUES (?,?,?)`,
      [id(), cm.clsId, cm.stuId]);
  }
  console.log('✓ Class Students: Andi & Dewi → X TKJ 1 | Fajar & Gita → X TO 1');

  // ── 10. Exam ─────────────────────────────────────────────────────────────────
  const [[examType]] = await exec(`SELECT id FROM exam_types WHERE code = 'UTS'`);
  if (!examType) throw new Error('exam_type UTS tidak ditemukan!');

  const examId = id();
  await exec(
    `INSERT IGNORE INTO exams (id, academic_year_id, exam_type_id, name, semester, start_date, end_date, is_published) VALUES (?,?,?,?,?,?,?,?)`,
    [examId, ay.id, examType.id, 'UTS Ganjil 2026/2027', 'ganjil', today, dayAfter, true]
  );
  const [[exam]] = await exec(`SELECT id FROM exams WHERE name = 'UTS Ganjil 2026/2027' AND academic_year_id = ?`, [ay.id]);
  console.log('✓ Exam:', exam.id);

  // ── 11. Question Sets ─────────────────────────────────────────────────────────
  const qsBinId = id(); const qsMtkId = id();
  await exec(
    `INSERT IGNORE INTO question_sets (id, subject_id, teacher_id, title, instructions, duration_minutes, passing_score, show_result, status) VALUES (?,?,?,?,?,?,?,?,?)`,
    [qsBinId, sBin.id, tBin.id, 'Bahasa Indonesia: Ejaan dan Kosakata',
     'Bacalah setiap soal dengan teliti sebelum menjawab.',
     60, 70.00, true, 'ready']
  );
  await exec(
    `INSERT IGNORE INTO question_sets (id, subject_id, teacher_id, title, instructions, duration_minutes, passing_score, show_result, status) VALUES (?,?,?,?,?,?,?,?,?)`,
    [qsMtkId, sMtk.id, tMtk.id, 'Matematika: Aljabar Dasar',
     'Kerjakan semua soal. Tidak boleh menggunakan kalkulator.',
     90, 65.00, true, 'ready']
  );
  const [[qsBin]] = await exec(`SELECT id FROM question_sets WHERE title = 'Bahasa Indonesia: Ejaan dan Kosakata'`);
  const [[qsMtk]] = await exec(`SELECT id FROM question_sets WHERE title = 'Matematika: Aljabar Dasar'`);
  console.log('✓ Question Sets: BIN =', qsBin.id, '| MTK =', qsMtk.id);

  // ── 12. Questions + Options — Bahasa Indonesia ───────────────────────────────
  const binQuestions = [
    {
      text: 'Sinonim kata "pandai" adalah ...',
      opts: [
        { l: 'A', t: 'Bodoh',  c: false }, { l: 'B', t: 'Pintar', c: true  },
        { l: 'C', t: 'Malas',  c: false }, { l: 'D', t: 'Rajin',  c: false },
      ],
    },
    {
      text: 'Antonim kata "rajin" adalah ...',
      opts: [
        { l: 'A', t: 'Tekun',  c: false }, { l: 'B', t: 'Pandai', c: false },
        { l: 'C', t: 'Malas',  c: true  }, { l: 'D', t: 'Cepat',  c: false },
      ],
    },
    {
      text: 'Penulisan huruf kapital yang benar terdapat pada kalimat ...',
      opts: [
        { l: 'A', t: 'saya pergi ke jakarta kemarin',   c: false },
        { l: 'B', t: 'Saya pergi ke Jakarta kemarin.',  c: true  },
        { l: 'C', t: 'Saya Pergi Ke Jakarta Kemarin.',  c: false },
        { l: 'D', t: 'saya Pergi ke jakarta kemarin.',  c: false },
      ],
    },
    {
      text: 'Kalimat efektif adalah kalimat yang ...',
      opts: [
        { l: 'A', t: 'Menggunakan kata-kata yang indah dan panjang',               c: false },
        { l: 'B', t: 'Menyampaikan pesan dengan jelas, singkat, dan tidak ambigu', c: true  },
        { l: 'C', t: 'Memiliki banyak anak kalimat',                               c: false },
        { l: 'D', t: 'Selalu menggunakan bahasa baku',                             c: false },
      ],
    },
    {
      text: 'Kata "diskusi" berasal dari bahasa ...',
      opts: [
        { l: 'A', t: 'Belanda', c: false }, { l: 'B', t: 'Arab',    c: false },
        { l: 'C', t: 'Latin',   c: true  }, { l: 'D', t: 'Inggris', c: false },
      ],
    },
    {
      text: 'Tanda baca yang digunakan di akhir kalimat tanya adalah ...',
      opts: [
        { l: 'A', t: 'Titik (.)',       c: false }, { l: 'B', t: 'Koma (,)',         c: false },
        { l: 'C', t: 'Tanda tanya (?)', c: true  }, { l: 'D', t: 'Tanda seru (!)',   c: false },
      ],
    },
    {
      text: 'Paragraf yang kalimat utamanya terletak di awal paragraf disebut paragraf ...',
      opts: [
        { l: 'A', t: 'Induktif', c: false }, { l: 'B', t: 'Deduktif', c: true  },
        { l: 'C', t: 'Campuran', c: false }, { l: 'D', t: 'Naratif',  c: false },
      ],
    },
    {
      text: 'Kata baku dari "praktek" adalah ...',
      opts: [
        { l: 'A', t: 'Praktek', c: false }, { l: 'B', t: 'Praktik', c: true  },
        { l: 'C', t: 'Pratek',  c: false }, { l: 'D', t: 'Prektik', c: false },
      ],
    },
    {
      text: 'Imbuhan "me-" pada kata "menulis" berfungsi sebagai ...',
      opts: [
        { l: 'A', t: 'Awalan yang membentuk kata benda',        c: false },
        { l: 'B', t: 'Awalan yang membentuk kata kerja aktif',  c: true  },
        { l: 'C', t: 'Awalan yang membentuk kata sifat',        c: false },
        { l: 'D', t: 'Awalan yang membentuk kata keterangan',   c: false },
      ],
    },
    {
      text: 'Jelaskan perbedaan antara kalimat aktif dan kalimat pasif, serta berikan masing-masing 2 contoh!',
      type: 'essay',
      opts: [],
    },
  ];

  for (let i = 0; i < binQuestions.length; i++) {
    const q = binQuestions[i];
    const qId = id();
    await exec(
      `INSERT INTO questions (id, question_set_id, type, question_text, points, sort_order) VALUES (?,?,?,?,?,?)`,
      [qId, qsBin.id, q.type ?? 'multiple_choice', q.text, 10, i + 1]
    );
    for (let j = 0; j < q.opts.length; j++) {
      const o = q.opts[j];
      await exec(
        `INSERT INTO question_options (id, question_id, label, option_text, is_correct, sort_order) VALUES (?,?,?,?,?,?)`,
        [id(), qId, o.l, o.t, o.c ? 1 : 0, j]
      );
    }
  }
  console.log('✓ Questions BIN:', binQuestions.length, 'soal');

  // ── 13. Questions + Options — Matematika ─────────────────────────────────────
  const mtkQuestions = [
    {
      text: 'Hasil dari 3x + 5 = 14, nilai x adalah ...',
      opts: [
        { l: 'A', t: 'x = 2', c: false }, { l: 'B', t: 'x = 3', c: true  },
        { l: 'C', t: 'x = 4', c: false }, { l: 'D', t: 'x = 5', c: false },
      ],
    },
    {
      text: 'Bentuk sederhana dari 6a + 3a - 2a adalah ...',
      opts: [
        { l: 'A', t: '5a',  c: false }, { l: 'B', t: '7a',  c: true  },
        { l: 'C', t: '8a',  c: false }, { l: 'D', t: '11a', c: false },
      ],
    },
    {
      text: 'Jika 2x - 4 = 10, maka nilai x adalah ...',
      opts: [
        { l: 'A', t: 'x = 3', c: false }, { l: 'B', t: 'x = 5', c: false },
        { l: 'C', t: 'x = 7', c: true  }, { l: 'D', t: 'x = 9', c: false },
      ],
    },
    {
      text: 'Hasil dari (x + 3)(x - 2) adalah ...',
      opts: [
        { l: 'A', t: 'x² - 6',      c: false }, { l: 'B', t: 'x² + x - 6', c: true  },
        { l: 'C', t: 'x² - x - 6',  c: false }, { l: 'D', t: 'x² + 5x - 6',c: false },
      ],
    },
    {
      text: 'FPB dari 12 dan 18 adalah ...',
      opts: [
        { l: 'A', t: '3',  c: false }, { l: 'B', t: '6',  c: true  },
        { l: 'C', t: '9',  c: false }, { l: 'D', t: '12', c: false },
      ],
    },
    {
      text: 'KPK dari 4 dan 6 adalah ...',
      opts: [
        { l: 'A', t: '8',  c: false }, { l: 'B', t: '10', c: false },
        { l: 'C', t: '12', c: true  }, { l: 'D', t: '24', c: false },
      ],
    },
    {
      text: 'Nilai dari 2³ × 3 adalah ...',
      opts: [
        { l: 'A', t: '18', c: false }, { l: 'B', t: '24', c: true  },
        { l: 'C', t: '16', c: false }, { l: 'D', t: '48', c: false },
      ],
    },
    {
      text: 'Akar dari √144 adalah ...',
      opts: [
        { l: 'A', t: '10', c: false }, { l: 'B', t: '11', c: false },
        { l: 'C', t: '12', c: true  }, { l: 'D', t: '14', c: false },
      ],
    },
    {
      text: 'Persamaan garis lurus y = 2x + 1 memiliki gradien ...',
      opts: [
        { l: 'A', t: '1', c: false }, { l: 'B', t: '2', c: true  },
        { l: 'C', t: '3', c: false }, { l: 'D', t: '4', c: false },
      ],
    },
    {
      text: 'Selesaikan sistem persamaan: 2x + y = 7 dan x - y = 2. Tentukan nilai x dan y!',
      type: 'essay',
      opts: [],
    },
  ];

  for (let i = 0; i < mtkQuestions.length; i++) {
    const q = mtkQuestions[i];
    const qId = id();
    await exec(
      `INSERT INTO questions (id, question_set_id, type, question_text, points, sort_order) VALUES (?,?,?,?,?,?)`,
      [qId, qsMtk.id, q.type ?? 'multiple_choice', q.text, 10, i + 1]
    );
    for (let j = 0; j < q.opts.length; j++) {
      const o = q.opts[j];
      await exec(
        `INSERT INTO question_options (id, question_id, label, option_text, is_correct, sort_order) VALUES (?,?,?,?,?,?)`,
        [id(), qId, o.l, o.t, o.c ? 1 : 0, j]
      );
    }
  }
  console.log('✓ Questions MTK:', mtkQuestions.length, 'soal');

  // ── 14. Exam Schedules ────────────────────────────────────────────────────────
  await exec(
    `INSERT IGNORE INTO exam_schedules (id, exam_id, class_subject_id, question_set_id, exam_date, start_time, end_time, room, notes) VALUES (?,?,?,?,?,?,?,?,?)`,
    [id(), exam.id, csBinTkj1.id, qsBin.id, today,     '11:00:00', '12:30:00', 'R.101', 'UTS Bahasa Indonesia X TKJ 1']
  );
  await exec(
    `INSERT IGNORE INTO exam_schedules (id, exam_id, class_subject_id, question_set_id, exam_date, start_time, end_time, room, notes) VALUES (?,?,?,?,?,?,?,?,?)`,
    [id(), exam.id, csMtkTkj1.id, qsMtk.id, tomorrow,  '08:00:00', '09:30:00', 'R.102', 'UTS Matematika X TKJ 1']
  );
  await exec(
    `INSERT IGNORE INTO exam_schedules (id, exam_id, class_subject_id, question_set_id, exam_date, start_time, end_time, room, notes) VALUES (?,?,?,?,?,?,?,?,?)`,
    [id(), exam.id, csBinTo1.id,  qsBin.id, dayAfter,  '10:00:00', '11:30:00', 'R.103', 'UTS Bahasa Indonesia X TO 1']
  );
  console.log('✓ Exam Schedules: 3 jadwal (hari ini, besok, lusa)');

  // ── Summary ───────────────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════');
  console.log('  SEED SELESAI — Akun login:');
  console.log('════════════════════════════════════════');
  console.log('  Guru BIN  : guru_bin   / password');
  console.log('  Guru MTK  : guru_mtk   / password');
  console.log('  Siswa 1   : andi2026   / password  → X TKJ 1');
  console.log('  Siswa 2   : dewi2026   / password  → X TKJ 1');
  console.log('  Siswa 3   : fajar2026  / password  → X TO 1');
  console.log('  Siswa 4   : gita2026   / password  → X TO 1');
  console.log('────────────────────────────────────────');
  console.log('  Ujian BIN X TKJ 1 : HARI INI', today, '11:00–12:30 R.101');
  console.log('  Ujian MTK X TKJ 1 :', tomorrow, '08:00–09:30 R.102');
  console.log('  Ujian BIN X TO 1  :', dayAfter,  '10:00–11:30 R.103');
  console.log('════════════════════════════════════════\n');

  process.exit(0);
}

seed().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
