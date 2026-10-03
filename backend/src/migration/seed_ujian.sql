-- =========================================================
-- SEED DATA: UJIAN + SOAL UNTUK TESTING
-- Jalankan SETELAH schema.sql sudah dieksekusi
-- =========================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ─────────────────────────────────────────────────────────
-- Gunakan SET @var agar ID bisa direferensikan antar INSERT
-- ─────────────────────────────────────────────────────────

-- ── 1. Academic Year ──────────────────────────────────────
SET @ay_id = UUID();
INSERT INTO academic_years (id, name, start_date, end_date, is_active) VALUES
(@ay_id, '2026/2027', '2026-07-14', '2027-06-30', TRUE);

-- ── 2. Major ─────────────────────────────────────────────
SET @major_tkj  = UUID();
SET @major_to   = UUID();
INSERT INTO majors (id, code, name, description) VALUES
(@major_tkj, 'TKJ',  'Teknik Komputer dan Jaringan',  'Jurusan TKJ'),
(@major_to,  'TO',   'Teknik Otomotif',                'Jurusan TO');

-- ── 3. Classes ───────────────────────────────────────────
SET @class_x_tkj1 = UUID();
SET @class_x_to1  = UUID();
INSERT INTO classes (id, academic_year_id, major_id, name, grade_level, is_active) VALUES
(@class_x_tkj1, @ay_id, @major_tkj, 'X TKJ 1', 10, TRUE),
(@class_x_to1,  @ay_id, @major_to,  'X TO 1',  10, TRUE);

-- ── 4. Teacher user + teacher record ─────────────────────
SET @user_guru_bin = UUID();
SET @user_guru_mtk = UUID();
-- password = "password"
INSERT INTO users (id, role_id, username, email, password, is_active) VALUES
(@user_guru_bin,
 (SELECT id FROM roles WHERE name = 'teacher'),
 'guru_bin', 'guru.bin@sekolah.sch.id',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE),
(@user_guru_mtk,
 (SELECT id FROM roles WHERE name = 'teacher'),
 'guru_mtk', 'guru.mtk@sekolah.sch.id',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE);

SET @teacher_bin = UUID();
SET @teacher_mtk = UUID();
INSERT INTO teachers (id, user_id, teacher_number, full_name, gender) VALUES
(@teacher_bin, @user_guru_bin, 'GTK-001', 'Siti Rahayu, S.Pd.', 'Perempuan'),
(@teacher_mtk, @user_guru_mtk, 'GTK-002', 'Budi Santoso, S.Pd.',  'Laki-laki');

-- ── 5. Student users + student records ───────────────────
SET @user_andi    = UUID();
SET @user_dewi    = UUID();
SET @user_fajar   = UUID();
SET @user_gita    = UUID();
-- password = "password"
INSERT INTO users (id, role_id, username, email, password, is_active) VALUES
(@user_andi,  (SELECT id FROM roles WHERE name = 'student'), 'andi2026',  'andi@siswa.sch.id',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE),
(@user_dewi,  (SELECT id FROM roles WHERE name = 'student'), 'dewi2026',  'dewi@siswa.sch.id',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE),
(@user_fajar, (SELECT id FROM roles WHERE name = 'student'), 'fajar2026', 'fajar@siswa.sch.id', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE),
(@user_gita,  (SELECT id FROM roles WHERE name = 'student'), 'gita2026',  'gita@siswa.sch.id',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE);

SET @stu_andi  = UUID();
SET @stu_dewi  = UUID();
SET @stu_fajar = UUID();
SET @stu_gita  = UUID();
INSERT INTO students (id, user_id, student_number, full_name, gender, enrollment_year) VALUES
(@stu_andi,  @user_andi,  '2026001', 'Andi Prasetyo',   'Laki-laki',  2026),
(@stu_dewi,  @user_dewi,  '2026002', 'Dewi Anggraini',  'Perempuan',  2026),
(@stu_fajar, @user_fajar, '2026003', 'Fajar Ramadhan',  'Laki-laki',  2026),
(@stu_gita,  @user_gita,  '2026004', 'Gita Puspitasari','Perempuan',  2026);

-- ── 6. class_subjects ────────────────────────────────────
SET @cs_bin_tkj1 = UUID();
SET @cs_mtk_tkj1 = UUID();
SET @cs_bin_to1  = UUID();
INSERT INTO class_subjects (id, class_id, subject_id, teacher_id) VALUES
(@cs_bin_tkj1, @class_x_tkj1, (SELECT id FROM subjects WHERE code = 'BIN'), @teacher_bin),
(@cs_mtk_tkj1, @class_x_tkj1, (SELECT id FROM subjects WHERE code = 'MTK'), @teacher_mtk),
(@cs_bin_to1,  @class_x_to1,  (SELECT id FROM subjects WHERE code = 'BIN'), @teacher_bin);

