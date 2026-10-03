const pool = require('../config/database');

class PpdbModel {
  // =========================================================
  // REGISTRATIONS
  // =========================================================

  /**
   * Cek apakah user sudah punya pendaftaran
   */
  static async findByUserId(userId) {
    const [rows] = await pool.execute(
      `SELECT 
        r.*,
        u.email,
        u.username
       FROM ppdb_registrations r
       JOIN users u ON r.user_id = u.id
       WHERE r.user_id = ?`,
      [userId]
    );
    return rows[0] || null;
  }

  /**
   * Cari pendaftaran berdasarkan ID
   */
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT 
        r.*,
        u.email,
        u.username
       FROM ppdb_registrations r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Buat draft pendaftaran baru setelah step 1 (akun dibuat)
   * Step 2 & 3 langsung diisi pertama kali
   */
  static async createDraft(userId, data) {
    const { registered_by, major, education_system } = data;
    const [result] = await pool.execute(
      `INSERT INTO ppdb_registrations 
        (id, user_id, registered_by, major, education_system, registration_status, current_step)
       VALUES (UUID(), ?, ?, ?, ?, 'draft', 3)`,
      [userId, registered_by, major, education_system]
    );

    const [rows] = await pool.execute(
      `SELECT id FROM ppdb_registrations WHERE user_id = ?`,
      [userId]
    );
    return rows[0].id;
  }

  /**
   * Update Step 4 — Data Diri
   */
  static async updateStep4(registrationId, data) {
    const {
      nik, nisn, full_name, nickname,
      nationality, birth_place, birth_date, gender, religion, family_status,
      child_order, total_siblings, total_biological_siblings,
      total_step_siblings, total_adopted_siblings,
      school_origin, study_duration, diploma_number, diploma_date, npsn,
      has_kip, kip_number,
      living_status, daily_language, siblings_in_school,
      transportation, distance_to_school, travel_time, photo,
      phone, contact_email, province, city, district,
      village, rt, rw, full_address
    } = data;

    await pool.execute(
      `UPDATE ppdb_registrations SET
        nik = ?, nisn = ?, full_name = ?, nickname = ?,
        nationality = ?, birth_place = ?, birth_date = ?, gender = ?, religion = ?, family_status = ?,
        child_order = ?, total_siblings = ?, total_biological_siblings = ?,
        total_step_siblings = ?, total_adopted_siblings = ?,
        school_origin = ?, study_duration = ?, diploma_number = ?, diploma_date = ?, npsn = ?,
        has_kip = ?, kip_number = ?,
        living_status = ?, daily_language = ?, siblings_in_school = ?,
        transportation = ?, distance_to_school = ?, travel_time = ?, photo = ?,
        phone = ?, contact_email = ?, province = ?, city = ?, district = ?,
        village = ?, rt = ?, rw = ?, full_address = ?,
        current_step = GREATEST(current_step, 4),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        nik, nisn, full_name, nickname || null,
        nationality || 'WNI', birth_place, birth_date, gender, religion, family_status,
        child_order, total_siblings, total_biological_siblings,
        total_step_siblings || null, total_adopted_siblings || null,
        school_origin, study_duration, diploma_number, diploma_date, npsn,
        has_kip ? 1 : 0, has_kip ? (kip_number || null) : null,
        living_status, daily_language, siblings_in_school || 0,
        transportation, distance_to_school, travel_time, photo,
        phone, contact_email || null, province, city, district,
        village, rt, rw, full_address,
        registrationId
      ]
    );
  }

  /**
   * Update status pendaftaran & current_step
   */
  static async updateStatus(registrationId, status, adminId = null, notes = null) {
    const params = [status];
    let extraFields = '';

    if (status === 'submitted') {
      extraFields = ', submitted_at = CURRENT_TIMESTAMP';
    }
    if (status === 'verified' || status === 'accepted' || status === 'rejected') {
      extraFields = ', verified_at = CURRENT_TIMESTAMP, verified_by = ?, notes = ?';
      params.push(adminId, notes);
    }

    params.push(registrationId);

    await pool.execute(
      `UPDATE ppdb_registrations SET
        registration_status = ?,
        updated_at = CURRENT_TIMESTAMP
        ${extraFields}
       WHERE id = ?`,
      params
    );
  }

  /**
   * Advance current_step jika lebih besar dari yang tersimpan
   */
  static async advanceStep(registrationId, step) {
    await pool.execute(
      `UPDATE ppdb_registrations SET
        current_step = GREATEST(current_step, ?),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [step, registrationId]
    );
  }

