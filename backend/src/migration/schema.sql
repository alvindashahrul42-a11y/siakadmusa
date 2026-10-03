-- =========================================================
-- DATABASE: SIAKADMUSA
-- LANDING PAGE + AUTH
-- MariaDB / MySQL
-- =========================================================


-- =========================================================
-- 1. TABLE: roles
-- =========================================================

CREATE TABLE roles (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- DEFAULT ROLES
-- =========================================================

INSERT INTO roles (id, name, description) VALUES
(UUID(), 'superuser', 'Full access to the entire system'),
(UUID(), 'admin', 'Manage system and application data'),
(UUID(), 'teacher', 'Teacher user'),
(UUID(), 'student', 'Student user'),
(UUID(), 'candidate', 'Candidate user');


-- =========================================================
-- 2. TABLE: users
-- =========================================================

CREATE TABLE users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    role_id CHAR(36) NOT NULL,

    username VARCHAR(100) UNIQUE,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    last_login_at TIMESTAMP NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


-- =========================================================
-- DEFAULT USERS
-- password = "password" (bcrypt hash)
-- =========================================================

INSERT INTO users (id, role_id, username, email, password, is_active) VALUES
(UUID(), (SELECT id FROM roles WHERE name = 'superuser'), 'superuser', 'superuser@gmail.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE),
(UUID(), (SELECT id FROM roles WHERE name = 'admin'),     'admin',     'admin@gmail.com',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE),
(UUID(), (SELECT id FROM roles WHERE name = 'teacher'),   'teacher',   'teacher@gmail.com',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE),
(UUID(), (SELECT id FROM roles WHERE name = 'student'),   'student',   'student@gmail.com',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE),
(UUID(), (SELECT id FROM roles WHERE name = 'candidate'), 'candidate', 'candidate@gmail.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE);


-- =========================================================
-- 3. TABLE: students
-- =========================================================

CREATE TABLE students (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    user_id CHAR(36) NOT NULL UNIQUE,

    student_number VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,

    gender VARCHAR(20),
    birth_place VARCHAR(100),
    birth_date DATE,

    phone VARCHAR(30),
    address TEXT,

    enrollment_year YEAR,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_students_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- =========================================================
-- 4. TABLE: teachers
-- =========================================================

CREATE TABLE teachers (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    user_id CHAR(36) NOT NULL UNIQUE,

    teacher_number VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,

    gender VARCHAR(20),
    birth_place VARCHAR(100),
    birth_date DATE,

    phone VARCHAR(30),
    address TEXT,

    subject VARCHAR(150),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_teachers_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- =========================================================
-- 5. TABLE: school_profile
-- =========================================================

CREATE TABLE school_profile (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    school_name VARCHAR(200) NOT NULL,
    tagline VARCHAR(255),
    description TEXT,

    logo VARCHAR(500),

    address TEXT,
    phone VARCHAR(30),
    email VARCHAR(150),
    website VARCHAR(255),

    vision TEXT,
    mission TEXT,

    instagram VARCHAR(255),
    facebook VARCHAR(255),
    youtube VARCHAR(255),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 6. TABLE: hero_slides
-- =========================================================

CREATE TABLE hero_slides (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    title VARCHAR(200) NOT NULL,
    subtitle VARCHAR(255),
    description TEXT,

    image VARCHAR(500) NOT NULL,

    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 7. TABLE: school_programs
-- =========================================================

CREATE TABLE school_programs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    name VARCHAR(150) NOT NULL,
    description TEXT,
    image VARCHAR(500),

    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 8. TABLE: school_facilities
-- =========================================================

CREATE TABLE school_facilities (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    name VARCHAR(150) NOT NULL,
    description TEXT,
    image VARCHAR(500),

    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 9. TABLE: extracurriculars
-- =========================================================

CREATE TABLE extracurriculars (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    name VARCHAR(150) NOT NULL,
    image VARCHAR(500) NOT NULL,

    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 10. TABLE: school_activities
-- =========================================================

CREATE TABLE school_activities (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    title VARCHAR(200) NOT NULL,
    description TEXT,
    image VARCHAR(500),

    activity_date DATE,

    sort_order INT NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 11. TABLE: school_achievements
-- =========================================================

CREATE TABLE school_achievements (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    title VARCHAR(200) NOT NULL,
    description TEXT,

    category VARCHAR(100),
    level VARCHAR(50),

    student_name VARCHAR(150),
    achievement_date DATE,

    image VARCHAR(500),

    sort_order INT NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 12. TABLE: articles
-- =========================================================

CREATE TABLE articles (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,

    excerpt TEXT,
    content LONGTEXT,

    thumbnail VARCHAR(500),

    category VARCHAR(100),

    author_id CHAR(36),

    published_at DATETIME NULL,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_articles_author
        FOREIGN KEY (author_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);


-- =========================================================
-- 13. TABLE: activity_logs
-- =========================================================

CREATE TABLE activity_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    user_id CHAR(36) NULL,

    action VARCHAR(50) NOT NULL,
    module VARCHAR(100) NOT NULL,
    description TEXT,

    ip_address VARCHAR(45),
    user_agent TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_activity_logs_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);


-- =========================================================
-- 14. TABLE: ppdb_registrations
--     Step 2–4 + Step 3 data utama kandidat
-- =========================================================

CREATE TABLE ppdb_registrations (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    user_id CHAR(36) NOT NULL UNIQUE,

    -- Step 2: Didaftarkan Oleh
    registered_by ENUM('diri_sendiri', 'ayah', 'ibu', 'saudara', 'guru') NOT NULL,

    -- Step 3: Pendidikan
    major ENUM('TKJ', 'teknik_otomotif') NOT NULL,
    education_system ENUM('reguler', 'pondok', 'panti') NOT NULL,

    -- Step 4: Identitas
    nik VARCHAR(16) NOT NULL,
    nisn VARCHAR(10) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    nickname VARCHAR(100) NULL,
    nationality VARCHAR(100) NOT NULL DEFAULT 'WNI',
    birth_place VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    gender ENUM('laki-laki', 'perempuan') NOT NULL,
    religion ENUM('islam', 'kristen', 'katolik', 'hindu', 'buddha', 'konghucu') NOT NULL,
    family_status ENUM('yatim', 'piatu', 'yatim_piatu', 'lengkap', 'lainnya') NOT NULL,

    -- Step 4: Status Dalam Keluarga
    child_order TINYINT UNSIGNED NOT NULL,
    total_siblings TINYINT UNSIGNED NOT NULL,
    total_biological_siblings TINYINT UNSIGNED NOT NULL,
    total_step_siblings TINYINT UNSIGNED NULL,
    total_adopted_siblings TINYINT UNSIGNED NULL,

    -- Step 4: Asal Sekolah
    school_origin VARCHAR(200) NOT NULL,
    study_duration TINYINT UNSIGNED NOT NULL COMMENT 'dalam tahun',
    diploma_number VARCHAR(100) NOT NULL,
    diploma_date DATE NOT NULL,
    npsn VARCHAR(20) NOT NULL,

    -- Step 4: KIP
    has_kip BOOLEAN NULL DEFAULT FALSE,
    kip_number VARCHAR(50) NULL,

    -- Step 4: Informasi Lainnya
    living_status VARCHAR(100) NOT NULL COMMENT 'tinggal bersama / kos / panti dll',
    daily_language VARCHAR(100) NOT NULL,
    siblings_in_school TINYINT UNSIGNED NULL DEFAULT 0,
    transportation VARCHAR(100) NOT NULL,
    distance_to_school DECIMAL(6,2) NOT NULL COMMENT 'km',
    travel_time DECIMAL(4,2) NOT NULL COMMENT 'jam',
    photo VARCHAR(500) NOT NULL COMMENT 'pas foto 3x4',

    -- Step 4: Kontak & Alamat
    phone VARCHAR(20) NOT NULL,
    contact_email VARCHAR(150) NULL,
    province VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    village VARCHAR(100) NOT NULL,
    rt CHAR(3) NOT NULL,
    rw CHAR(3) NOT NULL,
    full_address TEXT NOT NULL,

    -- Status pendaftaran
    registration_status ENUM('draft', 'submitted', 'verified', 'accepted', 'rejected') NOT NULL DEFAULT 'draft',
    current_step TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'step terakhir yang diselesaikan',
    submitted_at DATETIME NULL,
    verified_at DATETIME NULL,
    verified_by CHAR(36) NULL,
    notes TEXT NULL COMMENT 'catatan admin saat verifikasi/penolakan',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_ppdb_reg_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_ppdb_reg_verifier
        FOREIGN KEY (verified_by)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);


-- =========================================================
-- 15. TABLE: ppdb_health
--     Step 5: Data Kesehatan (semua opsional)
-- =========================================================

CREATE TABLE ppdb_health (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    registration_id CHAR(36) NOT NULL UNIQUE,

    health_history TEXT NULL,
    disability TEXT NULL,
    height DECIMAL(5,2) NULL COMMENT 'cm',
    weight DECIMAL(5,2) NULL COMMENT 'kg',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_ppdb_health_reg
        FOREIGN KEY (registration_id)
        REFERENCES ppdb_registrations(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- =========================================================
-- 16. TABLE: ppdb_documents
--     Step 6: Upload Dokumen
-- =========================================================

CREATE TABLE ppdb_documents (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    registration_id CHAR(36) NOT NULL UNIQUE,

    kk_document VARCHAR(500) NOT NULL COMMENT 'Kartu Keluarga (PDF/JPG/PNG)',
    diploma_document VARCHAR(500) NOT NULL COMMENT 'Ijazah / SKL (PDF/JPG/PNG)',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_ppdb_docs_reg
        FOREIGN KEY (registration_id)
        REFERENCES ppdb_registrations(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- =========================================================
-- 17. TABLE: ppdb_achievements
--     Step 7: Prestasi (multiple, semua opsional)
-- =========================================================

CREATE TABLE ppdb_achievements (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    registration_id CHAR(36) NOT NULL,

    achievement_name VARCHAR(200) NOT NULL,
    document VARCHAR(500) NULL COMMENT 'bukti dokumen prestasi',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_ppdb_ach_reg
        FOREIGN KEY (registration_id)
        REFERENCES ppdb_registrations(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- =========================================================
-- 18. TABLE: ppdb_parents
--     Step 8: Data Orang Tua (ayah & ibu)
-- =========================================================

CREATE TABLE ppdb_parents (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    registration_id CHAR(36) NOT NULL,

    parent_type ENUM('ayah', 'ibu') NOT NULL,

    full_name VARCHAR(150) NOT NULL,
    nik VARCHAR(16) NOT NULL,
    education VARCHAR(100) NOT NULL,
    occupation VARCHAR(150) NOT NULL,
    marital_status ENUM('menikah', 'cerai_hidup', 'cerai_mati', 'lainnya') NOT NULL,
    phone VARCHAR(20) NOT NULL,
    birth_place VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    nationality VARCHAR(100) NOT NULL DEFAULT 'WNI',
    religion ENUM('islam', 'kristen', 'katolik', 'hindu', 'buddha', 'konghucu') NOT NULL,

    -- Penghasilan (satu baris per pasang orang tua, disimpan di ayah saja atau row terpisah)
    monthly_income DECIMAL(15,2) NULL COMMENT 'penghasilan per bulan',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_ppdb_parents_reg
        FOREIGN KEY (registration_id)
        REFERENCES ppdb_registrations(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    UNIQUE KEY uq_ppdb_parents_type (registration_id, parent_type)
);


-- =========================================================
-- INDEX
-- =========================================================

-- =========================================================
-- 19. TABLE: academic_years
-- =========================================================

CREATE TABLE academic_years (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(20) NOT NULL UNIQUE COMMENT 'contoh: 2026/2027',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- =========================================================
-- 20. TABLE: majors
-- =========================================================

CREATE TABLE majors (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    code VARCHAR(20) NOT NULL UNIQUE COMMENT 'contoh: TKJ, TO',
    name VARCHAR(150) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- =========================================================
-- 21. TABLE: classes
-- =========================================================

CREATE TABLE classes (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    academic_year_id CHAR(36) NOT NULL,
    major_id CHAR(36) NULL,
    homeroom_teacher_id CHAR(36) NULL COMMENT 'wali kelas',
    name VARCHAR(100) NOT NULL COMMENT 'contoh: X TKJ 1',
    grade_level TINYINT UNSIGNED NOT NULL COMMENT '10, 11, 12',
    capacity SMALLINT UNSIGNED NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_classes_year
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_classes_major
        FOREIGN KEY (major_id) REFERENCES majors(id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_classes_homeroom
        FOREIGN KEY (homeroom_teacher_id) REFERENCES teachers(id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    UNIQUE KEY uq_classes_year_name (academic_year_id, name)
);


-- =========================================================
-- 22. TABLE: class_students
-- =========================================================

CREATE TABLE class_students (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    class_id CHAR(36) NOT NULL,
    student_id CHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_class_students_class
        FOREIGN KEY (class_id) REFERENCES classes(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_class_students_student
        FOREIGN KEY (student_id) REFERENCES students(id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    UNIQUE KEY uq_class_student (class_id, student_id)
);


-- =========================================================
-- INDEX (new tables)
-- =========================================================

CREATE INDEX idx_classes_year ON classes(academic_year_id);
CREATE INDEX idx_classes_major ON classes(major_id);
CREATE INDEX idx_classes_homeroom ON classes(homeroom_teacher_id);
CREATE INDEX idx_class_students_student ON class_students(student_id);
CREATE INDEX idx_class_students_class ON class_students(class_id);


-- =========================================================
-- (existing indexes continue below)
-- =========================================================

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_module ON activity_logs(module);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_email ON users(email);

CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_teachers_user_id ON teachers(user_id);

CREATE INDEX idx_articles_author_id ON articles(author_id);
CREATE INDEX idx_articles_slug ON articles(slug);

CREATE INDEX idx_hero_slides_sort_order ON hero_slides(sort_order);
CREATE INDEX idx_school_programs_sort_order ON school_programs(sort_order);
CREATE INDEX idx_school_facilities_sort_order ON school_facilities(sort_order);
CREATE INDEX idx_extracurriculars_sort_order ON extracurriculars(sort_order);
CREATE INDEX idx_school_activities_sort_order ON school_activities(sort_order);
CREATE INDEX idx_school_achievements_sort_order ON school_achievements(sort_order);

-- PPDB indexes
CREATE INDEX idx_ppdb_reg_user_id ON ppdb_registrations(user_id);
CREATE INDEX idx_ppdb_reg_status ON ppdb_registrations(registration_status);
CREATE INDEX idx_ppdb_reg_major ON ppdb_registrations(major);
CREATE INDEX idx_ppdb_reg_nik ON ppdb_registrations(nik);
CREATE INDEX idx_ppdb_reg_nisn ON ppdb_registrations(nisn);
CREATE INDEX idx_ppdb_reg_verified_by ON ppdb_registrations(verified_by);

CREATE INDEX idx_ppdb_health_reg_id ON ppdb_health(registration_id);
CREATE INDEX idx_ppdb_docs_reg_id ON ppdb_documents(registration_id);
CREATE INDEX idx_ppdb_ach_reg_id ON ppdb_achievements(registration_id);
CREATE INDEX idx_ppdb_parents_reg_id ON ppdb_parents(registration_id);


-- =========================================================
-- 23. TABLE: subjects
-- MASTER MATA PELAJARAN
-- =========================================================

CREATE TABLE subjects (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- DEFAULT SUBJECTS
-- =========================================================

INSERT INTO subjects (id, code, name, description) VALUES
(UUID(), 'MTK',  'Matematika',                         'Mata pelajaran Matematika'),
(UUID(), 'BIN',  'Bahasa Indonesia',                   'Mata pelajaran Bahasa Indonesia'),
(UUID(), 'BING', 'Bahasa Inggris',                     'Mata pelajaran Bahasa Inggris'),
(UUID(), 'PAI',  'Pendidikan Agama Islam',              'Mata pelajaran Pendidikan Agama Islam'),
(UUID(), 'PKN',  'Pendidikan Pancasila',                'Mata pelajaran Pendidikan Pancasila'),
(UUID(), 'TKJ',  'Dasar-Dasar Teknik Jaringan Komputer','Mata pelajaran kejuruan TKJ');

-- =========================================================
-- 24. TABLE: class_subjects
-- RELASI KELAS + MATA PELAJARAN + GURU
-- =========================================================

CREATE TABLE class_subjects (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    class_id CHAR(36) NOT NULL,
    subject_id CHAR(36) NOT NULL,
    teacher_id CHAR(36) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_class_subjects_class
        FOREIGN KEY (class_id)   REFERENCES classes(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_class_subjects_subject
        FOREIGN KEY (subject_id) REFERENCES subjects(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_class_subjects_teacher
        FOREIGN KEY (teacher_id) REFERENCES teachers(id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    UNIQUE KEY uq_class_subject (class_id, subject_id)
);

-- =========================================================
-- 25. TABLE: schedules
-- JADWAL PELAJARAN
-- =========================================================

CREATE TABLE schedules (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    class_subject_id CHAR(36) NOT NULL,
    day_of_week TINYINT UNSIGNED NOT NULL
        COMMENT '1=Senin, 2=Selasa, 3=Rabu, 4=Kamis, 5=Jumat, 6=Sabtu',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(100) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_schedules_class_subject
        FOREIGN KEY (class_subject_id) REFERENCES class_subjects(id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- =========================================================
-- 26. TABLE: attendance
-- ABSENSI SISWA PER MATA PELAJARAN
-- =========================================================

CREATE TABLE attendance (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    class_subject_id CHAR(36) NOT NULL,
    student_id CHAR(36) NOT NULL,
    attendance_date DATE NOT NULL,
    status ENUM('present','late','sick','permission','absent') NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_attendance_class_subject
        FOREIGN KEY (class_subject_id) REFERENCES class_subjects(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_attendance_student
        FOREIGN KEY (student_id) REFERENCES students(id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    UNIQUE KEY uq_attendance (class_subject_id, student_id, attendance_date)
);

-- =========================================================
-- 27. TABLE: assignments
-- TUGAS SISWA
-- =========================================================

CREATE TABLE assignments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    class_subject_id CHAR(36) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    due_date DATETIME NULL,
    attachment VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_assignments_class_subject
        FOREIGN KEY (class_subject_id) REFERENCES class_subjects(id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- =========================================================
-- 28. TABLE: grades
-- NILAI SISWA
-- =========================================================

CREATE TABLE grades (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    class_subject_id CHAR(36) NOT NULL,
    student_id CHAR(36) NOT NULL,
    assignment_score DECIMAL(5,2) NULL,
    midterm_score DECIMAL(5,2) NULL,
    final_exam_score DECIMAL(5,2) NULL,
    final_score DECIMAL(5,2) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_grades_class_subject
        FOREIGN KEY (class_subject_id) REFERENCES class_subjects(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_grades_student
        FOREIGN KEY (student_id) REFERENCES students(id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    UNIQUE KEY uq_grade_student_subject (class_subject_id, student_id)
);

-- =========================================================
-- INDEX (tables 23–28)
-- =========================================================

CREATE INDEX idx_subjects_name          ON subjects(name);
CREATE INDEX idx_class_subjects_class   ON class_subjects(class_id);
CREATE INDEX idx_class_subjects_subject ON class_subjects(subject_id);
CREATE INDEX idx_class_subjects_teacher ON class_subjects(teacher_id);
CREATE INDEX idx_schedules_class_subject ON schedules(class_subject_id);
CREATE INDEX idx_schedules_day          ON schedules(day_of_week);
CREATE INDEX idx_attendance_student     ON attendance(student_id);
CREATE INDEX idx_attendance_date        ON attendance(attendance_date);
CREATE INDEX idx_attendance_class_subject ON attendance(class_subject_id);
CREATE INDEX idx_assignments_class_subject ON assignments(class_subject_id);
CREATE INDEX idx_assignments_due_date   ON assignments(due_date);
CREATE INDEX idx_grades_student         ON grades(student_id);
CREATE INDEX idx_grades_class_subject   ON grades(class_subject_id);

-- =========================================================
-- REMOVE subject COLUMN FROM teachers
-- (Run only if the column still exists)
-- =========================================================

ALTER TABLE teachers DROP COLUMN subject;


-- =========================================================
-- ALTER: activity_logs — tambah kolom detail request/response
-- Jalankan jika tabel sudah ada (setelah migrasi awal)
-- =========================================================

ALTER TABLE activity_logs
  ADD COLUMN IF NOT EXISTS method       VARCHAR(10)  NULL AFTER description,
  ADD COLUMN IF NOT EXISTS endpoint     VARCHAR(500) NULL AFTER method,
  ADD COLUMN IF NOT EXISTS status_code  SMALLINT     NULL AFTER endpoint,
  ADD COLUMN IF NOT EXISTS browser      VARCHAR(100) NULL AFTER status_code,
  ADD COLUMN IF NOT EXISTS os           VARCHAR(100) NULL AFTER browser,
  ADD COLUMN IF NOT EXISTS device_type  VARCHAR(30)  NULL AFTER os;

CREATE INDEX IF NOT EXISTS idx_activity_logs_method      ON activity_logs(method);
CREATE INDEX IF NOT EXISTS idx_activity_logs_device_type ON activity_logs(device_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_status_code ON activity_logs(status_code);

-- =========================================================
-- ALTER: activity_logs — tambah kolom request_body & old_data
-- =========================================================

ALTER TABLE activity_logs
  ADD COLUMN IF NOT EXISTS request_body LONGTEXT NULL AFTER device_type
    COMMENT 'JSON body yang dikirim (POST/PUT/PATCH) — password disensor',
  ADD COLUMN IF NOT EXISTS old_data     LONGTEXT NULL AFTER request_body
    COMMENT 'Data sebelum diubah/dihapus (PUT/PATCH/DELETE)';


-- =========================================================
-- 29. TABLE: exam_types
-- MASTER JENIS UJIAN (UTS, UAS, dll)
-- =========================================================

CREATE TABLE exam_types (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    code VARCHAR(20) NOT NULL UNIQUE COMMENT 'contoh: UTS, UAS, UKK',
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO exam_types (id, code, name, description) VALUES
(UUID(), 'UH',       'Ulangan Harian',         'Ulangan harian per bab/materi'),
(UUID(), 'UTS',      'Ujian Tengah Semester',   'Ujian tengah semester'),
(UUID(), 'UAS',      'Ujian Akhir Semester',    'Ujian akhir semester'),
(UUID(), 'PRAKTIK',  'Ujian Praktik Kejuruan',  'Ujian praktik TKJ / Teknik Otomotif'),
(UUID(), 'UKK',      'Uji Kompetensi Keahlian', 'Ujian kompetensi kelas 12'),
(UUID(), 'REMEDIAL', 'Ujian Remedial',          'Ujian perbaikan nilai');

-- =========================================================
-- 30. TABLE: exams
-- PERIODE / EVENT UJIAN
-- contoh: "UTS Ganjil 2026/2027" (1-7 Oktober 2026)
-- =========================================================

CREATE TABLE exams (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    academic_year_id CHAR(36) NOT NULL,
    exam_type_id CHAR(36) NOT NULL,
    name VARCHAR(200) NOT NULL COMMENT 'contoh: UTS Ganjil 2026/2027',
    semester ENUM('ganjil','genap') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'jadwal tampil ke siswa/guru bila TRUE',
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_exams_year
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_exams_type
        FOREIGN KEY (exam_type_id) REFERENCES exam_types(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT chk_exams_dates CHECK (end_date >= start_date),
    UNIQUE KEY uq_exams (academic_year_id, exam_type_id, semester)
);

-- =========================================================
-- 31. TABLE: exam_schedules
-- JADWAL UJIAN PER KELAS + MAPEL
-- =========================================================

CREATE TABLE exam_schedules (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    exam_id CHAR(36) NOT NULL,
    class_subject_id CHAR(36) NOT NULL,
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(100) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_exam_schedules_exam
        FOREIGN KEY (exam_id) REFERENCES exams(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_exam_schedules_class_subject
        FOREIGN KEY (class_subject_id) REFERENCES class_subjects(id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT chk_exam_schedules_time CHECK (end_time > start_time),
    UNIQUE KEY uq_exam_schedule (exam_id, class_subject_id)
);

-- =========================================================
-- 32. TABLE: exam_supervisors
-- PENGAWAS UJIAN (1 jadwal bisa lebih dari 1 pengawas)
-- =========================================================

CREATE TABLE exam_supervisors (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    exam_schedule_id CHAR(36) NOT NULL,
    teacher_id CHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_exam_supervisors_schedule
        FOREIGN KEY (exam_schedule_id) REFERENCES exam_schedules(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_exam_supervisors_teacher
        FOREIGN KEY (teacher_id) REFERENCES teachers(id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    UNIQUE KEY uq_exam_supervisor (exam_schedule_id, teacher_id)
);

-- =========================================================
-- INDEX (tables 29–32)
-- =========================================================

CREATE INDEX idx_exams_year            ON exams(academic_year_id);
CREATE INDEX idx_exams_type            ON exams(exam_type_id);
CREATE INDEX idx_exams_published       ON exams(is_published);
CREATE INDEX idx_exam_schedules_exam   ON exam_schedules(exam_id);
CREATE INDEX idx_exam_schedules_cs     ON exam_schedules(class_subject_id);
CREATE INDEX idx_exam_schedules_date   ON exam_schedules(exam_date);
CREATE INDEX idx_exam_supervisors_sch  ON exam_supervisors(exam_schedule_id);
CREATE INDEX idx_exam_supervisors_tch  ON exam_supervisors(teacher_id);


-- =========================================================
-- RESET: hapus tabel ujian lama (jika ada), lalu buat ulang.
-- HATI-HATI: semua data di 9 tabel ini ikut terhapus.
-- =========================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS exam_answers;
DROP TABLE IF EXISTS exam_attempts;
DROP TABLE IF EXISTS exam_supervisors;
DROP TABLE IF EXISTS exam_schedules;
DROP TABLE IF EXISTS question_options;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS question_sets;
DROP TABLE IF EXISTS exams;
DROP TABLE IF EXISTS exam_types;
SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================
-- 29. exam_types : MASTER JENIS UJIAN
-- =========================================================

CREATE TABLE exam_types (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    code VARCHAR(20) NOT NULL UNIQUE COMMENT 'contoh: UTS, UAS, UKK',
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO exam_types (id, code, name, description) VALUES
(UUID(), 'UH',       'Ulangan Harian',          'Ulangan harian per bab/materi'),
(UUID(), 'UTS',      'Ujian Tengah Semester',   'Ujian tengah semester'),
(UUID(), 'UAS',      'Ujian Akhir Semester',    'Ujian akhir semester'),
(UUID(), 'PRAKTIK',  'Ujian Praktik Kejuruan',  'Ujian praktik TKJ / Teknik Otomotif'),
(UUID(), 'UKK',      'Uji Kompetensi Keahlian', 'Ujian kompetensi kelas 12'),
(UUID(), 'REMEDIAL', 'Ujian Remedial',          'Ujian perbaikan nilai');

-- =========================================================
-- 30. exams : PERIODE / EVENT UJIAN
-- =========================================================

CREATE TABLE exams (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    academic_year_id CHAR(36) NOT NULL,
    exam_type_id CHAR(36) NOT NULL,
    name VARCHAR(200) NOT NULL COMMENT 'contoh: UTS Ganjil 2026/2027',
    semester ENUM('ganjil','genap') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_exams_year
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_exams_type
        FOREIGN KEY (exam_type_id) REFERENCES exam_types(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT chk_exams_dates CHECK (end_date >= start_date),
    UNIQUE KEY uq_exams_name (academic_year_id, name)
);

-- =========================================================
-- 33. question_sets : PAKET SOAL (dibuat guru)
-- =========================================================

CREATE TABLE question_sets (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    subject_id CHAR(36) NOT NULL,
    teacher_id CHAR(36) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    instructions TEXT NULL,
    duration_minutes SMALLINT UNSIGNED NOT NULL,
    passing_score DECIMAL(5,2) NULL,
    shuffle_questions BOOLEAN NOT NULL DEFAULT FALSE,
    shuffle_options BOOLEAN NOT NULL DEFAULT FALSE,
    show_result BOOLEAN NOT NULL DEFAULT FALSE,
    status ENUM('draft','ready') NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_question_sets_subject
        FOREIGN KEY (subject_id) REFERENCES subjects(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_question_sets_teacher
        FOREIGN KEY (teacher_id) REFERENCES teachers(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- =========================================================
-- 34. questions : BUTIRAN SOAL
-- =========================================================

CREATE TABLE questions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    question_set_id CHAR(36) NOT NULL,
    type ENUM('multiple_choice','essay') NOT NULL DEFAULT 'multiple_choice',
    question_text LONGTEXT NOT NULL,
    image VARCHAR(500) NULL,
    points DECIMAL(5,2) NOT NULL DEFAULT 1,
    explanation TEXT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_questions_set
        FOREIGN KEY (question_set_id) REFERENCES question_sets(id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT chk_questions_points CHECK (points > 0)
);

-- =========================================================
-- 35. question_options : PILIHAN JAWABAN (multiple_choice)
-- =========================================================

CREATE TABLE question_options (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    question_id CHAR(36) NOT NULL,
    label CHAR(1) NOT NULL COMMENT 'A, B, C, D, E',
    option_text TEXT NOT NULL,
    image VARCHAR(500) NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_question_options_question
        FOREIGN KEY (question_id) REFERENCES questions(id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    UNIQUE KEY uq_question_option_label (question_id, label)
);

-- =========================================================
-- 31. exam_schedules : JADWAL UJIAN PER KELAS + MAPEL
-- =========================================================

CREATE TABLE exam_schedules (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    exam_id CHAR(36) NOT NULL,
    class_subject_id CHAR(36) NOT NULL,
    question_set_id CHAR(36) NULL COMMENT 'paket soal yang dipakai',
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(100) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_exam_schedules_exam
        FOREIGN KEY (exam_id) REFERENCES exams(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_exam_schedules_class_subject
        FOREIGN KEY (class_subject_id) REFERENCES class_subjects(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_exam_schedules_question_set
        FOREIGN KEY (question_set_id) REFERENCES question_sets(id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    CONSTRAINT chk_exam_schedules_time CHECK (end_time > start_time),
    UNIQUE KEY uq_exam_schedule (exam_id, class_subject_id)
);

-- =========================================================
-- 32. exam_supervisors : PENGAWAS UJIAN
-- =========================================================

CREATE TABLE exam_supervisors (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    exam_schedule_id CHAR(36) NOT NULL,
    teacher_id CHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_exam_supervisors_schedule
        FOREIGN KEY (exam_schedule_id) REFERENCES exam_schedules(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_exam_supervisors_teacher
        FOREIGN KEY (teacher_id) REFERENCES teachers(id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    UNIQUE KEY uq_exam_supervisor (exam_schedule_id, teacher_id)
);

-- =========================================================
-- 36. exam_attempts : PENGERJAAN UJIAN OLEH SISWA
-- =========================================================

CREATE TABLE exam_attempts (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    exam_schedule_id CHAR(36) NOT NULL,
    student_id CHAR(36) NOT NULL,
    status ENUM('in_progress','submitted','timed_out','graded') NOT NULL DEFAULT 'in_progress',
    started_at DATETIME NOT NULL,
    deadline_at DATETIME NOT NULL,
    submitted_at DATETIME NULL,
    question_order LONGTEXT NULL COMMENT 'JSON urutan id soal jika diacak',
    objective_score DECIMAL(6,2) NULL,
    essay_score DECIMAL(6,2) NULL,
    total_score DECIMAL(6,2) NULL,
    tab_switch_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_exam_attempts_schedule
        FOREIGN KEY (exam_schedule_id) REFERENCES exam_schedules(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_exam_attempts_student
        FOREIGN KEY (student_id) REFERENCES students(id)
        ON UPDATE CASCADE ON DELETE CASCADE

    -- Tidak pakai UNIQUE KEY agar siswa bisa attempt ulang di hari berbeda.
    -- Kontrol duplikat dilakukan di application layer (findRelevantByScheduleAndStudent).
);

-- =========================================================
-- 37. exam_answers : JAWABAN SISWA PER SOAL
-- =========================================================

CREATE TABLE exam_answers (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    attempt_id CHAR(36) NOT NULL,
    question_id CHAR(36) NOT NULL,
    selected_option_id CHAR(36) NULL,
    selected_option_ids JSON NULL,
    answer_text LONGTEXT NULL,
    is_correct BOOLEAN NULL,
    score DECIMAL(5,2) NULL,
    feedback TEXT NULL,
    graded_by CHAR(36) NULL,
    graded_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_exam_answers_attempt
        FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_exam_answers_question
        FOREIGN KEY (question_id) REFERENCES questions(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_exam_answers_option
        FOREIGN KEY (selected_option_id) REFERENCES question_options(id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_exam_answers_grader
        FOREIGN KEY (graded_by) REFERENCES teachers(id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    UNIQUE KEY uq_exam_answer (attempt_id, question_id)
);

-- =========================================================
-- INDEX (tables 29–37)
-- =========================================================

CREATE INDEX idx_exams_type              ON exams(exam_type_id);
CREATE INDEX idx_exams_published         ON exams(is_published);
CREATE INDEX idx_question_sets_subject   ON question_sets(subject_id);
CREATE INDEX idx_question_sets_teacher   ON question_sets(teacher_id);
CREATE INDEX idx_question_sets_status    ON question_sets(status);
CREATE INDEX idx_questions_set_order     ON questions(question_set_id, sort_order);
CREATE INDEX idx_exam_schedules_cs       ON exam_schedules(class_subject_id);
CREATE INDEX idx_exam_schedules_qset     ON exam_schedules(question_set_id);
CREATE INDEX idx_exam_schedules_date     ON exam_schedules(exam_date);
CREATE INDEX idx_exam_supervisors_tch    ON exam_supervisors(teacher_id);
CREATE INDEX idx_exam_attempts_student   ON exam_attempts(student_id);
CREATE INDEX idx_exam_attempts_status    ON exam_attempts(status);
CREATE INDEX idx_exam_answers_question   ON exam_answers(question_id);

-- =========================================================
-- ALTER: questions — tambah tipe multiple_choice_complex
-- =========================================================

ALTER TABLE questions
  MODIFY COLUMN type ENUM('multiple_choice','multiple_choice_complex','essay')
    NOT NULL DEFAULT 'multiple_choice';

-- =========================================================
-- ALTER: exam_answers — tambah kolom selected_option_ids
-- untuk menyimpan multiple pilihan (JSON array of option IDs)
-- =========================================================

ALTER TABLE exam_answers
  ADD COLUMN IF NOT EXISTS selected_option_ids LONGTEXT NULL
    COMMENT 'JSON array of option IDs untuk multiple_choice_complex'
    AFTER selected_option_id;