-- ── 7. class_students (X TKJ 1: Andi & Dewi | X TO 1: Fajar & Gita) ────
INSERT INTO class_students (id, class_id, student_id) VALUES
(UUID(), @class_x_tkj1, @stu_andi),
(UUID(), @class_x_tkj1, @stu_dewi),
(UUID(), @class_x_to1,  @stu_fajar),
(UUID(), @class_x_to1,  @stu_gita);

-- ── 8. Exam (UTS Ganjil 2026/2027) ───────────────────────
SET @exam_uts = UUID();
INSERT INTO exams (id, academic_year_id, exam_type_id, name, semester, start_date, end_date, is_published) VALUES
(@exam_uts,
 @ay_id,
 (SELECT id FROM exam_types WHERE code = 'UTS'),
 'UTS Ganjil 2026/2027',
 'ganjil',
 '2026-10-01', '2026-10-07',
 TRUE);

-- ── 9. Question Sets ─────────────────────────────────────
SET @qs_bin = UUID();
SET @qs_mtk = UUID();
INSERT INTO question_sets
  (id, subject_id, teacher_id, title, description, instructions,
   duration_minutes, passing_score, shuffle_questions, shuffle_options, show_result, status)
VALUES
(@qs_bin,
 (SELECT id FROM subjects WHERE code = 'BIN'),
 @teacher_bin,
 'Bahasa Indonesia: Ejaan dan Kosakata',
 'Paket soal UTS Bahasa Indonesia kelas X',
 'Bacalah setiap soal dengan teliti sebelum menjawab.',
 60, 70.00, FALSE, FALSE, TRUE, 'ready'),

(@qs_mtk,
 (SELECT id FROM subjects WHERE code = 'MTK'),
 @teacher_mtk,
 'Matematika: Aljabar Dasar',
 'Paket soal UTS Matematika kelas X',
 'Kerjakan semua soal. Tidak boleh menggunakan kalkulator.',
 90, 65.00, FALSE, FALSE, TRUE, 'ready');

-- ── 10. Questions — Bahasa Indonesia ─────────────────────
SET @q_bin1 = UUID(); SET @q_bin2 = UUID(); SET @q_bin3 = UUID();
SET @q_bin4 = UUID(); SET @q_bin5 = UUID(); SET @q_bin6 = UUID();
SET @q_bin7 = UUID(); SET @q_bin8 = UUID(); SET @q_bin9 = UUID();
SET @q_bin10 = UUID();

INSERT INTO questions (id, question_set_id, type, question_text, points, sort_order) VALUES
(@q_bin1,  @qs_bin, 'multiple_choice', 'Sinonim kata "pandai" adalah ...', 10, 1),
(@q_bin2,  @qs_bin, 'multiple_choice', 'Antonim kata "rajin" adalah ...', 10, 2),
(@q_bin3,  @qs_bin, 'multiple_choice', 'Penulisan huruf kapital yang benar terdapat pada kalimat ...', 10, 3),
(@q_bin4,  @qs_bin, 'multiple_choice', 'Kalimat efektif adalah kalimat yang ...', 10, 4),
(@q_bin5,  @qs_bin, 'multiple_choice', 'Kata "diskusi" berasal dari bahasa ...', 10, 5),
(@q_bin6,  @qs_bin, 'multiple_choice', 'Tanda baca yang digunakan di akhir kalimat tanya adalah ...', 10, 6),
(@q_bin7,  @qs_bin, 'multiple_choice', 'Paragraf yang kalimat utamanya terletak di awal paragraf disebut paragraf ...', 10, 7),
(@q_bin8,  @qs_bin, 'multiple_choice', 'Kata baku dari "praktek" adalah ...', 10, 8),
(@q_bin9,  @qs_bin, 'multiple_choice', 'Imbuhan "me-" pada kata "menulis" berfungsi sebagai ...', 10, 9),
(@q_bin10, @qs_bin, 'essay',           'Jelaskan perbedaan antara kalimat aktif dan kalimat pasif, serta berikan masing-masing 2 contoh!', 10, 10);

