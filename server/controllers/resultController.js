// Packages
import expressAsyncHandler from 'express-async-handler';
import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';
// Models
import Exam from '../models/Exam.js';
import Student from '../models/Student.js';
import Marks from '../models/Marks.js';
import School from '../models/School.js';
// Utils
import { calculateResult, assignRanks } from '../utils/resultCalculator.js';
import { createError } from '../utils/createError.js';

// --------------------------------------------------------------------------------------

// Shared helper — build ranked results for an entire exam
const buildResults = async ({ examId, schoolId }) => {
  const exam = await Exam.findOne({ _id: examId, schoolId }).lean();
  if (!exam) throw createError(404, 'Exam not found');

  const students = await Student.find({
    schoolId,
    class: exam.class,
    section: exam.section,
    isActive: true,
  })
    .sort({ rollNumber: 1 })
    .lean();

  const allMarks = await Marks.find({ examId: exam._id, schoolId }).lean();

  const results = students.map((student) => {
    const studentMarks = allMarks.filter((m) => m.studentId.toString() === student._id.toString());
    return {
      student,
      ...calculateResult({
        marks: studentMarks,
        subjects: exam.subjects,
      }),
    };
  });

  const examData = {
    _id: exam._id,
    examName: exam.examName,
    class: exam.class,
    section: exam.section,
    subjects: exam.subjects,
    date: exam.date,
  };

  const resultsData = assignRanks({ results });
  const resultsMap = resultsData.map((ele) => {
    return {
      student: {
        _id: ele.student._id,
        name: ele.student.name,
        class: ele.student.class,
        section: ele.student.section,
        rollNumber: ele.student.rollNumber,
        isCR: ele.student.isCR,
      },
      subjectResults: ele.subjectResults,
      totalObtained: ele.totalObtained,
      totalMaxMarks: ele.totalMaxMarks,
      percentage: ele.percentage,
      grade: ele.grade,
      isPassed: ele.isPassed,
      rank: ele.rank,
    };
  });

  return {
    exam: examData,
    results: resultsMap,
  };
};

// GET /api/results/:examId
export const getExamResults = expressAsyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { examId } = req.params;

  const data = await buildResults({
    examId: examId,
    schoolId: schoolId,
  });

  res.json(data);
});

// GET /api/results/:examId/student/:studentId
export const getStudentResult = expressAsyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { examId, studentId } = req.params;

  const exam = await Exam.findOne({
    _id: examId,
    schoolId: schoolId,
  }).lean();
  if (!exam) throw createError(404, 'Exam not found');

  const student = await Student.findOne({
    _id: studentId,
    schoolId: schoolId,
  }).lean();
  if (!student) throw createError(404, 'Student not found');

  const marks = await Marks.find({
    examId: exam._id,
    studentId: student._id,
  }).lean();
  const result = calculateResult({
    marks,
    subjects: exam.subjects,
  });

  const examData = {
    _id: exam._id,
    examName: exam.examName,
    class: exam.class,
    section: exam.section,
    subjects: exam.subjects,
    date: exam.date,
  };

  const studentData = {
    _id: student._id,
    name: student.name,
    class: student.class,
    section: student.section,
    rollNumber: student.rollNumber,
    isCR: student.isCR,
  };

  res.json({
    exam: examData,
    student: studentData,
    ...result,
  });
});

