import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { examSchema } from '../lib/schemas';
import {
  Input, Select, Button, Modal, Badge, Card,
  PageHeader, EmptyState, Spinner, ConfirmDialog,
} from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';

const ExamForm = ({ defaultValues, onSubmit, isLoading, isEdit }) => {
  const {
    register, handleSubmit, control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(examSchema),
    defaultValues: defaultValues
      ? { ...defaultValues, date: new Date(defaultValues.date).toISOString().split('T')[0] }
      : { subjects: [{ name: '', maxMarks: 100 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'subjects' });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Exam Name" placeholder="e.g. Mid Term Exam" {...register('examName')} error={errors.examName?.message} />
      <div className="grid grid-cols-3 gap-4">
        <Select label="Class" {...register('class')} error={errors.class?.message}>
          <option value="">Select</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select label="Section" {...register('section')} error={errors.section?.message}>
          <option value="">Select</option>
          {['A', 'B', 'C', 'D', 'E'].map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Input label="Exam Date" type="date" {...register('date')} error={errors.date?.message} />
      </div>

      {/* Dynamic subjects */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-700">Subjects & Max Marks</label>
          <button
            type="button"
            onClick={() => append({ name: '', maxMarks: 100 })}
            className="text-xs text-blue-600 font-medium hover:underline"
          >
            + Add Subject
          </button>
        </div>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-start">
              <Input
                placeholder="Subject name"
                {...register(`subjects.${index}.name`)}
                error={errors.subjects?.[index]?.name?.message}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Max"
                {...register(`subjects.${index}.maxMarks`)}
                error={errors.subjects?.[index]?.maxMarks?.message}
                className="w-24"
              />
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="mt-1.5 text-red-400 hover:text-red-600 text-lg leading-none"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        {errors.subjects?.message && (
          <p className="text-xs text-red-500 mt-1">{errors.subjects.message}</p>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : isEdit ? 'Update Exam' : 'Create Exam'}
        </Button>
      </div>
    </form>
  );
};

export default function ExamsPage() {
  const qc = useQueryClient();
  const [modalState, setModalState] = useState({ open: false, exam: null });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: () => api.get('/exams').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/exams', data),
    onSuccess: () => { toast.success('Exam created'); qc.invalidateQueries(['exams']); setModalState({ open: false, exam: null }); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create exam'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/exams/${id}`, data),
    onSuccess: () => { toast.success('Exam updated'); qc.invalidateQueries(['exams']); setModalState({ open: false, exam: null }); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update exam'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/exams/${id}`),
    onSuccess: () => { toast.success('Exam deleted'); qc.invalidateQueries(['exams']); setDeleteTarget(null); },
  });

  const handleSubmit = (data) => {
    if (modalState.exam) updateMutation.mutate({ id: modalState.exam._id, data });
    else createMutation.mutate(data);
  };

  if (isLoading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Exams"
        subtitle={`${exams.length} exam${exams.length !== 1 ? 's' : ''} created`}
        action={<Button onClick={() => setModalState({ open: true, exam: null })}>+ Create Exam</Button>}
      />

      {exams.length === 0 ? (
        <Card><EmptyState message="No exams created yet" icon="📋" /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {exams.map((exam) => (
            <Card key={exam._id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-800">{exam.examName}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(exam.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <Badge color="blue">{exam.class}-{exam.section}</Badge>
              </div>

              <div className="space-y-1 mb-4">
                {exam.subjects.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-xs text-slate-500">
                    <span>{s.name}</span>
                    <span className="font-medium text-slate-700">/{s.maxMarks}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setModalState({ open: true, exam })}
                  className="text-xs text-blue-500 font-medium hover:text-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteTarget(exam)}
                  className="text-xs text-red-400 font-medium hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalState.open}
        onClose={() => setModalState({ open: false, exam: null })}
        title={modalState.exam ? 'Edit Exam' : 'Create New Exam'}
        size="lg"
      >
        <ExamForm
          defaultValues={modalState.exam}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
          isEdit={!!modalState.exam}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
        loading={deleteMutation.isPending}
        title="Delete Exam"
        message={`Delete "${deleteTarget?.examName}"? This cannot be undone.`}
      />
    </div>
  );
}