  /**
   * Ambil semua pendaftaran (untuk admin) dengan filter & pagination
   */
  static async findAll(filters = {}, { limit = 10, offset = 0 } = {}) {
    const where = [];
    const params = [];

    if (filters.status) {
      where.push('r.registration_status = ?');
      params.push(filters.status);
    } else if (filters.excludeAccepted) {
      where.push("r.registration_status != 'accepted'");
    }
    if (filters.major) {
      where.push('r.major = ?');
      params.push(filters.major);
    }
    if (filters.search) {
      where.push('(r.full_name LIKE ? OR r.nik LIKE ? OR r.nisn LIKE ? OR u.email LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [rows] = await pool.execute(
      `SELECT
        r.id, r.user_id, r.full_name, r.nik, r.nisn,
        r.major, r.education_system, r.gender,
        r.registration_status, r.current_step,
        r.submitted_at, r.created_at,
        u.email
       FROM ppdb_registrations r
       JOIN users u ON r.user_id = u.id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      params
    );
    return rows;
  }

  static async count(filters = {}) {
    const where = [];
    const params = [];

    if (filters.status) {
      where.push('r.registration_status = ?');
      params.push(filters.status);
    } else if (filters.excludeAccepted) {
      where.push("r.registration_status != 'accepted'");
    }
    if (filters.major) {
      where.push('r.major = ?');
      params.push(filters.major);
    }
    if (filters.search) {
      where.push('(r.full_name LIKE ? OR r.nik LIKE ? OR r.nisn LIKE ? OR u.email LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM ppdb_registrations r
       JOIN users u ON r.user_id = u.id
       ${whereClause}`,
      params
    );
    return rows[0].total;
  }

  // =========================================================
  // HEALTH (Step 5)
  // =========================================================

  static async findHealthByRegistrationId(registrationId) {
    const [rows] = await pool.execute(
      `SELECT * FROM ppdb_health WHERE registration_id = ?`,
      [registrationId]
    );
    return rows[0] || null;
  }

  static async upsertHealth(registrationId, data) {
    const { health_history, disability, height, weight } = data;
    const existing = await this.findHealthByRegistrationId(registrationId);

    if (existing) {
      await pool.execute(
        `UPDATE ppdb_health SET
          health_history = ?, disability = ?, height = ?, weight = ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE registration_id = ?`,
        [health_history || null, disability || null, height || null, weight || null, registrationId]
      );
    } else {
      await pool.execute(
        `INSERT INTO ppdb_health (id, registration_id, health_history, disability, height, weight)
         VALUES (UUID(), ?, ?, ?, ?, ?)`,
        [registrationId, health_history || null, disability || null, height || null, weight || null]
      );
    }
  }

  // =========================================================
  // DOCUMENTS (Step 6)
  // =========================================================

  static async findDocumentsByRegistrationId(registrationId) {
    const [rows] = await pool.execute(
      `SELECT * FROM ppdb_documents WHERE registration_id = ?`,
      [registrationId]
    );
    return rows[0] || null;
  }

  static async upsertDocuments(registrationId, data) {
    const { kk_document, diploma_document } = data;
    const existing = await this.findDocumentsByRegistrationId(registrationId);

    if (existing) {
      const fields = [];
      const params = [];

      if (kk_document) { fields.push('kk_document = ?'); params.push(kk_document); }
      if (diploma_document) { fields.push('diploma_document = ?'); params.push(diploma_document); }

      if (fields.length === 0) return;

      fields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(registrationId);

      await pool.execute(
        `UPDATE ppdb_documents SET ${fields.join(', ')} WHERE registration_id = ?`,
        params
      );
    } else {
      await pool.execute(
        `INSERT INTO ppdb_documents (id, registration_id, kk_document, diploma_document)
         VALUES (UUID(), ?, ?, ?)`,
        [registrationId, kk_document, diploma_document]
      );
    }
  }

  // =========================================================
  // ACHIEVEMENTS (Step 7)
  // =========================================================

  static async findAchievementsByRegistrationId(registrationId) {
    const [rows] = await pool.execute(
      `SELECT * FROM ppdb_achievements WHERE registration_id = ? ORDER BY created_at ASC`,
      [registrationId]
    );
    return rows;
  }

  static async addAchievement(registrationId, data) {
    const { achievement_name, document } = data;
    const [rows] = await pool.execute(
      `INSERT INTO ppdb_achievements (id, registration_id, achievement_name, document)
       VALUES (UUID(), ?, ?, ?)`,
      [registrationId, achievement_name, document || null]
    );
    // Return newly created
    const [created] = await pool.execute(
      `SELECT * FROM ppdb_achievements WHERE registration_id = ? ORDER BY created_at DESC LIMIT 1`,
      [registrationId]
    );
    return created[0];
  }

  static async deleteAchievement(achievementId, registrationId) {
    const [result] = await pool.execute(
      `DELETE FROM ppdb_achievements WHERE id = ? AND registration_id = ?`,
      [achievementId, registrationId]
    );
    return result.affectedRows > 0;
  }

  // =========================================================
  // PARENTS (Step 8)
  // =========================================================

  static async findParentsByRegistrationId(registrationId) {
    const [rows] = await pool.execute(
      `SELECT * FROM ppdb_parents WHERE registration_id = ? ORDER BY parent_type ASC`,
      [registrationId]
    );
    return rows;
  }

  static async findParentByType(registrationId, parentType) {
    const [rows] = await pool.execute(
      `SELECT * FROM ppdb_parents WHERE registration_id = ? AND parent_type = ?`,
      [registrationId, parentType]
    );
    return rows[0] || null;
  }

  static async upsertParent(registrationId, parentType, data) {
    const {
      full_name, nik, education, occupation,
      marital_status, phone, birth_place, birth_date,
      nationality, religion, monthly_income
    } = data;

    const existing = await this.findParentByType(registrationId, parentType);

    if (existing) {
      await pool.execute(
        `UPDATE ppdb_parents SET
          full_name = ?, nik = ?, education = ?, occupation = ?,
          marital_status = ?, phone = ?, birth_place = ?, birth_date = ?,
          nationality = ?, religion = ?, monthly_income = ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE registration_id = ? AND parent_type = ?`,
        [
          full_name, nik, education, occupation,
          marital_status, phone, birth_place, birth_date,
          nationality || 'WNI', religion, monthly_income || null,
          registrationId, parentType
        ]
      );
    } else {
      await pool.execute(
        `INSERT INTO ppdb_parents
          (id, registration_id, parent_type, full_name, nik, education, occupation,
           marital_status, phone, birth_place, birth_date, nationality, religion, monthly_income)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          registrationId, parentType, full_name, nik, education, occupation,
          marital_status, phone, birth_place, birth_date,
          nationality || 'WNI', religion, monthly_income || null
        ]
      );
    }
  }

  // =========================================================
  // FULL DETAIL (untuk GET detail pendaftaran)
  // =========================================================

  static async findFullDetail(registrationId) {
    const registration = await this.findById(registrationId);
    if (!registration) return null;

    const [health, documents, achievements, parents] = await Promise.all([
      this.findHealthByRegistrationId(registrationId),
      this.findDocumentsByRegistrationId(registrationId),
      this.findAchievementsByRegistrationId(registrationId),
      this.findParentsByRegistrationId(registrationId)
    ]);

    return {
      ...registration,
      health: health || null,
      documents: documents || null,
      achievements,
      parents
    };
  }
}

module.exports = PpdbModel;