-- Opsi soal 1 (sinonim pandai)
INSERT INTO question_options (id, question_id, label, option_text, is_correct, sort_order) VALUES
(UUID(), @q_bin1, 'A', 'Bodoh',   FALSE, 0),
(UUID(), @q_bin1, 'B', 'Pintar',  TRUE,  1),
(UUID(), @q_bin1, 'C', 'Malas',   FALSE, 2),
(UUID(), @q_bin1, 'D', 'Rajin',   FALSE, 3);

-- Opsi soal 2 (antonim rajin)
INSERT INTO question_options (id, question_id, label, option_text, is_correct, sort_order) VALUES
(UUID(), @q_bin2, 'A', 'Tekun',  FALSE, 0),
(UUID(), @q_bin2, 'B', 'Pandai', FALSE, 1),
(UUID(), @q_bin2, 'C', 'Malas',  TRUE,  2),
(UUID(), @q_bin2, 'D', 'Cepat',  FALSE, 3);

-- Opsi soal 3 (huruf kapital)
INSERT INTO question_options (id, question_id, label, option_text, is_correct, sort_order) VALUES
(UUID(), @q_bin3, 'A', 'saya pergi ke jakarta kemarin',     FALSE, 0),
(UUID(), @q_bin3, 'B', 'Saya pergi ke Jakarta kemarin.',    TRUE,  1),
(UUID(), @q_bin3, 'C', 'Saya Pergi Ke Jakarta Kemarin.',    FALSE, 2),
(UUID(), @q_bin3, 'D', 'saya Pergi ke jakarta kemarin.',    FALSE, 3);

-- Opsi soal 4 (kalimat efektif)
INSERT INTO question_options (id, question_id, label, option_text, is_correct, sort_order) VALUES
(UUID(), @q_bin4, 'A', 'Menggunakan kata-kata yang indah dan panjang',              FALSE, 0),
(UUID(), @q_bin4, 'B', 'Menyampaikan pesan dengan jelas, singkat, dan tidak ambigu', TRUE,  1),
(UUID(), @q_bin4, 'C', 'Memiliki banyak anak kalimat',                              FALSE, 2),
(UUID(), @q_bin4, 'D', 'Selalu menggunakan bahasa baku',                            FALSE, 3);

-- Opsi soal 5 (diskusi)
INSERT INTO question_options (id, question_id, label, option_text, is_correct, sort_order) VALUES
(UUID(), @q_bin5, 'A', 'Belanda',  FALSE, 0),
(UUID(), @q_bin5, 'B', 'Arab',     FALSE, 1),
(UUID(), @q_bin5, 'C', 'Latin',    TRUE,  2),
(UUID(), @q_bin5, 'D', 'Inggris',  FALSE, 3);

-- Opsi soal 6 (tanda tanya)
INSERT INTO question_options (id, question_id, label, option_text, is_correct, sort_order) VALUES
(UUID(), @q_bin6, 'A', 'Titik (.)',         FALSE, 0),
(UUID(), @q_bin6, 'B', 'Koma (,)',          FALSE, 1),
(UUID(), @q_bin6, 'C', 'Tanda tanya (?)',   TRUE,  2),
(UUID(), @q_bin6, 'D', 'Tanda seru (!)',    FALSE, 3);

-- Opsi soal 7 (paragraf deduktif)
INSERT INTO question_options (id, question_id, label, option_text, is_correct, sort_order) VALUES
(UUID(), @q_bin7, 'A', 'Induktif',   FALSE, 0),
(UUID(), @q_bin7, 'B', 'Deduktif',   TRUE,  1),
(UUID(), @q_bin7, 'C', 'Campuran',   FALSE, 2),
(UUID(), @q_bin7, 'D', 'Naratif',    FALSE, 3);

-- Opsi soal 8 (kata baku praktek)
INSERT INTO question_options (id, question_id, label, option_text, is_correct, sort_order) VALUES
(UUID(), @q_bin8, 'A', 'Praktek',   FALSE, 0),
(UUID(), @q_bin8, 'B', 'Praktik',   TRUE,  1),
(UUID(), @q_bin8, 'C', 'Pratek',    FALSE, 2),
(UUID(), @q_bin8, 'D', 'Prektik',   FALSE, 3);

-- Opsi soal 9 (imbuhan me-)
INSERT INTO question_options (id, question_id, label, option_text, is_correct, sort_order) VALUES
(UUID(), @q_bin9, 'A', 'Awalan yang membentuk kata benda',         FALSE, 0),
(UUID(), @q_bin9, 'B', 'Awalan yang membentuk kata kerja aktif',   TRUE,  1),
(UUID(), @q_bin9, 'C', 'Awalan yang membentuk kata sifat',         FALSE, 2),
(UUID(), @q_bin9, 'D', 'Awalan yang membentuk kata keterangan',    FALSE, 3);

