import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolSchema } from '../lib/schemas';
import { Input, Button, Card, PageHeader, Spinner } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function SchoolProfilePage() {
  const qc = useQueryClient();
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  const { data: school, isLoading } = useQuery({
    queryKey: ['school'],
    queryFn: () => api.get('/schools').then((r) => r.data),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schoolSchema) });

  useEffect(() => {
    if (school) {
      reset({
        schoolName: school.schoolName,
        address: school.address,
        phone: school.phone,
        email: school.email,
        principalName: school.principalName,
      });
      setLogoPreview(school.logo || null);
    }
  }, [school, reset]);

  const mutation = useMutation({
    mutationFn: (data) => {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => fd.append(k, v));
      if (logoFile) fd.append('logo', logoFile);
      return api.put('/schools', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      toast.success('School profile updated');
      qc.invalidateQueries(['school']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error('Logo must be under 2MB');
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  if (isLoading) return <Spinner />;

  return (
    <div>
      <PageHeader title="School Profile" subtitle="Update your school information and logo" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logo Card */}
        <Card className="p-6 flex flex-col items-center gap-4 h-fit">
          <div className="w-32 h-32 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
            {logoPreview ? (
              <img src={logoPreview} alt="School logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl">🏫</span>
            )}
          </div>
          <div className="text-center">
            <label
              htmlFor="logo-upload"
              className="cursor-pointer text-sm text-blue-600 font-medium hover:underline"
            >
              {logoPreview ? 'Change Logo' : 'Upload Logo'}
            </label>
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
            <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP · Max 2MB</p>
          </div>
        </Card>

        {/* Form */}
        <Card className="p-6 lg:col-span-2">
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <Input
              label="School Name"
              {...register('schoolName')}
              error={errors.schoolName?.message}
            />
            <Input
              label="Principal Name"
              {...register('principalName')}
              error={errors.principalName?.message}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Phone" {...register('phone')} error={errors.phone?.message} />
              <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
            </div>
            <Input
              label="Address"
              {...register('address')}
              error={errors.address?.message}
            />
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
