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

    class_name VARCHAR(100),
    major VARCHAR(100),

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
-- INDEX
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