-- ── 11. Questions — Matematika ────────────────────────────
SET @q_mtk1 = UUID(); SET @q_mtk2 = UUID(); SET @q_mtk3 = UUID();
SET @q_mtk4 = UUID(); SET @q_mtk5 = UUID(); SET @q_mtk6 = UUID();
SET @q_mtk7 = UUID(); SET @q_mtk8 = UUID(); SET @q_mtk9 = UUID();
SET @q_mtk10 = UUID();

INSERT INTO questions (id, question_set_id, type, question_text, points, sort_order) VALUES
(@q_mtk1,  @qs_mtk, 'multiple_choice', 'Hasil dari 3x + 5 = 14 adalah ...', 10, 1),
(@q_mtk2,  @qs_mtk, 'multiple_choice', 'Bentuk sederhana dari 6a + 3a - 2a adalah ...', 10, 2),
(@q_mtk3,  @qs_mtk, 'multiple_choice', 'Jika 2x - 4 = 10, maka nilai x adalah ...', 10, 3),
(@q_mtk4,  @qs_mtk, 'multiple_choice', 'Hasil dari (x + 3)(x - 2) adalah ...', 10, 4),
(@q_mtk5,  @qs_mtk, 'multiple_choice', 'FPB dari 12 dan 18 adalah ...', 10, 5),
(@q_mtk6,  @qs_mtk, 'multiple_choice', 'KPK dari 4 dan 6 adalah ...', 10, 6),
(@q_mtk7,  @qs_mtk, 'multiple_choice', 'Nilai dari 2³ × 3 adalah ...', 10, 7),
(@q_mtk8,  @qs_mtk, 'multiple_choice', 'Akar dari √144 adalah ...', 10, 8),
(@q_mtk9,  @qs_mtk, 'multiple_choice', 'Persamaan garis lurus y = 2x + 1 memiliki gradien ...', 10, 9),
(@q_mtk10, @qs_mtk, 'essay', 'Selesaikan sistem persamaan berikut dan tentukan nilai x dan y:\n  2x + y = 7\n  x - y = 2', 10, 10);

-- Opsi MTK 1 (3x+5=14 → x=3)
INSERT INTO question_options (id, question_id, label, option_text, is_correct, sort_order) VALUES
(UUID(), @q_mtk1, 'A', 'x = 2', FALSE, 0),
(UUID(), @q_mtk1, 'B', 'x = 3', TRUE,  1),
(UUID(), @q_mtk1, 'C', 'x = 4', FALSE, 2),
(UUID(), @q_mtk1, 'D', 'x = 5', FALSE, 3);

-- Opsi MTK 2 (6a+3a-2a=7a)
INSERT INTO question_options (id, question_id, label, option_text, is_correct, sort_order) VALUES
(UUID(), @q_mtk2, 'A', '5a',  FALSE, 0),
(UUID(), @q_mtk2, 'B', '7a',  TRUE,  1),
(UUID(), @q_mtk2, 'C', '8a',  FALSE, 2),
(UUID(), @q_mtk2, 'D', '11a', FALSE, 3);

-- Opsi MTK 3 (2x-4=10 → x=7)
INSERT INTO question_options (id, question_id, label, option_text, is_correct, sort_order) VALUES
(UUID(), @q_mtk3, 'A', 'x = 3', FALSE, 0),
(UUID(), @q_mtk3, 'B', 'x = 5', FALSE, 1),
(UUID(), @q_mtk3, 'C', 'x = 7', TRUE,  2),
(UUID(), @q_mtk3, 'D', 'x = 9', FALSE, 3);

-- Opsi MTK 4 ((x+3)(x-2) = x²+x-6)
INSERT INTO question_options (id, question_id, label, option_text, is_correct, sort_order) VALUES
(UUID(), @q_mtk4, 'A', 'x² - 6',     FALSE, 0),
(UUID(), @q_mtk4, 'B', 'x² + x - 6', TRUE,  1),
(UUID(), @q_mtk4, 'C', 'x² - x - 6', FALSE, 2),
(UUID(), @q_mtk4, 'D', 'x² + 5x - 6',FALSE, 3);

-- Opsi MTK 5 (FPB 12,18 = 6)
INSERT INTO question_options (id, question_id, label, option_text, is_correct, sort_order) VALUES
(UUID(), @q_mtk5, 'A', '3',  FALSE, 0),
(UUID(), @q_mtk5, 'B', '6',  TRUE,  1),
(UUID(), @q_mtk5, 'C', '9',  FALSE, 2),
(UUID(), @q_mtk5, 'D', '12', FALSE, 3);

