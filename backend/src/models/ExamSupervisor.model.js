const pool = require('../config/database');

class ExamSupervisorModel {
  static async create(data) {
    const { exam_schedule_id, teacher_id } = data;

    await pool.execute(
      `INSERT INTO exam_supervisors (id, exam_schedule_id, teacher_id)
       VALUES (UUID(), ?, ?)`,
      [exam_schedule_id, teacher_id]
    );

    return this.findByScheduleAndTeacher(exam_schedule_id, teacher_id);
  }

  static async findBySchedule(exam_schedule_id) {
    const [rows] = await pool.execute(
      `SELECT sv.*,
              t.full_name    AS teacher_name,
              t.teacher_number,
              t.phone        AS teacher_phone
       FROM exam_supervisors sv
       LEFT JOIN teachers t ON sv.teacher_id = t.id
       WHERE sv.exam_schedule_id = ?
       ORDER BY t.full_name ASC`,
      [exam_schedule_id]
    );
    return rows;
  }

  static async findByScheduleAndTeacher(exam_schedule_id, teacher_id) {
    const [rows] = await pool.execute(
      `SELECT sv.*,
              t.full_name    AS teacher_name,
              t.teacher_number
       FROM exam_supervisors sv
       LEFT JOIN teachers t ON sv.teacher_id = t.id
       WHERE sv.exam_schedule_id = ? AND sv.teacher_id = ?`,
      [exam_schedule_id, teacher_id]
    );
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT sv.*,
              t.full_name    AS teacher_name,
              t.teacher_number,
              es.exam_date,
              es.start_time,
              es.end_time,
              es.room
       FROM exam_supervisors sv
       LEFT JOIN teachers         t  ON sv.teacher_id        = t.id
       LEFT JOIN exam_schedules   es ON sv.exam_schedule_id  = es.id
       WHERE sv.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async delete(id) {
    const [result] = await pool.execute(
      `DELETE FROM exam_supervisors WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  static async deleteByScheduleAndTeacher(exam_schedule_id, teacher_id) {
    const [result] = await pool.execute(
      `DELETE FROM exam_supervisors WHERE exam_schedule_id = ? AND teacher_id = ?`,
      [exam_schedule_id, teacher_id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = ExamSupervisorModel;
