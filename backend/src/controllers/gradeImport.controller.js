const ExcelJS            = require('exceljs');
const GradeModel         = require('../models/Grade.model');
const ClassSubjectModel  = require('../models/ClassSubject.model');
const ClassStudentModel  = require('../models/ClassStudent.model');
const { successResponse, errorResponse } = require('../utils/responseHelper');

// ─────────────────────────────────────────────────────────────────────────────
// Helper: style header baris Excel
// ─────────────────────────────────────────────────────────────────────────────
function applyHeaderStyle(row, bgArgb = 'FF1F6FEB') {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
    cell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.border    = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  row.height = 28;
}

function applySubHeaderStyle(row) {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } };
    cell.font      = { bold: false, italic: true, color: { argb: 'FF333333' }, size: 10 };
    cell.border    = {
      top: { style: 'hair' }, bottom: { style: 'hair' },
      left: { style: 'thin' }, right: { style: 'thin' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  });
  row.height = 20;
}

function applyDataStyle(row) {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.border    = {
      top: { style: 'hair' }, bottom: { style: 'hair' },
      left: { style: 'thin' }, right: { style: 'thin' },
    };
    cell.alignment = { vertical: 'middle', wrapText: true };
  });
  row.height = 22;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/grades/template?class_subject_id=xxx