// GET /api/results/:examId/student/:studentId/pdf
export const downloadStudentResultPDF = expressAsyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { examId, studentId } = req.params;

  const exam = await Exam.findOne({
    _id: examId,
    schoolId: schoolId,
  }).lean();
  if (!exam) throw createError(404, 'Exam not found');

  const student = await Student.findOne({
    _id: studentId,
    schoolId: schoolId,
  }).lean();
  if (!student) throw createError(404, 'Student not found');

  const school = await School.findById(schoolId).lean();
  if (!school) throw createError(404, 'School not found');

  const marks = await Marks.find({ examId: exam._id, studentId: student._id }).lean();
  const result = calculateResult({ marks, subjects: exam.subjects });

  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="result-${student.name.replace(/\s+/g, '_')}-${exam.examName.replace(/\s+/g, '_')}.pdf"`,
  );
  doc.pipe(res);

  // ── Header ────────────────────────────────────────────────
  doc.fontSize(18).font('Helvetica-Bold').text(school.schoolName, { align: 'center' });
  doc.fontSize(10).font('Helvetica').text(school.address, { align: 'center' });
  doc.text(`Phone: ${school.phone}  |  Email: ${school.email}`, { align: 'center' });
  doc.moveDown(0.5);
  doc
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .strokeColor('#2563eb')
    .lineWidth(2)
    .stroke()
    .strokeColor('#000')
    .lineWidth(1);
  doc.moveDown(0.5);

  // ── Exam title ─────────────────────────────────────────────
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .text(`${exam.examName} — Result Card`, { align: 'center' });
  doc
    .fontSize(10)
    .font('Helvetica')
    .text(
      `Date: ${new Date(exam.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      { align: 'center' },
    );
  doc.moveDown();

  // ── Student info ───────────────────────────────────────────
  doc.fontSize(11).font('Helvetica-Bold').text('Student Information');
  doc.font('Helvetica').fontSize(10);
  const infoY = doc.y;
  doc.text(`Name: ${student.name}`, 50, infoY);
  doc.text(`Class: ${student.class} — ${student.section}`, 300, infoY);
  doc.text(`Roll No: ${student.rollNumber}`, 50);
  doc.moveDown();

  // ── Marks table ────────────────────────────────────────────
  const col = { subject: 50, max: 280, obtained: 380, remarks: 460 };
  const tableTop = doc.y;

  doc.font('Helvetica-Bold').fontSize(10);
  doc.text('Subject', col.subject, tableTop);
  doc.text('Max Marks', col.max, tableTop);
  doc.text('Obtained', col.obtained, tableTop);
  doc.text('Remarks', col.remarks, tableTop);
  doc.moveDown(0.3);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.3);
  doc.font('Helvetica');

  for (const sr of result.subjectResults) {
    const y = doc.y;
    const pct = sr.marksObtained !== null ? (sr.marksObtained / sr.maxMarks) * 100 : 0;
    const passed = pct >= 50;
    doc.text(sr.subject, col.subject, y);
    doc.text(String(sr.maxMarks), col.max, y);
    doc.text(sr.marksObtained !== null ? String(sr.marksObtained) : 'Absent', col.obtained, y);
    doc
      .fillColor(sr.marksObtained === null ? '#999' : passed ? '#16a34a' : '#dc2626')
      .text(sr.marksObtained === null ? '—' : passed ? 'Pass' : 'Fail', col.remarks, y)
      .fillColor('#000');
    doc.moveDown(0.3);
  }

  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.5);

  // ── Summary ────────────────────────────────────────────────
  doc.font('Helvetica-Bold').fontSize(11);
  doc.text(
    `Total: ${result.totalObtained} / ${result.totalMaxMarks}   |   ` +
      `Percentage: ${result.percentage}%   |   Grade: ${result.grade}   |   ` +
      `Result: ${result.isPassed ? 'PASS ✓' : 'FAIL ✗'}`,
  );
  doc.moveDown(4);

  // ── Signatures ─────────────────────────────────────────────
  doc.font('Helvetica').fontSize(10);
  doc.text('Class Teacher Signature: ________________________', 50);
  doc.text('Principal Signature: ________________________', 310, doc.y - doc.currentLineHeight());

  doc.end();
});

// GET /api/results/:examId/export/csv
export const exportClassResultCSV = expressAsyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { examId } = req.params;
  const { exam, results } = await buildResults({
    examId: examId,
    schoolId: schoolId,
  });

  const rows = results.map(
    ({
      student,
      subjectResults,
      totalObtained,
      totalMaxMarks,
      percentage,
      grade,
      isPassed,
      rank,
    }) => {
      const subjectCols = {};
      subjectResults.forEach((sr) => {
        subjectCols[sr.subject] = sr.marksObtained ?? 'Absent';
      });
      return {
        Rank: rank,
        'Roll No': student.rollNumber,
        Name: student.name,
        ...subjectCols,
        Total: `${totalObtained}/${totalMaxMarks}`,
        'Percentage (%)': percentage,
        Grade: grade,
        Result: isPassed ? 'Pass' : 'Fail',
      };
    },
  );

  const parser = new Parser();
  const csv = parser.parse(rows);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="class-${exam.class}${exam.section}-${exam.examName.replace(/\s+/g, '_')}.csv"`,
  );
  res.send(csv);
});
