// ─── Input ──────────────────────────────────────────────────────────────────
export const Input = ({ label, error, className = '', ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <input
      className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 ${error ? 'border-red-400' : 'border-slate-300'} ${className}`}
      {...props}
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

// ─── Select ─────────────────────────────────────────────────────────────────
export const Select = ({ label, error, children, className = '', ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <select
      className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-100 ${error ? 'border-red-400' : 'border-slate-300'} ${className}`}
      {...props}
    >
      {children}
    </select>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

// ─── Button ──────────────────────────────────────────────────────────────────
const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
  ghost: 'bg-transparent border border-slate-300 text-slate-700 hover:bg-slate-50',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
};

export const Button = ({ variant = 'primary', className = '', children, ...props }) => (
  <button
    className={`px-4 py-2 rounded-lg text-sm font-semibold transition disabled:cursor-not-allowed flex items-center gap-2 ${variants[variant]} ${className}`}
    {...props}
  >
    {children}
  </button>
);

// ─── Modal ───────────────────────────────────────────────────────────────────
export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

// ─── Badge ───────────────────────────────────────────────────────────────────
const badgeColors = {
  green: 'bg-emerald-100 text-emerald-700',
  red: 'bg-red-100 text-red-600',
  blue: 'bg-blue-100 text-blue-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  purple: 'bg-purple-100 text-purple-700',
  gray: 'bg-slate-100 text-slate-600',
};

export const Badge = ({ color = 'gray', children }) => (
  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${badgeColors[color]}`}>
    {children}
  </span>
);

// ─── Card ────────────────────────────────────────────────────────────────────
export const Card = ({ className = '', children }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 ${className}`}>
    {children}
  </div>
);

// ─── PageHeader ──────────────────────────────────────────────────────────────
export const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);

// ─── Empty State ─────────────────────────────────────────────────────────────
export const EmptyState = ({ message = 'No data found', icon = '📭' }) => (
  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
    <span className="text-4xl mb-3">{icon}</span>
    <p className="text-sm">{message}</p>
  </div>
);

// ─── Spinner ─────────────────────────────────────────────────────────────────
export const Spinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
  </div>
);

// ─── Confirm Dialog ──────────────────────────────────────────────────────────
export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, loading }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <p className="text-sm text-slate-600 mb-6">{message}</p>
    <div className="flex gap-3 justify-end">
      <Button variant="ghost" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="danger" onClick={onConfirm} disabled={loading}>
        {loading ? 'Deleting...' : 'Delete'}
      </Button>
    </div>
  </Modal>
);
