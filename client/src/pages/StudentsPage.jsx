import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentSchema } from '../lib/schemas';
import {
  Input, Select, Button, Modal, Badge, Card,
  PageHeader, EmptyState, Spinner, ConfirmDialog,
} from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

const StudentForm = ({ defaultValues, onSubmit, isLoading, isEdit }) => {
  const {
    register, handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(studentSchema),
    defaultValues: defaultValues
      ? {
          ...defaultValues,
          'parentNames.father': defaultValues.parentNames?.father || '',
          'parentNames.mother': defaultValues.parentNames?.mother || '',
        }
      : { isCR: false },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Student Name" {...register('name')} error={errors.name?.message} />
      <div className="grid grid-cols-3 gap-4">
        <Select label="Class" {...register('class')} error={errors.class?.message}>
          <option value="">Class</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Select label="Section" {...register('section')} error={errors.section?.message}>
          <option value="">Section</option>
          {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Input label="Roll Number" type="number" {...register('rollNumber')} error={errors.rollNumber?.message} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Input label="Age" type="number" {...register('age')} error={errors.age?.message} />
        <Input label="Phone" {...register('phone')} error={errors.phone?.message} />
        <Select label="Blood Group" {...register('bloodGroup')}>
          <option value="">Select</option>
          {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Father's Name" {...register('parentNames.father')} />
        <Input label="Mother's Name" {...register('parentNames.mother')} />
      </div>
      <Input label="Address" {...register('address')} />
      <div className="flex items-center gap-2 pt-1">
        <input type="checkbox" id="isCR" {...register('isCR')} className="w-4 h-4 rounded" />
        <label htmlFor="isCR" className="text-sm text-slate-700">Class Representative (CR)</label>
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : isEdit ? 'Update Student' : 'Add Student'}
        </Button>
      </div>
    </form>
  );
};

export default function StudentsPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ class: '', section: '' });
  const [modalState, setModalState] = useState({ open: false, student: null });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students', filters],
    queryFn: () =>
      api.get('/students', { params: { class: filters.class || undefined, section: filters.section || undefined } })
        .then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      // Reshape flat parentNames fields back to nested object
      const { 'parentNames.father': father, 'parentNames.mother': mother, ...rest } = data;
      return api.post('/students', { ...rest, parentNames: { father, mother } });
    },
    onSuccess: () => { toast.success('Student added'); qc.invalidateQueries(['students']); setModalState({ open: false, student: null }); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add student'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      const { 'parentNames.father': father, 'parentNames.mother': mother, ...rest } = data;
      return api.put(`/students/${id}`, { ...rest, parentNames: { father, mother } });
    },
    onSuccess: () => { toast.success('Student updated'); qc.invalidateQueries(['students']); setModalState({ open: false, student: null }); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/students/${id}`),
    onSuccess: () => { toast.success('Student removed'); qc.invalidateQueries(['students']); setDeleteTarget(null); },
  });

  const handleSubmit = (data) => {
    if (modalState.student) updateMutation.mutate({ id: modalState.student._id, data });
    else createMutation.mutate(data);
  };

  if (isLoading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle={`${students.length} student${students.length !== 1 ? 's' : ''}`}
        action={<Button onClick={() => setModalState({ open: true, student: null })}>+ Add Student</Button>}
      />

      {/* Filters */}
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-4">
          <Select value={filters.class} onChange={(e) => setFilters({ ...filters, class: e.target.value })} className="w-36">
            <option value="">All Classes</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((c) => <option key={c} value={c}>Class {c}</option>)}
          </Select>
          <Select value={filters.section} onChange={(e) => setFilters({ ...filters, section: e.target.value })} className="w-36">
            <option value="">All Sections</option>
            {['A', 'B', 'C', 'D', 'E'].map((s) => <option key={s} value={s}>Section {s}</option>)}
          </Select>
          {(filters.class || filters.section) && (
            <button onClick={() => setFilters({ class: '', section: '' })} className="text-sm text-slate-400 hover:text-slate-700">
              Clear filters
            </button>
          )}
        </div>
      </Card>

      <Card>
        {students.length === 0 ? (
          <EmptyState message="No students found" icon="🎓" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Roll', 'Name', 'Class', 'Age', 'Phone', 'Blood', 'CR', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((s) => (
                <tr key={s._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-slate-500">{s.rollNumber}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                  <td className="px-4 py-3"><Badge color="blue">{s.class}-{s.section}</Badge></td>
                  <td className="px-4 py-3 text-slate-500">{s.age}</td>
                  <td className="px-4 py-3 text-slate-500">{s.phone || '—'}</td>
                  <td className="px-4 py-3"><Badge color="purple">{s.bloodGroup || '—'}</Badge></td>
                  <td className="px-4 py-3">{s.isCR ? <Badge color="yellow">CR</Badge> : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="text-blue-500 hover:text-blue-700 text-xs font-medium" onClick={() => setModalState({ open: true, student: s })}>Edit</button>
                      <button className="text-red-400 hover:text-red-600 text-xs font-medium" onClick={() => setDeleteTarget(s)}>Delete</button>
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
        onClose={() => setModalState({ open: false, student: null })}
        title={modalState.student ? 'Edit Student' : 'Add New Student'}
        size="lg"
      >
        <StudentForm
          defaultValues={modalState.student}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
          isEdit={!!modalState.student}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
        loading={deleteMutation.isPending}
        title="Remove Student"
        message={`Remove "${deleteTarget?.name}" from the system?`}
      />
    </div>
  );
}
