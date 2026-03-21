import { Navigate, Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoImage from '../../assets/book.png';

// ─── Route Guards ────────────────────────────────────────
export const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export const RoleRoute = ({ roles }) => {
  const { user } = useAuth();
  if (!roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};

// ─── Nav items with role visibility ─────────────────────
const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '◉', roles: ['principal', 'teacher', 'admin'] },
  { to: '/school', label: 'School Profile', icon: '🏫', roles: ['principal'] },
  { to: '/teachers', label: 'Teachers', icon: '👨‍🏫', roles: ['principal'] },
  { to: '/students', label: 'Students', icon: '🎓', roles: ['principal', 'teacher', 'admin'] },
  { to: '/exams', label: 'Exams', icon: '📋', roles: ['principal', 'admin'] },
  { to: '/marks', label: 'Marks Entry', icon: '✏️', roles: ['teacher', 'admin', 'principal'] },
  { to: '/results', label: 'Results', icon: '📊', roles: ['principal', 'teacher', 'admin'] },
];

// ─── Main Layout ─────────────────────────────────────────
export const Layout = () => {
  const { user, logout } = useAuth();

  const roleBadgeColor = {
    principal: 'bg-yellow-400/20 text-yellow-300',
    admin: 'bg-blue-400/20 text-blue-300',
    teacher: 'bg-emerald-400/20 text-emerald-300',
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="Logo" className="w-8 h-8 object-contain" />
            <div className="text-lg font-bold tracking-tight text-white">ResultSys</div>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">School Management</div>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV.filter((n) => n.roles.includes(user?.role)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 mx-3 px-3 py-2.5 rounded-lg text-sm transition mb-0.5 ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-slate-800">
          <div
            className={`text-xs px-2 py-0.5 rounded-full inline-block mb-1 capitalize ${roleBadgeColor[user?.role]}`}
          >
            {user?.role}
          </div>
          <div className="text-sm font-medium text-white truncate">{user?.name}</div>
          <div className="text-xs text-slate-500 truncate">{user?.email}</div>
          <button
            onClick={logout}
            className="mt-3 text-xs text-slate-400 hover:text-white transition flex items-center gap-1"
          >
            ← Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
