const pool = require('../config/database');

class QuestionModel {
  static async create(data) {
    const {
      question_set_id, type = 'multiple_choice',
      question_text, image = null,
      points = 1, explanation = null, sort_order = 0,
    } = data;

    await pool.execute(
      `INSERT INTO questions
         (id, question_set_id, type, question_text, image, points, explanation, sort_order)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)`,
      [question_set_id, type, question_text.trim(), image || null,
       parseFloat(points), explanation || null, parseInt(sort_order)]
    );

    const [rows] = await pool.execute(
      `SELECT q.*,
              (SELECT JSON_ARRAYAGG(
                JSON_OBJECT('id', o.id, 'label', o.label, 'option_text', o.option_text,
                            'is_correct', o.is_correct, 'sort_order', o.sort_order)
               ) FROM question_options o WHERE o.question_id = q.id ORDER BY o.sort_order) AS options
       FROM questions q
       WHERE q.question_set_id = ? AND q.sort_order = ?
       ORDER BY q.created_at DESC LIMIT 1`,
      [question_set_id, parseInt(sort_order)]
    );
    return rows[0];
  }

  static async findByQuestionSet(question_set_id, includeCorrect = false) {
    const correctField = includeCorrect
      ? 'o.is_correct'
      : 'CASE WHEN o.is_correct IS NOT NULL THEN NULL ELSE NULL END AS is_correct_hidden';

    const [rows] = await pool.execute(
      `SELECT q.*
       FROM questions q
       WHERE q.question_set_id = ?
       ORDER BY q.sort_order ASC, q.created_at ASC`,
      [question_set_id]
    );

    // attach options per question
    for (const q of rows) {
      const [opts] = await pool.execute(
        `SELECT id, label, option_text, image, sort_order${includeCorrect ? ', is_correct' : ''}
         FROM question_options WHERE question_id = ?
         ORDER BY sort_order ASC`,
        [q.id]
      );
      q.options = opts;
    }
    return rows;
  }

  // For student exam — no correct answers, no explanation
  static async findByQuestionSetForStudent(question_set_id) {
    const [rows] = await pool.execute(
      `SELECT id, question_set_id, type, question_text, image, points, sort_order
       FROM questions
       WHERE question_set_id = ?
       ORDER BY sort_order ASC, created_at ASC`,
      [question_set_id]
    );

    for (const q of rows) {
      const [opts] = await pool.execute(
        `SELECT id, label, option_text, image, sort_order
         FROM question_options WHERE question_id = ?
         ORDER BY sort_order ASC`,
        [q.id]
      );
      q.options = opts;
    }
    return rows;
  }

  static async findById(id, includeCorrect = true) {
    const [rows] = await pool.execute(
      `SELECT * FROM questions WHERE id = ?`, [id]
    );
    if (!rows[0]) return null;

    const [opts] = await pool.execute(
      `SELECT id, label, option_text, image, sort_order${includeCorrect ? ', is_correct' : ''}
       FROM question_options WHERE question_id = ?
       ORDER BY sort_order ASC`,
      [id]
    );
    rows[0].options = opts;
    return rows[0];
  }

  static async update(id, data) {
    const allowed = ['type', 'question_text', 'image', 'points', 'explanation', 'sort_order'];
    const fields = [];
    const params = [];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(key === 'question_text' ? data[key].trim() : data[key]);
      }
    }
    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await pool.execute(
      `UPDATE questions SET ${fields.join(', ')} WHERE id = ?`, params
    );
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.execute(
      `DELETE FROM questions WHERE id = ?`, [id]
    );
    return result.affectedRows > 0;
  }

  static async reorder(question_set_id, orders) {
    // orders = [{id, sort_order}, ...]
    for (const { id, sort_order } of orders) {
      await pool.execute(
        `UPDATE questions SET sort_order = ? WHERE id = ? AND question_set_id = ?`,
        [sort_order, id, question_set_id]
      );
    }
  }
}

module.exports = QuestionModel;
