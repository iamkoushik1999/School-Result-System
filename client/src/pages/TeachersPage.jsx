import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherSchema } from '../lib/schemas';
import {
  Input, Select, Button, Modal, Badge, Card,
  PageHeader, EmptyState, Spinner, ConfirmDialog,
} from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const CLASSES = Array.from({ length: 12 }, (_, i) => i + 1);
const COMMON_SUBJECTS = [
  'Mathematics', 'Science', 'English', 'Hindi', 'Social Studies',
  'Physics', 'Chemistry', 'Biology', 'Computer Science', 'History', 'Geography',
];

const TeacherForm = ({ defaultValues, onSubmit, isLoading, isEdit }) => {
  const [subjectInput, setSubjectInput] = useState('');

  const {
    register, handleSubmit, control, watch, setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(teacherSchema),
    defaultValues: defaultValues || { subjects: [], classes: [], isCR: false },
  });

  const subjects = watch('subjects') || [];
  const classes = watch('classes') || [];

  const addSubject = (subject) => {
    if (!subject.trim() || subjects.includes(subject)) return;
    setValue('subjects', [...subjects, subject.trim()]);
    setSubjectInput('');
  };

  const removeSubject = (s) => setValue('subjects', subjects.filter((x) => x !== s));

  const toggleClass = (cls) => {
    const updated = classes.includes(cls) ? classes.filter((c) => c !== cls) : [...classes, cls];
    setValue('classes', updated);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Full Name" {...register('name')} error={errors.name?.message} />
        <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
      </div>
      {!isEdit && (
        <Input label="Password" type="password" {...register('password')} error={errors.password?.message} />
      )}
      <div className="grid grid-cols-3 gap-4">
        <Input label="Age" type="number" {...register('age')} error={errors.age?.message} />
        <Input label="Phone" {...register('phone')} error={errors.phone?.message} />
        <Select label="Blood Group" {...register('bloodGroup')} error={errors.bloodGroup?.message}>
          <option value="">Select</option>
          {BLOOD_GROUPS.map((b) => <option key={b}>{b}</option>)}
        </Select>
      </div>
      <Input label="Address" {...register('address')} error={errors.address?.message} />

      {/* Subjects */}
      <div>
        <label className="text-sm font-medium text-slate-700 block mb-1">Subjects</label>
        <div className="flex gap-2 mb-2">
          <input
            value={subjectInput}
            onChange={(e) => setSubjectInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubject(subjectInput); } }}
            placeholder="Type subject name..."
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button type="button" variant="ghost" onClick={() => addSubject(subjectInput)}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {COMMON_SUBJECTS.map((s) => (
            <button
              key={s} type="button"
              onClick={() => addSubject(s)}
              className={`text-xs px-2 py-1 rounded-full border transition ${subjects.includes(s) ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 text-slate-500 hover:border-blue-400'}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {subjects.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
              {s}
              <button type="button" onClick={() => removeSubject(s)} className="text-blue-400 hover:text-red-500">×</button>
            </span>
          ))}
        </div>
        {errors.subjects && <p className="text-xs text-red-500 mt-1">{errors.subjects.message}</p>}
      </div>

      {/* Classes */}
      <div>
        <label className="text-sm font-medium text-slate-700 block mb-1">Assigned Classes</label>
        <div className="flex flex-wrap gap-1.5">
          {CLASSES.map((cls) => (
            <button
              key={cls} type="button" onClick={() => toggleClass(cls)}
              className={`w-9 h-9 rounded-lg text-sm font-medium border transition ${classes.includes(cls) ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 text-slate-500 hover:border-blue-400'}`}
            >
              {cls}
            </button>
          ))}
        </div>
        {errors.classes && <p className="text-xs text-red-500 mt-1">{errors.classes.message}</p>}
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : isEdit ? 'Update Teacher' : 'Add Teacher'}
        </Button>
      </div>
    </form>
  );
};

export default function TeachersPage() {
  const qc = useQueryClient();
  const [modalState, setModalState] = useState({ open: false, teacher: null });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/teachers', data),
    onSuccess: () => { toast.success('Teacher added'); qc.invalidateQueries(['teachers']); setModalState({ open: false, teacher: null }); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create teacher'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/teachers/${id}`, data),
    onSuccess: () => { toast.success('Teacher updated'); qc.invalidateQueries(['teachers']); setModalState({ open: false, teacher: null }); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update teacher'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/teachers/${id}`),
    onSuccess: () => { toast.success('Teacher deleted'); qc.invalidateQueries(['teachers']); setDeleteTarget(null); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const handleSubmit = (data) => {
    if (modalState.teacher) {
      updateMutation.mutate({ id: modalState.teacher._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Teachers"
        subtitle={`${teachers.length} teacher${teachers.length !== 1 ? 's' : ''} registered`}
        action={<Button onClick={() => setModalState({ open: true, teacher: null })}>+ Add Teacher</Button>}
      />

      <Card>
        {teachers.length === 0 ? (
          <EmptyState message="No teachers added yet" icon="👨‍🏫" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Name', 'Phone', 'Classes', 'Subjects', 'Blood Group', 'Class Teacher', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teachers.map((t) => (
                <tr key={t._id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-medium text-slate-800">{t.name}</td>
                  <td className="px-4 py-3 text-slate-500">{t.phone}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {t.classes.map((c) => <Badge key={c} color="blue">{c}</Badge>)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{t.subjects.join(', ')}</td>
                  <td className="px-4 py-3"><Badge color="purple">{t.bloodGroup || '—'}</Badge></td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {t.classTeacherOf?.class ? `${t.classTeacherOf.class}-${t.classTeacherOf.section}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="text-blue-500 hover:text-blue-700 text-xs font-medium" onClick={() => setModalState({ open: true, teacher: t })}>Edit</button>
                      <button className="text-red-400 hover:text-red-600 text-xs font-medium" onClick={() => setDeleteTarget(t)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal
        isOpen={modalState.open}
        onClose={() => setModalState({ open: false, teacher: null })}
        title={modalState.teacher ? 'Edit Teacher' : 'Add New Teacher'}
        size="lg"
      >
        <TeacherForm
          defaultValues={modalState.teacher}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
          isEdit={!!modalState.teacher}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
        loading={deleteMutation.isPending}
        title="Delete Teacher"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Their login account will also be deactivated.`}
      />
    </div>
  );
}