// Download template nilai Excel (terisi nama siswa jika ada)
// ─────────────────────────────────────────────────────────────────────────────
async function downloadTemplate(req, res) {
  try {
    const { class_subject_id } = req.query;

    // Ambil info kelas-mapel dan daftar siswa (jika ada)
    let classSubject = null;
    let students     = [];

    if (class_subject_id) {
      classSubject = await ClassSubjectModel.findById(class_subject_id);
      if (!classSubject) {
        return errorResponse(res, 404, 'Kelas-mata pelajaran tidak ditemukan');
      }
      // Ambil semua siswa di kelas ini
      students = await ClassStudentModel.findStudentsByClass(
        classSubject.class_id, {}, { limit: 500, offset: 0 }
      );
    }

    const workbook   = new ExcelJS.Workbook();
    workbook.creator = 'SIAKAD';
    workbook.created = new Date();

    // ── Sheet 1: Template Nilai ───────────────────────────────────────────────
    const ws = workbook.addWorksheet('Template Nilai', {
      views: [{ state: 'frozen', ySplit: 3 }],
    });

    ws.columns = [
      { key: 'no',               header: 'No',                  width: 5  },
      { key: 'student_number',   header: 'NIS *',               width: 18 },
      { key: 'student_name',     header: 'Nama Siswa',          width: 30 },
      { key: 'assignment_score', header: 'Nilai Tugas',         width: 14 },
      { key: 'midterm_score',    header: 'Nilai UTS',           width: 12 },
      { key: 'final_exam_score', header: 'Nilai UAS',           width: 12 },
      { key: 'final_score',      header: 'Nilai Akhir',         width: 12 },
      { key: 'notes',            header: 'Catatan',             width: 30 },
    ];

    // Baris 1: Judul
    ws.spliceRows(1, 0, []);
    ws.mergeCells('A1:H1');
    const titleCell = ws.getCell('A1');

    const subjectInfo = classSubject
      ? `${classSubject.subject_name || ''} — ${classSubject.class_name || ''}`
      : 'ISI class_subject_id DI URL';

    titleCell.value     = `TEMPLATE IMPORT NILAI — ${subjectInfo}`;
    titleCell.font      = { bold: true, size: 13, color: { argb: 'FF1F6FEB' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE8FF' } };
    ws.getRow(1).height = 32;

    // Baris 2: Header
    applyHeaderStyle(ws.getRow(2));

    // Baris 3: Petunjuk singkat
    ws.getRow(3).values = [
      '', 'Wajib — NIS siswa', 'Otomatis dari sistem',
      '0–100', '0–100', '0–100',
      'Kosongkan = hitung otomatis', 'Opsional',
    ];
    applySubHeaderStyle(ws.getRow(3));

    // Baris 4+: Isi dengan siswa jika ada, atau contoh kosong
    if (students.length > 0) {
      students.forEach((s, i) => {
        const r = ws.getRow(4 + i);
        r.values = [i + 1, s.student_number, s.student_name, '', '', '', '', ''];
        // Kunci kolom NIS & Nama agar tidak mudah terhapus (proteksi visual via warna)
        r.getCell(1).fill = r.getCell(2).fill = r.getCell(3).fill = {
          type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' },
        };
        applyDataStyle(r);
      });
    } else {
      // Template kosong tanpa data siswa
      for (let i = 0; i < 5; i++) {
        const r = ws.getRow(4 + i);
        r.values = [i + 1, '', '', '', '', '', '', ''];
        applyDataStyle(r);
      }
    }

    // Tambahkan metadata tersembunyi di cell Z1 (class_subject_id)
    if (class_subject_id) {
      ws.getCell('Z1').value = class_subject_id;
      ws.getColumn('Z').hidden = true;
    }

    // ── Sheet 2: Petunjuk ─────────────────────────────────────────────────────
    const wsInfo = workbook.addWorksheet('Petunjuk');
    wsInfo.getColumn('A').width = 90;
    const instructions = [
      ['PETUNJUK PENGISIAN TEMPLATE NILAI'],
      [''],
      ['1. Kolom NIS (*) wajib diisi — sistem akan mencocokkan dengan data siswa.'],
      ['2. Kolom Nama Siswa bersifat informasi, tidak digunakan saat import.'],
      ['3. Nilai diisi dalam rentang 0–100.'],
      ['4. Kolom "Nilai Akhir" bisa dikosongkan (sistem tidak menghitung otomatis).'],
      ['5. Jika siswa sudah punya nilai, data akan diupdate (upsert).'],
      ['6. Hapus baris contoh atau baris kosong sebelum upload.'],
      ['7. Jangan ubah urutan kolom header (baris 2).'],
      ['8. Saat upload, gunakan endpoint:'],
      ['   POST /api/grades/import?class_subject_id=<ID>'],
      ['9. Maksimal ukuran file: 10 MB.'],
    ];
    instructions.forEach((row, i) => {
      const r = wsInfo.getRow(i + 1);
      r.getCell(1).value = row[0];
      if (i === 0) {
        r.getCell(1).font = { bold: true, size: 13, color: { argb: 'FF1F6FEB' } };
        r.height = 28;
      } else {
        r.getCell(1).font = { size: 11 };
        r.height = 18;
      }
    });

    // Kirim file
    const filename = classSubject
      ? `template_nilai_${(classSubject.subject_name || 'mapel').replace(/\s+/g, '_')}.xlsx`
      : 'template_nilai.xlsx';

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Download template nilai error:', err);
    return errorResponse(res, 500, 'Gagal membuat template', err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/grades/import?class_subject_id=xxx
// Upload & proses file Excel nilai siswa
// ─────────────────────────────────────────────────────────────────────────────
async function importGrades(req, res) {
  try {
    const { class_subject_id } = req.query;
    if (!class_subject_id) {
      return errorResponse(res, 400, 'Parameter class_subject_id wajib diisi');
    }

    if (!req.file) {
      return errorResponse(res, 400, 'File Excel wajib diupload');
    }

    // Cek kelas-mapel
    const cs = await ClassSubjectModel.findById(class_subject_id);
    if (!cs) return errorResponse(res, 404, 'Kelas-mata pelajaran tidak ditemukan');

    // Ambil semua siswa di kelas ini (indeks by NIS)
    const studentList = await ClassStudentModel.findStudentsByClass(
      cs.class_id, {}, { limit: 1000, offset: 0 }
    );
    const studentMap  = {}; // NIS -> student_id
    for (const s of studentList) {
      studentMap[String(s.student_number).trim()] = s.student_id;
    }

    // Parse Excel
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const ws = workbook.getWorksheet('Template Nilai') || workbook.worksheets[0];
    if (!ws) return errorResponse(res, 400, 'Sheet "Template Nilai" tidak ditemukan di file');

    const errors  = [];
    const toSave  = [];

    ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
      if (rowNum <= 3) return; // skip judul, header, petunjuk

      const [, studentNumber, , assignmentScore, midtermScore, finalExamScore, finalScore, notes]
        = row.values;

      const nis = String(studentNumber || '').trim();
      if (!nis) return; // baris kosong, skip

      const student_id = studentMap[nis];
      if (!student_id) {
        errors.push({ row: rowNum, nis, message: `NIS "${nis}" tidak ditemukan di kelas ini` });
        return;
      }

      const parseScore = (val) => {
        if (val === null || val === undefined || String(val).trim() === '') return null;
        const n = parseFloat(val);
        if (isNaN(n)) return null;
        if (n < 0 || n > 100) {
          errors.push({ row: rowNum, nis, message: `Nilai harus 0–100, ditemukan: ${val}` });
          return null;
        }
        return n;
      };

      toSave.push({
        rowNum,
        nis,
        student_id,
        class_subject_id,
        assignment_score:  parseScore(assignmentScore),
        midterm_score:     parseScore(midtermScore),
        final_exam_score:  parseScore(finalExamScore),
        final_score:       parseScore(finalScore),
        notes:             notes ? String(notes).trim() : null,
      });
    });

    if (errors.length > 0) {
      return res.status(422).json({
        success: false,
        message: `Terdapat ${errors.length} baris dengan data tidak valid`,
        errors,
      });
    }

    if (toSave.length === 0) {
      return errorResponse(res, 400, 'Tidak ada data nilai yang ditemukan di file');
    }

    // Upsert ke database
    const saved = [];
    for (const g of toSave) {
      const grade = await GradeModel.upsert({
        class_subject_id: g.class_subject_id,
        student_id:       g.student_id,
        assignment_score:  g.assignment_score,
        midterm_score:     g.midterm_score,
        final_exam_score:  g.final_exam_score,
        final_score:       g.final_score,
        notes:             g.notes,
      });
      saved.push(grade);
    }

    return successResponse(res, 200, `${saved.length} data nilai berhasil diimport`, {
      imported_count: saved.length,
      class_subject:  cs,
      grades:         saved,
    });
  } catch (err) {
    console.error('Import grades error:', err);
    return errorResponse(res, 500, 'Gagal mengimport nilai', err.message);
  }
}

module.exports = { downloadTemplate, importGrades };
