import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { Card, Spinner } from '../components/ui';
import api from '../services/api';

const Stat = ({ label, value, icon, color }) => (
  <Card className={`p-5 border-l-4 ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-3xl font-bold text-slate-800 mt-1">{value ?? '—'}</p>
      </div>
      <span className="text-3xl opacity-60">{icon}</span>
    </div>
  </Card>
);

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: () => api.get('/students').then((r) => r.data),
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers').then((r) => r.data),
    enabled: user?.role !== 'teacher',
  });

  const { data: exams } = useQuery({
    queryKey: ['exams'],
    queryFn: () => api.get('/exams').then((r) => r.data),
  });

  if (loadingStudents) return <Spinner />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          Good day, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1 capitalize">
          You're signed in as <strong>{user?.role}</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Stat label="Total Students" value={students?.length} icon="🎓" color="border-blue-500" />
        {user?.role !== 'teacher' && (
          <Stat
            label="Total Teachers"
            value={teachers?.length}
            icon="👨‍🏫"
            color="border-purple-500"
          />
        )}
        <Stat label="Exams Created" value={exams?.length} icon="📋" color="border-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-semibold text-slate-700 mb-3">Recent Exams</h3>
          {exams?.length === 0 ? (
            <p className="text-sm text-slate-400">No exams created yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {exams?.slice(0, 5).map((exam) => (
                <li key={exam._id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{exam.examName}</p>
                    <p className="text-xs text-slate-400">
                      Class {exam.class}-{exam.section} · {new Date(exam.date).toLocaleDateString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-slate-700 mb-3">Quick Guide</h3>
          <ul className="text-sm text-slate-500 space-y-2">
            {user?.role === 'principal' && (
              <>
                <li>
                  📌 Go to <strong>Teachers</strong> to add staff and create their login accounts
                </li>
                <li>
                  📌 Use <strong>School Profile</strong> to upload your school logo
                </li>
                <li>📌 View full class results and export as CSV</li>
              </>
            )}
            {user?.role === 'admin' && (
              <>
                <li>
                  📌 Go to <strong>Exams</strong> to create Mid Term, Finals, etc.
                </li>
                <li>
                  📌 Use <strong>Results</strong> to generate and export class reports
                </li>
              </>
            )}
            {user?.role === 'teacher' && (
              <>
                <li>
                  📌 Use <strong>Marks Entry</strong> to enter student marks
                </li>
                <li>
                  📌 View <strong>Results</strong> for your assigned classes
                </li>
              </>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
