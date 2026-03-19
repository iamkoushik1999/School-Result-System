# School Result System — Frontend

React + Vite SPA with TanStack Query, Zod validation, React Hook Form, and Tailwind CSS.

---

## Tech Stack

| Package                                   | Purpose                                |
| ----------------------------------------- | -------------------------------------- |
| `react` + `vite`                          | UI framework + dev server              |
| `react-router-dom` v6                     | Client-side routing with nested routes |
| `@tanstack/react-query` v5                | Server state, caching, and mutations   |
| `axios`                                   | HTTP client with JWT interceptors      |
| `zod`                                     | Schema-based form validation           |
| `react-hook-form` + `@hookform/resolvers` | Form state with Zod integration        |
| `react-hot-toast`                         | Toast notifications                    |
| `lucide-react`                            | Icon library                           |
| `tailwindcss`                             | Utility-first styling                  |
| `prettier`                                | Code formatting                        |

---

## Project Structure

```
client/src/
├── main.jsx                        # React DOM root
├── App.jsx                         # Router setup — all routes defined here
├── index.css                       # Tailwind imports + base styles
│
├── context/
│   └── AuthContext.jsx             # Global user state, login(), logout(), hydrate from /me
│
├── services/
│   └── api.js                      # Axios instance — JWT interceptor + 401 redirect
│
├── lib/
│   └── schemas.js                  # All Zod schemas (login, register, teacher, student, exam, school)
│
├── components/
│   ├── common/
│   │   └── index.jsx               # ProtectedRoute, RoleRoute, Layout (sidebar + outlet)
│   └── ui/
│       └── index.jsx               # Input, Select, Button, Modal, Badge, Card,
│                                   # PageHeader, EmptyState, Spinner, ConfirmDialog
│
└── pages/
    ├── LoginPage.jsx               # Glass-morphism login — Zod + RHF
    ├── DashboardPage.jsx           # Stats cards + recent exams + quick guide
    ├── SchoolProfilePage.jsx       # Logo upload (preview) + school details form
    ├── TeachersPage.jsx            # Table + modal form — subject tag chips + class toggle grid
    ├── StudentsPage.jsx            # Table + class/section filters + modal form
    ├── ExamsPage.jsx               # Card grid + dynamic subject rows with useFieldArray
    ├── MarksEntryPage.jsx          # Bulk marks entry — live pass/fail preview + save count feedback
    └── ResultsPage.jsx             # Ranked table — expandable subject breakdown + PDF/CSV export
```

---

## Setup

```bash
cd client
npm install
cp .env.example .env.local   # optional: set VITE_API_URL if backend isn't on :5000
npm run dev
```

Vite dev server runs on `http://localhost:5173` and proxies `/api` → `http://localhost:5000`.

---

## Environment Variables

```
VITE_API_URL=http://localhost:5050/api    # Only needed if not using Vite proxy
```

---

## Routing & Access Control

```
/login                    → Public
/dashboard                → All authenticated roles
/school                   → Principal only
/teachers                 → Principal only
/students                 → All roles (teachers see only assigned classes)
/exams                    → Principal + Admin
/marks                    → All roles (teachers restricted to their subjects)
/results                  → All roles
```

Route guards:

- `<ProtectedRoute>` — redirects to `/login` if no valid token
- `<RoleRoute roles={[...]}>` — redirects to `/dashboard` if role doesn't match

---

## Forms & Validation

Every form uses **React Hook Form + Zod resolver**. All schemas live in `src/lib/schemas.js`.

Example pattern:

```jsx
const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm({
  resolver: zodResolver(teacherSchema),
});
```

Zod handles:

- Type coercion (`z.coerce.number()` for class, rollNumber, age)
- Pattern validation (phone regex)
- Enum validation (blood groups)
- Optional fields with fallbacks
- Cross-field rules (password min only on create, not edit)

---

## Data Fetching Pattern

All server state uses **TanStack Query**:

```jsx
// Read
const { data, isLoading } = useQuery({
  queryKey: ['students', filters],
  queryFn: () => api.get('/students', { params: filters }).then((r) => r.data),
});

// Write
const mutation = useMutation({
  mutationFn: (data) => api.post('/students', data),
  onSuccess: () => {
    toast.success('Student added');
    queryClient.invalidateQueries(['students']); // auto-refetch
  },
  onError: (err) => toast.error(err.response?.data?.message || 'Error'),
});
```

Cache keys are structured as `['resource', ...filterParams]` so filters trigger refetches automatically.

---

## UI Component System

All primitives are in `src/components/ui/index.jsx`:

```jsx
<Input label="Name" error={errors.name?.message} {...register('name')} />
<Select label="Class" {...register('class')}>...</Select>
<Button variant="primary | danger | ghost | success">...</Button>
<Modal isOpen title="Add Teacher" onClose={...}>...</Modal>
<Badge color="green | red | blue | yellow | purple | gray">PASS</Badge>
<Card className="p-5">...</Card>
<PageHeader title="Students" action={<Button>+ Add</Button>} />
<EmptyState message="No data" icon="📭" />
<Spinner />
<ConfirmDialog isOpen onConfirm={...} title="Delete?" message="..." />
```

---

## PDF / CSV Downloads

Downloads use the **Blob + anchor click** pattern — no new tab, no server-side rendering:

```jsx
const res = await api.get(`/results/${examId}/student/${studentId}/pdf`, {
  responseType: 'blob',
});
const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
const a = document.createElement('a');
a.href = url;
a.download = 'result.pdf';
a.click();
URL.revokeObjectURL(url); // prevent memory leak
```

---

## Code Formatting

```bash
npm run format    # prettier --write .
```

Config (`.prettierrc`): single quotes, semicolons, 2-space indent, trailing commas.
