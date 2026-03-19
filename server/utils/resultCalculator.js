/**
 * Derive letter grade from percentage
 */
export const getGrade = ({ percentage }) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
};

/**
 * Calculate full result for a student given their marks and exam subjects.
 * Handles absent students (no mark entry) gracefully — treated as 0.
 *
 * @param {import('../models/Marks.js').default[]} marks
 * @param {{ name: string; maxMarks: number }[]} subjects
 */
export const calculateResult = ({ marks, subjects }) => {
  const totalMaxMarks = subjects.reduce((sum, s) => sum + s.maxMarks, 0);
  const totalObtained = marks.reduce((sum, m) => sum + m.marksObtained, 0);
  const percentage = totalMaxMarks > 0 ? (totalObtained / totalMaxMarks) * 100 : 0;
  const grade = getGrade({ percentage });

  const subjectResults = subjects.map((subject) => {
    const entry = marks.find((m) => m.subject === subject.name);
    return {
      subject: subject.name,
      maxMarks: subject.maxMarks,
      marksObtained: entry?.marksObtained ?? null, // null = not yet entered
    };
  });

  return {
    subjectResults,
    totalObtained,
    totalMaxMarks,
    percentage: parseFloat(percentage.toFixed(2)),
    grade,
    isPassed: percentage >= 50,
  };
};

/**
 * Assign class ranks to an array of result objects sorted by percentage desc.
 * Handles ties — students with the same percentage get the same rank.
 *
 * @param {{ percentage: number }[]} results
 * @returns same array with `rank` field added
 */
export const assignRanks = ({ results }) => {
  const sorted = [...results].sort((a, b) => b.percentage - a.percentage);
  let rank = 1;
  return sorted.map((result, i) => {
    if (i > 0 && sorted[i - 1].percentage !== result.percentage) rank = i + 1;
    return { ...result, rank };
  });
};
