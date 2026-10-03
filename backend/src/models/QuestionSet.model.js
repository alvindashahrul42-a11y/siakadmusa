const pool = require('../config/database');

class QuestionSetModel {
  static async create(data) {
    const {
      subject_id, teacher_id, title, description = null,
      instructions = null, duration_minutes,
      passing_score = null, shuffle_questions = false,
      shuffle_options = false, show_result = false, status = 'draft',
    } = data;

    await pool.execute(
      `INSERT INTO question_sets
         (id, subject_id, teacher_id, title, description, instructions,
          duration_minutes, passing_score, shuffle_questions, shuffle_options,
          show_result, status)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [subject_id, teacher_id, title.trim(), description || null,
       instructions || null, duration_minutes,
       passing_score || null,
       shuffle_questions ? 1 : 0, shuffle_options ? 1 : 0,
       show_result ? 1 : 0, status]
    );

    const [rows] = await pool.execute(
      `SELECT qs.*,
              s.name  AS subject_name,
              s.code  AS subject_code,
              t.full_name AS teacher_name,
              (SELECT COUNT(*) FROM questions q WHERE q.question_set_id = qs.id) AS question_count
       FROM question_sets qs
       LEFT JOIN subjects  s ON qs.subject_id = s.id
       LEFT JOIN teachers  t ON qs.teacher_id = t.id
       WHERE qs.teacher_id = ? AND qs.title = ?
       ORDER BY qs.created_at DESC LIMIT 1`,
      [teacher_id, title.trim()]
    );
    return rows[0];
  }

  static async findAll({ limit = 20, offset = 0, search = '', subject_id = '', teacher_id = '', status = '' } = {}) {
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(qs.title LIKE ? OR s.name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (subject_id) { conditions.push('qs.subject_id = ?'); params.push(subject_id); }
    if (teacher_id) { conditions.push('qs.teacher_id = ?'); params.push(teacher_id); }
    if (status)     { conditions.push('qs.status = ?');     params.push(status); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const [rows] = await pool.execute(
      `SELECT qs.*,
              s.name  AS subject_name,
              s.code  AS subject_code,
              t.full_name AS teacher_name,
              (SELECT COUNT(*) FROM questions q WHERE q.question_set_id = qs.id) AS question_count
       FROM question_sets qs
       LEFT JOIN subjects s ON qs.subject_id = s.id
       LEFT JOIN teachers t ON qs.teacher_id = t.id
       ${where}
       ORDER BY qs.created_at DESC
       LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      params
    );
    return rows;
  }

  static async countAll({ search = '', subject_id = '', teacher_id = '', status = '' } = {}) {
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(qs.title LIKE ? OR s.name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (subject_id) { conditions.push('qs.subject_id = ?'); params.push(subject_id); }
    if (teacher_id) { conditions.push('qs.teacher_id = ?'); params.push(teacher_id); }
    if (status)     { conditions.push('qs.status = ?');     params.push(status); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM question_sets qs
       LEFT JOIN subjects s ON qs.subject_id = s.id
       ${where}`,
      params
    );
    return rows[0].total;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT qs.*,
              s.name  AS subject_name,
              s.code  AS subject_code,
              t.full_name AS teacher_name,
              (SELECT COUNT(*) FROM questions q WHERE q.question_set_id = qs.id) AS question_count,
              (SELECT COALESCE(SUM(q.points),0) FROM questions q WHERE q.question_set_id = qs.id) AS total_points
       FROM question_sets qs
       LEFT JOIN subjects s ON qs.subject_id = s.id
       LEFT JOIN teachers t ON qs.teacher_id = t.id
       WHERE qs.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async findReadyBySubject(subject_id) {
    const [rows] = await pool.execute(
      `SELECT qs.id, qs.title, qs.duration_minutes, qs.passing_score,
              t.full_name AS teacher_name
       FROM question_sets qs
       LEFT JOIN teachers t ON qs.teacher_id = t.id
       WHERE qs.subject_id = ? AND qs.status = 'ready'
       ORDER BY qs.title ASC`,
      [subject_id]
    );
    return rows;
  }

  static async update(id, data) {
    const allowed = ['title', 'description', 'instructions', 'duration_minutes',
                     'passing_score', 'shuffle_questions', 'shuffle_options',
                     'show_result', 'status', 'subject_id'];
    const fields = [];
    const params = [];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(key === 'title' ? data[key].trim() : data[key]);
      }
    }
    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await pool.execute(
      `UPDATE question_sets SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.execute(
      `DELETE FROM question_sets WHERE id = ?`, [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = QuestionSetModel;
