const pool = require('../config/database');

class ExamAnswerModel {
  /**
   * Upsert an answer.
   * - multiple_choice:         selected_option_id (single)
   * - multiple_choice_complex: selected_option_ids (JSON array)
   * - essay:                   answer_text
   */
  static async upsert(data) {
    const {
      attempt_id, question_id,
      selected_option_id  = null,
      selected_option_ids = null,   // array for complex MC
      answer_text         = null,
    } = data;

    const idsJson = Array.isArray(selected_option_ids) && selected_option_ids.length > 0
      ? JSON.stringify(selected_option_ids)
      : null;

    await pool.execute(
      `INSERT INTO exam_answers
         (id, attempt_id, question_id, selected_option_id, selected_option_ids, answer_text)
       VALUES (UUID(), ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         selected_option_id  = VALUES(selected_option_id),
         selected_option_ids = VALUES(selected_option_ids),
         answer_text         = VALUES(answer_text),
         updated_at          = CURRENT_TIMESTAMP`,
      [attempt_id, question_id,
       selected_option_id || null, idsJson, answer_text || null]
    );

    return this.findByAttemptAndQuestion(attempt_id, question_id);
  }

  static async findByAttemptAndQuestion(attempt_id, question_id) {
    const [rows] = await pool.execute(
      `SELECT * FROM exam_answers WHERE attempt_id = ? AND question_id = ?`,
      [attempt_id, question_id]
    );
    return rows[0] || null;
  }

  static async findByAttempt(attempt_id) {
    const [rows] = await pool.execute(
      `SELECT ans.*,
              q.type          AS question_type,
              q.question_text,
              q.points        AS max_points,
              q.sort_order,
              opt.label       AS selected_label,
              opt.option_text AS selected_option_text
       FROM exam_answers ans
       LEFT JOIN questions        q   ON ans.question_id        = q.id
       LEFT JOIN question_options opt ON ans.selected_option_id = opt.id
       WHERE ans.attempt_id = ?
       ORDER BY q.sort_order ASC`,
      [attempt_id]
    );
    return rows;
  }

  /**
   * Auto-grade objective questions (multiple_choice + multiple_choice_complex).
   *
   * multiple_choice:         full point if selected_option_id matches the one correct option.
   * multiple_choice_complex: full point only if selected_option_ids matches EXACTLY the set of
   *                          correct option IDs (all correct selected, no incorrect selected).
   *
   * Returns { correct, incorrect, unanswered, objective_score }
   */
  static async autoGradeObjective(attempt_id) {
    const [rows] = await pool.execute(
      `SELECT ans.id, ans.question_id, ans.selected_option_id,
              ans.selected_option_ids,
              q.type, q.points
       FROM exam_answers ans
       JOIN questions q ON ans.question_id = q.id
       WHERE ans.attempt_id = ?
         AND q.type IN ('multiple_choice', 'multiple_choice_complex')`,
      [attempt_id]
    );

    let objectiveScore = 0;
    let correct = 0, incorrect = 0, unanswered = 0;

    for (const row of rows) {
      let isCorrect = null;
      let score = 0;
      const points = parseFloat(row.points);

      if (row.type === 'multiple_choice') {
        // ── Single correct ────────────────────────────────────────────────────
        const [[correctOpt]] = await pool.execute(
          `SELECT id FROM question_options WHERE question_id = ? AND is_correct = TRUE LIMIT 1`,
          [row.question_id]
        );

        if (!row.selected_option_id) {
          unanswered++;
        } else if (correctOpt && row.selected_option_id === correctOpt.id) {
          isCorrect = true;
          score = points;
          objectiveScore += score;
          correct++;
        } else {
          isCorrect = false;
          incorrect++;
        }

      } else {
        // ── Multiple correct (MCMA) ───────────────────────────────────────────
        const [correctOpts] = await pool.execute(
          `SELECT id FROM question_options WHERE question_id = ? AND is_correct = TRUE`,
          [row.question_id]
        );
        const correctIds = correctOpts.map(o => o.id).sort();

        let selectedIds = [];
        try {
          selectedIds = row.selected_option_ids
            ? JSON.parse(row.selected_option_ids)
            : [];
        } catch { selectedIds = []; }
        selectedIds = selectedIds.filter(Boolean).sort();

        if (selectedIds.length === 0) {
          unanswered++;
        } else {
          // Exact match required: same set of IDs
          const exactMatch =
            selectedIds.length === correctIds.length &&
            selectedIds.every((id, i) => id === correctIds[i]);

          if (exactMatch) {
            isCorrect = true;
            score = points;
            objectiveScore += score;
            correct++;
          } else {
            isCorrect = false;
            incorrect++;
          }
        }
      }

      await pool.execute(
        `UPDATE exam_answers
         SET is_correct = ?, score = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [isCorrect, score, row.id]
      );
    }

    return { correct, incorrect, unanswered, objective_score: objectiveScore };
  }

  static async gradeEssay(answer_id, { score, feedback, graded_by }) {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    const graded_at = `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    await pool.execute(
      `UPDATE exam_answers
       SET score = ?, feedback = ?, graded_by = ?, graded_at = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [score, feedback || null, graded_by || null, graded_at, answer_id]
    );
    const [rows] = await pool.execute(`SELECT * FROM exam_answers WHERE id = ?`, [answer_id]);
    return rows[0] || null;
  }

  static async sumEssayScore(attempt_id) {
    const [rows] = await pool.execute(
      `SELECT COALESCE(SUM(ans.score), 0) AS essay_score
       FROM exam_answers ans
       JOIN questions q ON ans.question_id = q.id
       WHERE ans.attempt_id = ? AND q.type = 'essay'`,
      [attempt_id]
    );
    return parseFloat(rows[0].essay_score);
  }
}

module.exports = ExamAnswerModel;
