const pool = require('../config/database');

class QuestionOptionModel {
  static async create(data) {
    const {
      question_id, label, option_text,
      image = null, is_correct = false, sort_order = 0,
    } = data;

    await pool.execute(
      `INSERT INTO question_options (id, question_id, label, option_text, image, is_correct, sort_order)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?)`,
      [question_id, label.toUpperCase(), option_text.trim(),
       image || null, is_correct ? 1 : 0, parseInt(sort_order)]
    );

    return this.findByQuestionAndLabel(question_id, label);
  }

  static async bulkReplace(question_id, options) {
    // Delete existing options then insert fresh set
    await pool.execute(`DELETE FROM question_options WHERE question_id = ?`, [question_id]);

    for (const opt of options) {
      await pool.execute(
        `INSERT INTO question_options (id, question_id, label, option_text, image, is_correct, sort_order)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?)`,
        [question_id, opt.label.toUpperCase(), opt.option_text.trim(),
         opt.image || null, opt.is_correct ? 1 : 0, opt.sort_order ?? 0]
      );
    }

    return this.findByQuestion(question_id);
  }

  static async findByQuestion(question_id) {
    const [rows] = await pool.execute(
      `SELECT * FROM question_options WHERE question_id = ? ORDER BY sort_order ASC`,
      [question_id]
    );
    return rows;
  }

  static async findByQuestionAndLabel(question_id, label) {
    const [rows] = await pool.execute(
      `SELECT * FROM question_options WHERE question_id = ? AND label = ?`,
      [question_id, label.toUpperCase()]
    );
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT * FROM question_options WHERE id = ?`, [id]
    );
    return rows[0] || null;
  }

  static async update(id, data) {
    const allowed = ['label', 'option_text', 'image', 'is_correct', 'sort_order'];
    const fields = [];
    const params = [];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        if (key === 'label')       params.push(data[key].toUpperCase());
        else if (key === 'option_text') params.push(data[key].trim());
        else params.push(data[key]);
      }
    }
    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await pool.execute(
      `UPDATE question_options SET ${fields.join(', ')} WHERE id = ?`, params
    );
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.execute(
      `DELETE FROM question_options WHERE id = ?`, [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = QuestionOptionModel;
