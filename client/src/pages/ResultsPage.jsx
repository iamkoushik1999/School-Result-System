import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, Card, Badge, PageHeader, Spinner, EmptyState } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';

const GRADE_CONFIG = {
  'A+': { color: 'green', label: 'A+' },
  A: { color: 'green', label: 'A' },
  B: { color: 'blue', label: 'B' },
  C: { color: 'yellow', label: 'C' },
  D: { color: 'yellow', label: 'D' },
  F: { color: 'red', label: 'F' },
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export default function ResultsPage() {
  const [selectedExamId, setSelectedExamId] = useState('');
  const [expandedStudent, setExpandedStudent] = useState(null);

  const { data: exams = [] } = useQuery({
    queryKey: ['exams'],
    queryFn: () => api.get('/exams').then((r) => r.data),
  });

  const selectedExam = exams.find((e) => e._id === selectedExamId);

  const {
    data: resultData,
    isLoading: loadingResults,
    isFetching,
  } = useQuery({
    queryKey: ['results', selectedExamId],
    queryFn: () => api.get(`/results/${selectedExamId}`).then((r) => r.data),
    enabled: !!selectedExamId,
  });

  const downloadPDF = async (studentId, studentName) => {
    try {
      const res = await api.get(`/results/${selectedExamId}/student/${studentId}/pdf`, {
        responseType: 'blob',
      });
      downloadBlob(new Blob([res.data], { type: 'application/pdf' }), `result-${studentName}.pdf`);
    } catch {
      toast.error('Failed to download PDF');
    }
  };

  const downloadCSV = async () => {
    try {
      const res = await api.get(`/results/${selectedExamId}/export/csv`, { responseType: 'blob' });
      downloadBlob(
        new Blob([res.data], { type: 'text/csv' }),
        `class-${selectedExam?.class}${selectedExam?.section}-results.csv`,
      );
    } catch {
      toast.error('Failed to export CSV');
    }
  };

  const passCount = resultData?.results.filter((r) => r.isPassed).length ?? 0;
  const total = resultData?.results.length ?? 0;

  return (
    <div>
      <PageHeader title="Results" subtitle="View, analyze and export class results" />

      {/* Exam selector */}
      <Card className="p-4 mb-5">
        <div className="flex items-center gap-4 flex-wrap">
          <Select
            value={selectedExamId}
            onChange={(e) => { setSelectedExamId(e.target.value); setExpandedStudent(null); }}
            className="flex-1 max-w-sm"
          >
            <option value="">-- Select Exam --</option>
            {exams.map((exam) => (
              <option key={exam._id} value={exam._id}>
                {exam.examName} · Class {exam.class}-{exam.section}
              </option>
            ))}
          </Select>

          {selectedExamId && resultData && (
            <button
              onClick={downloadCSV}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition"
            >
              ⬇ Export CSV
            </button>
          )}
        </div>
      </Card>

      {/* Summary stats */}
      {resultData && (
        <div className="grid grid-cols-3 gap-4 mb-5">
          <Card className="p-4 text-center">
            <p className="text-xs text-slate-400 mb-1">Total Students</p>
            <p className="text-2xl font-bold text-slate-800">{total}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-slate-400 mb-1">Pass Rate</p>
            <p className="text-2xl font-bold text-emerald-600">
              {total > 0 ? Math.round((passCount / total) * 100) : 0}%
            </p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-slate-400 mb-1">Class Avg</p>
            <p className="text-2xl font-bold text-blue-600">
              {total > 0
                ? (resultData.results.reduce((s, r) => s + r.percentage, 0) / total).toFixed(1)
                : 0}%
            </p>
          </Card>
        </div>
      )}

      {/* Results table */}
      {loadingResults || isFetching ? (
        <Spinner />
      ) : resultData ? (
        <Card>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Rank', 'Roll', 'Name', 'Total', 'Percentage', 'Grade', 'Result', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resultData.results.map((r) => (
                <>
                  <tr
                    key={r.student._id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() =>
                      setExpandedStudent(expandedStudent === r.student._id ? null : r.student._id)
                    }
                  >
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                        r.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                        r.rank === 2 ? 'bg-slate-300 text-slate-700' :
                        r.rank === 3 ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {r.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400 text-xs">{r.student.rollNumber}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{r.student.name}</td>
                    <td className="px-4 py-3 text-slate-600">{r.totalObtained}/{r.totalMaxMarks}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{r.percentage}%</td>
                    <td className="px-4 py-3">
                      <Badge color={GRADE_CONFIG[r.grade]?.color}>{r.grade}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={r.isPassed ? 'green' : 'red'}>
                        {r.isPassed ? 'PASS' : 'FAIL'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); downloadPDF(r.student._id, r.student.name); }}
                        className="text-blue-500 hover:text-blue-700 text-xs font-medium"
                      >
                        PDF ⬇
                      </button>
                    </td>
                  </tr>

                  {/* Expandable subject breakdown */}
                  {expandedStudent === r.student._id && (
                    <tr key={`${r.student._id}-detail`} className="bg-blue-50">
                      <td colSpan={8} className="px-6 py-3">
                        <div className="flex flex-wrap gap-3">
                          {r.subjectResults.map((sr) => {
                            const pct = sr.marksObtained !== null ? (sr.marksObtained / sr.maxMarks) * 100 : 0;
                            return (
                              <div key={sr.subject} className="bg-white rounded-lg px-3 py-2 text-xs border border-slate-200">
                                <div className="font-medium text-slate-700">{sr.subject}</div>
                                <div className={`mt-0.5 font-bold ${pct >= 50 ? 'text-emerald-600' : 'text-red-500'}`}>
                                  {sr.marksObtained ?? 'Absent'} / {sr.maxMarks}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>

          {resultData.results.length === 0 && (
            <EmptyState message="No students found for this exam" />
          )}
        </Card>
      ) : null}
    </div>
  );
}
