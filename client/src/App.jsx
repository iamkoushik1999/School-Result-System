import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, RoleRoute, Layout } from './components/common';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SchoolProfilePage from './pages/SchoolProfilePage';
import TeachersPage from './pages/TeachersPage';
import StudentsPage from './pages/StudentsPage';
import ExamsPage from './pages/ExamsPage';
import MarksEntryPage from './pages/MarksEntryPage';
import ResultsPage from './pages/ResultsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                {/* All roles */}
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/students" element={<StudentsPage />} />
                <Route path="/marks" element={<MarksEntryPage />} />
                <Route path="/results" element={<ResultsPage />} />

                {/* Principal only */}
                <Route element={<RoleRoute roles={['principal']} />}>
                  <Route path="/school" element={<SchoolProfilePage />} />
                  <Route path="/teachers" element={<TeachersPage />} />
                </Route>

                {/* Principal + Admin */}
                <Route element={<RoleRoute roles={['principal', 'admin']} />}>
                  <Route path="/exams" element={<ExamsPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { fontSize: '14px', borderRadius: '10px' },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
