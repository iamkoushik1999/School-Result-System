# ResultSys — School Result Management System

**Live Demo:** [https://school-result-system.onrender.com](https://school-result-system.onrender.com)

A full-stack MERN application for managing school exam results. Supports multi-school tenancy with role-based access control for principals, admins, and teachers.

---

## Features

- **Multi-tenant** — each school's data is fully isolated by `schoolId`
- **Role-based access** — three roles with different permissions (principal, admin, teacher)
- **Teacher management** — create teacher accounts with subject and class assignments
- **Student management** — manage students by class and section with roll numbers
- **Exam management** — create exams with multiple subjects and custom max marks
- **Marks entry** — bulk marks entry per subject with live pass/fail preview
- **Result calculation** — automatic percentage, grade, and class rank calculation with tie handling
- **PDF export** — generate individual student result cards as PDF
- **CSV export** — export full class results as CSV
- **School profile** — manage school info and upload logo via Cloudinary
- **Monorepo deployment** — single deployment serves both frontend and backend

---

## Tech Stack

### Backend

| Package               | Purpose              |
| --------------------- | -------------------- |
| Express 5             | HTTP server          |
| MongoDB + Mongoose    | Database             |
| JSON Web Token        | Authentication       |
| Joi                   | Request validation   |
| Multer + Cloudinary   | File uploads         |
| PDFKit                | PDF generation       |
| json2csv              | CSV export           |
| express-async-handler | Async error handling |

### Frontend

| Package               | Purpose                      |
| --------------------- | ---------------------------- |
| React 18              | UI framework                 |
| Vite                  | Build tool                   |
| React Router v6       | Client-side routing          |
| TanStack Query v5     | Server state management      |
| React Hook Form + Zod | Form handling and validation |
| Axios                 | HTTP client                  |
| Tailwind CSS          | Styling                      |
| react-hot-toast       | Notifications                |

---

## Project Structure

```
school-result-system/
├── package.json          # Root — dev/build/start scripts
├── server/               # Express API
│   ├── config/           # DB and Cloudinary initialisation
│   ├── controllers/      # Route handlers (asyncHandler, no try/catch)
│   ├── middlewares/      # auth, validate, errorMiddleware
│   ├── models/           # Mongoose schemas
│   ├── routes/           # Express routers
│   ├── utils/            # cloudinary helpers, resultCalculator, createError
│   ├── validations/      # Joi schemas
│   └── index.js          # App entry point
└── client/               # React SPA
    ├── public/           # Static assets (favicon etc.)
    └── src/
        ├── components/   # UI components and route guards
        ├── context/      # AuthContext
        ├── lib/          # Zod schemas
        ├── pages/        # Page components
        └── services/     # Axios instance
```

---

## Role Permissions

| Action                | Principal | Admin | Teacher              |
| --------------------- | --------- | ----- | -------------------- |
| Manage Teachers       | ✅        | ❌    | ❌                   |
| Manage Students       | ✅        | ✅    | ✅ own classes only  |
| Create / Edit Exams   | ✅        | ✅    | ❌                   |
| Enter Marks           | ✅        | ✅    | ✅ own subjects only |
| View Results          | ✅        | ✅    | ✅                   |
| Export PDF / CSV      | ✅        | ✅    | ✅                   |
| Edit School Profile   | ✅        | ❌    | ❌                   |
| Manage Admin Accounts | ✅        | ❌    | ❌                   |

---

## Local Development

### Prerequisites

- Node.js 20+
- MongoDB Atlas cluster (transactions require a replica set)
- Cloudinary account (free tier is fine)

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/school-result-system.git
cd school-result-system
```

### 2. Install dependencies

```bash
npm install                  # root (installs concurrently)
npm install --prefix server  # backend deps
npm install --prefix client  # frontend deps
```

### 3. Set up environment variables

```bash
cp server/.env.example server/.env
```

Fill in `server/.env`:

```env
PORT=5050
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/school_result_db
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NODE_ENV=development
```

### 4. Run both servers

```bash
npm run dev
```

This starts:

- Backend on `http://localhost:5050`
- Frontend on `http://localhost:5173`

### 5. Create the first account

The first user must register as a principal — this also creates the school record:

```http
POST http://localhost:5050/api/auth/register
Content-Type: application/json

{
  "name": "Dr. Smith",
  "email": "principal@school.edu",
  "password": "secret123",
  "schoolName": "Sunrise Academy",
  "address": "123 Main Street",
  "phone": "9876543210"
}
```

Returns `{ token, user, school }` — use the token as `Bearer <token>` for all subsequent requests.

---

## API Reference

| Method                    | Endpoint                               | Access                    |
| ------------------------- | -------------------------------------- | ------------------------- |
| POST                      | `/api/auth/register`                   | Public                    |
| POST                      | `/api/auth/login`                      | Public                    |
| GET                       | `/api/auth/me`                         | All roles                 |
| GET / PUT                 | `/api/schools`                         | GET: all, PUT: principal  |
| GET / POST / PUT / DELETE | `/api/teachers`                        | Write: principal only     |
| GET / POST / PUT / DELETE | `/api/students`                        | Delete: principal + admin |
| GET / POST / PUT / DELETE | `/api/exams`                           | Write: principal + admin  |
| POST                      | `/api/marks/bulk`                      | All roles                 |
| GET                       | `/api/results/:examId`                 | All roles                 |
| GET                       | `/api/results/:examId/student/:id/pdf` | All roles                 |
| GET                       | `/api/results/:examId/export/csv`      | All roles                 |
| GET / POST / PATCH        | `/api/users`                           | Principal only            |

---

## Deployment (Render)

### 1. Push to GitHub

```bash
git add .
git commit -m "initial commit"
git push origin main
```

### 2. Create a Web Service on Render

Go to [render.com](https://render.com) → New → Web Service → connect your GitHub repo.

| Setting       | Value                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| Build Command | `npm install && npm install --prefix server && npm install --prefix client && npm run build --prefix client` |
| Start Command | `node server/index.js`                                                                                       |
| Node Version  | 20+                                                                                                          |

### 3. Add environment variables in Render dashboard

```
NODE_ENV=production
PORT=5050
MONGO_URI=your_atlas_connection_string
JWT_SECRET=your_secret
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_value
CLOUDINARY_API_KEY=your_value
CLOUDINARY_API_SECRET=your_value
VITE_API_URL=/api
```

### 4. Deploy

Render builds the React app into `client/dist/` then starts Express, which serves both the API and the static frontend from a single process on a single port.

---

## Grade Scale

| Percentage | Grade | Result |
| ---------- | ----- | ------ |
| ≥ 90%      | A+    | Pass   |
| ≥ 80%      | A     | Pass   |
| ≥ 70%      | B     | Pass   |
| ≥ 60%      | C     | Pass   |
| ≥ 50%      | D     | Pass   |
| < 50%      | F     | Fail   |

---

## Environment Variables Reference

| Variable                | Required | Description                                                       |
| ----------------------- | -------- | ----------------------------------------------------------------- |
| `PORT`                  | No       | Server port (default `5050`)                                      |
| `MONGO_URI`             | Yes      | MongoDB Atlas connection string                                   |
| `JWT_SECRET`            | Yes      | Secret for signing JWT tokens                                     |
| `JWT_EXPIRES_IN`        | No       | Token expiry (default `7d`)                                       |
| `CLIENT_URL`            | No       | Frontend origin for CORS in dev (default `http://localhost:5173`) |
| `CLOUDINARY_CLOUD_NAME` | Yes      | Cloudinary dashboard                                              |
| `CLOUDINARY_API_KEY`    | Yes      | Cloudinary dashboard                                              |
| `CLOUDINARY_API_SECRET` | Yes      | Cloudinary dashboard                                              |
| `NODE_ENV`              | Yes      | Set to `production` on Render                                     |
| `VITE_API_URL`          | No       | API base URL for frontend (default `/api`)                        |

---

## License

MIT
