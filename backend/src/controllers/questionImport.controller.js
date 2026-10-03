const ExcelJS        = require('exceljs');
const QuestionModel  = require('../models/Question.model');
const QuestionOptionModel = require('../models/QuestionOption.model');
const QuestionSetModel    = require('../models/QuestionSet.model');
const { successResponse, errorResponse } = require('../utils/responseHelper');

// ─────────────────────────────────────────────────────────────────────────────
// Helper: warna header
// ─────────────────────────────────────────────────────────────────────────────
function headerStyle(worksheet, rowNumber, bgArgb = 'FF1F6FEB') {
  const row = worksheet.getRow(rowNumber);
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
    cell.font   = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  row.height = 28;
}

function subHeaderStyle(worksheet, rowNumber) {
  const row = worksheet.getRow(rowNumber);
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } };
    cell.font   = { bold: false, italic: true, color: { argb: 'FF333333' }, size: 10 };
    cell.border = {
      top: { style: 'hair' }, bottom: { style: 'hair' },
      left: { style: 'thin' }, right: { style: 'thin' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  });
  row.height = 20;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/questions/template
// Download template Excel soal
// ─────────────────────────────────────────────────────────────────────────────
async function downloadTemplate(req, res) {
  try {
    const workbook  = new ExcelJS.Workbook();
    workbook.creator = 'SIAKAD';
    workbook.created = new Date();

    // ── Sheet 1: Template Soal ────────────────────────────────────────────────
    const ws = workbook.addWorksheet('Template Soal', {
      views: [{ state: 'frozen', ySplit: 3 }],
    });

    // Kolom
    ws.columns = [
      { key: 'no',            header: 'No',              width: 5  },
      { key: 'question_text', header: 'Teks Soal *',     width: 50 },
      { key: 'type',          header: 'Tipe *',          width: 18 },
      { key: 'points',        header: 'Poin',            width: 8  },
      { key: 'explanation',   header: 'Penjelasan',      width: 30 },
      { key: 'opt_a',         header: 'Opsi A *',        width: 25 },
      { key: 'opt_b',         header: 'Opsi B *',        width: 25 },
      { key: 'opt_c',         header: 'Opsi C',          width: 25 },
      { key: 'opt_d',         header: 'Opsi D',          width: 25 },
      { key: 'opt_e',         header: 'Opsi E',          width: 25 },
      { key: 'correct',       header: 'Jawaban Benar *', width: 18 },
    ];

    // Baris 1: Judul
    ws.spliceRows(1, 0, []);  // geser isi ke bawah
    ws.mergeCells('A1:K1');
    const titleCell = ws.getCell('A1');
    titleCell.value     = 'TEMPLATE IMPORT SOAL — SIAKAD';
    titleCell.font      = { bold: true, size: 13, color: { argb: 'FF1F6FEB' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE8FF' } };
    ws.getRow(1).height = 32;

    // Baris 2: Header kolom
    headerStyle(ws, 2);

    // Baris 3: Petunjuk singkat
    ws.getRow(3).values = [
      '', 'Wajib diisi', 'multiple_choice / essay', '1–100 (default 1)',
      'Opsional', 'Teks opsi A', 'Teks opsi B', 'Teks opsi C (opsional)',
      'Teks opsi D (opsional)', 'Teks opsi E (opsional)',
      'Isi A/B/C/D/E (MC) atau "essay" untuk uraian',
    ];
    subHeaderStyle(ws, 3);

    // Baris 4–8: Contoh data
    const examples = [
      [1, 'Siapakah presiden pertama Republik Indonesia?', 'multiple_choice', 2,
       'Ir. Soekarno adalah Presiden RI ke-1',
       'Soeharto', 'Soekarno', 'Habibie', 'Megawati', '', 'B'],
      [2, 'Sebutkan 3 manfaat belajar matematika!', 'essay', 5,
       '', '', '', '', '', '', 'essay'],
      [3, 'Ibukota Indonesia adalah...', 'multiple_choice', 1, '',
       'Surabaya', 'Bandung', 'Jakarta', 'Medan', 'Yogyakarta', 'C'],
    ];

    examples.forEach((row, i) => {
      const r = ws.getRow(4 + i);
      r.values = row;
      r.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: 'hair' }, bottom: { style: 'hair' },
          left: { style: 'thin' }, right: { style: 'thin' },
        };
        cell.alignment = { vertical: 'middle', wrapText: true };
      });
      r.height = 22;
    });

    // Validasi dropdown kolom Tipe
    ws.dataValidations.add('C4:C1000', {
      type: 'list',
      allowBlank: false,
      formulae: ['"multiple_choice,essay"'],
      showErrorMessage: true,
      errorTitle: 'Tipe tidak valid',
      error: 'Pilih antara multiple_choice atau essay',
    });

    // ── Sheet 2: Petunjuk ─────────────────────────────────────────────────────
    const wsInfo = workbook.addWorksheet('Petunjuk');
    wsInfo.getColumn('A').width = 90;
    const instructions = [
      ['PETUNJUK PENGISIAN TEMPLATE SOAL'],
      [''],
      ['1. Kolom bertanda * wajib diisi.'],
      ['2. Tipe soal yang tersedia:'],
      ['   - multiple_choice : soal pilihan ganda (wajib isi Opsi A & B minimal, maks E)'],
      ['   - essay            : soal uraian (kolom Opsi & Jawaban Benar diisi "essay")'],
      ['3. Kolom "Jawaban Benar":'],
      ['   - Untuk multiple_choice: isi dengan huruf opsi (A / B / C / D / E)'],
      ['   - Untuk essay          : isi dengan kata "essay"'],
      ['4. Poin default = 1 jika dikosongkan.'],
      ['5. Hapus baris contoh (baris 4–6) sebelum mengupload.'],
      ['6. Jangan ubah urutan atau nama kolom header (baris 2).'],
      ['7. Pastikan tidak ada baris kosong di tengah data.'],
      ['8. Maksimal ukuran file: 10 MB.'],
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

    // ─────────────────────────────────────────────────────────────────────────
    // Kirim file
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="template_soal.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Download template soal error:', err);
    return errorResponse(res, 500, 'Gagal membuat template', err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/questions/import?question_set_id=xxx
// Upload & proses file Excel soal
// ─────────────────────────────────────────────────────────────────────────────
async function importQuestions(req, res) {
  try {
    const { question_set_id } = req.query;
    if (!question_set_id) {
      return errorResponse(res, 400, 'Parameter question_set_id wajib diisi');
    }

    if (!req.file) {
      return errorResponse(res, 400, 'File Excel wajib diupload');
    }

    // Cek paket soal
    const qs = await QuestionSetModel.findById(question_set_id);
    if (!qs) return errorResponse(res, 404, 'Paket soal tidak ditemukan');

    // Parse Excel dari buffer (memoryStorage)
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const ws = workbook.getWorksheet('Template Soal') || workbook.worksheets[0];
    if (!ws) return errorResponse(res, 400, 'Sheet "Template Soal" tidak ditemukan di file');

    const errors   = [];
    const imported = [];
    let   rowIndex = 0;

    ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
      // Lewati baris 1 (judul), 2 (header), 3 (petunjuk)
      if (rowNum <= 3) return;

      rowIndex++;
      const [
        , questionText, type, points, explanation,
        optA, optB, optC, optD, optE, correct,
      ] = row.values; // row.values[0] = undefined (1-indexed)

      // Validasi wajib
      if (!questionText || String(questionText).trim() === '') {
        errors.push({ row: rowNum, message: 'Teks soal wajib diisi' });
        return;
      }

      const questionType = String(type || 'multiple_choice').trim().toLowerCase();
      if (!['multiple_choice', 'essay'].includes(questionType)) {
        errors.push({ row: rowNum, message: `Tipe soal tidak valid: "${type}"` });
        return;
      }

      if (questionType === 'multiple_choice') {
        if (!optA || !optB) {
          errors.push({ row: rowNum, message: 'Opsi A dan B wajib diisi untuk soal pilihan ganda' });
          return;
        }
        const correctStr = String(correct || '').trim().toUpperCase();
        if (!['A', 'B', 'C', 'D', 'E'].includes(correctStr)) {
          errors.push({ row: rowNum, message: `Jawaban benar tidak valid: "${correct}" (harus A-E)` });
          return;
        }
      }

      imported.push({
        sort_order:    rowIndex,
        question_text: String(questionText).trim(),
        type:          questionType,
        points:        points   ? parseFloat(points)          : 1,
        explanation:   explanation ? String(explanation).trim() : null,
        options: questionType === 'multiple_choice'
          ? buildOptions([optA, optB, optC, optD, optE], String(correct).trim().toUpperCase())
          : [],
      });
    });

    if (errors.length > 0) {
      return res.status(422).json({
        success: false,
        message: `Terdapat ${errors.length} baris dengan data tidak valid`,
        errors,
      });
    }

    if (imported.length === 0) {
      return errorResponse(res, 400, 'Tidak ada data soal yang ditemukan di file');
    }

    // Simpan ke database
    const savedQuestions = [];
    for (const q of imported) {
      const question = await QuestionModel.create({
        question_set_id,
        type:          q.type,
        question_text: q.question_text,
        points:        q.points,
        explanation:   q.explanation,
        sort_order:    q.sort_order,
      });

      if (q.type === 'multiple_choice' && q.options.length > 0) {
        await QuestionOptionModel.bulkReplace(question.id, q.options);
        question.options = await QuestionOptionModel.findByQuestion(question.id);
      }

      savedQuestions.push(question);
    }

    return successResponse(res, 201, `${savedQuestions.length} soal berhasil diimport`, {
      imported_count: savedQuestions.length,
      question_set:   qs,
      questions:      savedQuestions,
    });
  } catch (err) {
    console.error('Import questions error:', err);
    return errorResponse(res, 500, 'Gagal mengimport soal', err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: bangun array options dari kolom A–E
// ─────────────────────────────────────────────────────────────────────────────
function buildOptions(rawOpts, correctLabel) {
  const labels = ['A', 'B', 'C', 'D', 'E'];
  const options = [];

  rawOpts.forEach((text, i) => {
    if (!text || String(text).trim() === '') return;
    options.push({
      label:       labels[i],
      option_text: String(text).trim(),
      is_correct:  labels[i] === correctLabel,
      sort_order:  i,
    });
  });

  return options;
}

module.exports = { downloadTemplate, importQuestions };
