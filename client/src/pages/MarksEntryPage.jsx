import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Select, Button, Card, PageHeader, Spinner, EmptyState } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function MarksEntryPage() {
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [marksMap, setMarksMap] = useState({}); // { studentId: marksObtained }
  const qc = useQueryClient();

  const { data: exams = [] } = useQuery({
    queryKey: ['exams'],
    queryFn: () => api.get('/exams').then((r) => r.data),
  });

  const selectedExam = exams.find((e) => e._id === selectedExamId);
  const selectedSubjectDef = selectedExam?.subjects.find((s) => s.name === selectedSubject);

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students', selectedExam?.class, selectedExam?.section],
    queryFn: () =>
      api.get('/students', {
        params: { class: selectedExam.class, section: selectedExam.section },
      }).then((r) => r.data),
    enabled: !!selectedExam,
  });

  // Load existing marks for this exam so teachers can update
  const { data: existingMarks = [] } = useQuery({
    queryKey: ['marks', selectedExamId],
    queryFn: () => api.get('/marks', { params: { examId: selectedExamId } }).then((r) => r.data),
    enabled: !!selectedExamId,
  });

  // Populate marksMap from existing marks when subject changes
  useEffect(() => {
    if (!selectedSubject || existingMarks.length === 0) {
      setMarksMap({});
      return;
    }
    const map = {};
    existingMarks
      .filter((m) => m.subject === selectedSubject)
      .forEach((m) => {
        const id = m.studentId?._id || m.studentId;
        map[id] = m.marksObtained;
      });
    setMarksMap(map);
  }, [selectedSubject, existingMarks]);

  const bulkMutation = useMutation({
    mutationFn: (payload) => api.post('/marks/bulk', payload),
    onSuccess: ({ data }) => {
      toast.success(`Saved: ${data.upsertedCount} new, ${data.modifiedCount} updated`);
      qc.invalidateQueries(['marks', selectedExamId]);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save marks'),
  });

  const handleSave = () => {
    if (!selectedExam || !selectedSubjectDef) return;

    const marks = students.map((student) => ({
      studentId: student._id,
      examId: selectedExamId,
      subject: selectedSubject,
      marksObtained: parseFloat(marksMap[student._id] ?? 0),
      maxMarks: selectedSubjectDef.maxMarks,
    }));

    // Client-side validation before sending
    const invalid = marks.find((m) => m.marksObtained > selectedSubjectDef.maxMarks);
    if (invalid) {
      const student = students.find((s) => s._id === invalid.studentId);
      return toast.error(`${student?.name}: marks exceed max (${selectedSubjectDef.maxMarks})`);
    }

    bulkMutation.mutate({ marks });
  };

  const allFilled = students.length > 0 && students.every((s) => marksMap[s._id] !== undefined && marksMap[s._id] !== '');

  return (
    <div>
      <PageHeader title="Marks Entry" subtitle="Enter marks by selecting an exam and subject" />

      <Card className="p-5 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Select Exam"
            value={selectedExamId}
            onChange={(e) => {
              setSelectedExamId(e.target.value);
              setSelectedSubject('');
              setMarksMap({});
            }}
          >
            <option value="">-- Choose exam --</option>
            {exams.map((exam) => (
              <option key={exam._id} value={exam._id}>
                {exam.examName} · Class {exam.class}-{exam.section}
              </option>
            ))}
          </Select>

          <Select
            label="Select Subject"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            disabled={!selectedExam}
          >
            <option value="">-- Choose subject --</option>
            {selectedExam?.subjects.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name} (Max: {s.maxMarks})
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {selectedExam && selectedSubject && (
        <>
          {loadingStudents ? (
            <Spinner />
          ) : students.length === 0 ? (
            <Card><EmptyState message="No students found for this class/section" icon="🎓" /></Card>
          ) : (
            <Card>
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-slate-700">{selectedSubject}</span>
                  <span className="text-xs text-slate-400 ml-2">Max marks: {selectedSubjectDef?.maxMarks}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs ${allFilled ? 'text-emerald-600' : 'text-amber-500'}`}>
                    {Object.keys(marksMap).length}/{students.length} filled
                  </span>
                  <Button onClick={handleSave} disabled={bulkMutation.isPending}>
                    {bulkMutation.isPending ? 'Saving...' : '💾 Save Marks'}
                  </Button>
                </div>
              </div>

              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Roll No</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Student Name</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-40">
                      Marks (/{selectedSubjectDef?.maxMarks})
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => {
                    const val = marksMap[student._id];
                    const isOver = val !== undefined && val !== '' && parseFloat(val) > selectedSubjectDef?.maxMarks;
                    return (
                      <tr key={student._id} className="hover:bg-slate-50">
                        <td className="px-5 py-2.5 font-mono text-slate-400 text-xs">{student.rollNumber}</td>
                        <td className="px-5 py-2.5 font-medium text-slate-800">
                          {student.name}
                          {student.isCR && <span className="ml-2 text-xs bg-yellow-100 text-yellow-600 px-1.5 py-0.5 rounded">CR</span>}
                        </td>
                        <td className="px-5 py-2.5">
                          <input
                            type="number"
                            min="0"
                            max={selectedSubjectDef?.maxMarks}
                            step="0.5"
                            value={val ?? ''}
                            onChange={(e) => setMarksMap((prev) => ({ ...prev, [student._id]: e.target.value }))}
                            className={`w-28 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 ${
                              isOver
                                ? 'border-red-400 focus:ring-red-400'
                                : 'border-slate-300 focus:ring-blue-500'
                            }`}
                            placeholder="0"
                          />
                          {isOver && <p className="text-xs text-red-500 mt-0.5">Exceeds max</p>}
                        </td>
                        <td className="px-5 py-2.5">
                          {val !== undefined && val !== '' ? (
                            <span className={`text-xs font-semibold ${parseFloat(val) >= selectedSubjectDef?.maxMarks * 0.5 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {parseFloat(val) >= selectedSubjectDef?.maxMarks * 0.5 ? '✓ Pass' : '✗ Fail'}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