-- Opsi MTK 6 (KPK 4,6 = 12)
INSERT INTO question_options (id, question_id, label, option_text, is_correct, sort_order) VALUES
(UUID(), @q_mtk6, 'A', '8',  FALSE, 0),
(UUID(), @q_mtk6, 'B', '10', FALSE, 1),
(UUID(), @q_mtk6, 'C', '12', TRUE,  2),
(UUID(), @q_mtk6, 'D', '24', FALSE, 3);

-- Opsi MTK 7 (2³×3 = 24)
INSERT INTO question_options (id, question_id, label, option_text, is_correct, sort_order) VALUES
(UUID(), @q_mtk7, 'A', '18', FALSE, 0),
(UUID(), @q_mtk7, 'B', '24', TRUE,  1),
(UUID(), @q_mtk7, 'C', '16', FALSE, 2),
(UUID(), @q_mtk7, 'D', '48', FALSE, 3);

-- Opsi MTK 8 (√144 = 12)
INSERT INTO question_options (id, question_id, label, option_text, is_correct, sort_order) VALUES
(UUID(), @q_mtk8, 'A', '10', FALSE, 0),
(UUID(), @q_mtk8, 'B', '11', FALSE, 1),
(UUID(), @q_mtk8, 'C', '12', TRUE,  2),
(UUID(), @q_mtk8, 'D', '14', FALSE, 3);

-- Opsi MTK 9 (gradien y=2x+1 = 2)
INSERT INTO question_options (id, question_id, label, option_text, is_correct, sort_order) VALUES
(UUID(), @q_mtk9, 'A', '1', FALSE, 0),
(UUID(), @q_mtk9, 'B', '2', TRUE,  1),
(UUID(), @q_mtk9, 'C', '3', FALSE, 2),
(UUID(), @q_mtk9, 'D', '4', FALSE, 3);

-- ── 12. Exam Schedules ────────────────────────────────────
-- Bahasa Indonesia — X TKJ 1 (hari ini, jam 11:00 - 12:30)
SET @es_bin_tkj1 = UUID();
SET @es_mtk_tkj1 = UUID();
SET @es_bin_to1  = UUID();

INSERT INTO exam_schedules
  (id, exam_id, class_subject_id, question_set_id, exam_date, start_time, end_time, room, notes)
VALUES
-- BIN X TKJ 1
(@es_bin_tkj1, @exam_uts, @cs_bin_tkj1, @qs_bin,
 CURDATE(), '11:00:00', '12:30:00', 'R.101',
 'UTS Bahasa Indonesia X TKJ 1'),

-- MTK X TKJ 1
(@es_mtk_tkj1, @exam_uts, @cs_mtk_tkj1, @qs_mtk,
 DATE_ADD(CURDATE(), INTERVAL 1 DAY), '08:00:00', '09:30:00', 'R.102',
 'UTS Matematika X TKJ 1'),

-- BIN X TO 1
(@es_bin_to1, @exam_uts, @cs_bin_to1, @qs_bin,
 DATE_ADD(CURDATE(), INTERVAL 2 DAY), '10:00:00', '11:30:00', 'R.103',
 'UTS Bahasa Indonesia X TO 1');

SET FOREIGN_KEY_CHECKS = 1;

-- ── Summary ───────────────────────────────────────────────
SELECT 'SEED SELESAI' AS status;
SELECT 'Academic Year' AS tabel, COUNT(*) AS jumlah FROM academic_years
UNION ALL SELECT 'Majors',         COUNT(*) FROM majors
UNION ALL SELECT 'Classes',        COUNT(*) FROM classes
UNION ALL SELECT 'Teachers',       COUNT(*) FROM teachers
UNION ALL SELECT 'Students',       COUNT(*) FROM students
UNION ALL SELECT 'Class Subjects', COUNT(*) FROM class_subjects
UNION ALL SELECT 'Class Students', COUNT(*) FROM class_students
UNION ALL SELECT 'Exams',          COUNT(*) FROM exams
UNION ALL SELECT 'Question Sets',  COUNT(*) FROM question_sets
UNION ALL SELECT 'Questions',      COUNT(*) FROM questions
UNION ALL SELECT 'Options',        COUNT(*) FROM question_options
UNION ALL SELECT 'Exam Schedules', COUNT(*) FROM exam_schedules;
