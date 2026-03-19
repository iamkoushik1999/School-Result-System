# School Result System — Backend

Node.js + Express + MongoDB REST API with JWT auth, Joi validation, Cloudinary uploads, PDF generation, and CSV export.

---

## Tech Stack

| Package | Purpose |
|---------|---------|
| `express` | HTTP server and routing |
| `mongoose` | MongoDB ODM |
| `jsonwebtoken` | JWT auth tokens |
| `bcryptjs` | Password hashing |
| `joi` | Request body validation |
| `cloudinary` + `streamifier` | Logo upload via buffer stream |
| `multer` | Multipart parsing (memory storage) |
| `pdfkit` | PDF marksheet generation |
| `json2csv` | Class result CSV export |
| `prettier` | Code formatting |

---

## Project Structure

```
server/
├── index.js                    # Express app + DB connection
├── routes.js                   # All routes connection
├── .env.example                # Required environment variables
├── .prettierrc                 # Prettier config
├── ..gitignore                 # Gitignore config
│
├── config/
│   ├── cloudinary.js           # Cloudinary config
│   ├── db.js                   # Database config
|
├── models/
│   ├── User.js                 # Auth user (principal/teacher/admin)
│   ├── School.js               # School profile + Cloudinary logo fields
│   ├── Teacher.js              # Teacher profile with class/subject assignments
│   ├── Student.js              # Student with compound unique roll index
│   ├── Exam.js                 # Exam with embedded subjects array
│   └── Marks.js                # Student marks with unique student+exam+subject index
│
├── controllers/
│   ├── authController.js       # Register principal, login, /me
│   ├── schoolController.js     # Get/update school, Cloudinary upload
│   ├── teacherController.js    # CRUD — transactions for create/delete
│   ├── studentController.js    # CRUD — teacher class access enforced
│   ├── examController.js       # CRUD
│   ├── marksController.js      # Bulk upsert, teacher subject enforcement
│   ├── resultController.js     # Result calc, PDF, CSV
│   └── userController.js       # Admin account management
│
├── routes/
│   ├── auth.js
│   ├── schools.js
│   ├── teachers.js
│   ├── students.js
│   ├── exams.js
│   ├── marks.js
│   ├── results.js
│   └── users.js
│
├── middlewares/
│   ├── auth.js                 # authenticate, authorize(...roles)
│   └── errorMiddlewate.js      # Common Error Hadler 
│   └── validate.js             # Joi validation middleware factory
│
├── validations/
│   ├── authValidation.js       # registerPrincipalSchema, loginSchema
│   ├── userValidation.js       # adminSchema
│   ├── teacherValidation.js    # createTeacherSchema, updateTeacherSchema
│   ├── studentValidation.js    # createStudentSchema, updateStudentSchema
│   └── examValidation.js       # createExamSchema, updateExamSchema, bulkMarksSchema, schoolUpdateSchema
│
└── utils/
    ├── cloudinary.js           # Cloudinary config + uploadToCloudinary(), deleteFromCloudinary()
    ├── resultCalculator.js     # getGrade(), calculateResult(), assignRanks() (handles ties)
    └── createError.js          # HTTP error factory
```

---

## Setup

### 1. Install dependencies
```bash
cd server
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```

Fill in `.env`:
```
MONGO_URI=mongodb+srv://...      # MongoDB Atlas recommended (needs replica set for transactions)
JWT_SECRET=a_very_long_random_string
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### 3. Run
```bash
npm run dev      # development with nodemon
npm start        # production
```

---

## ⚠️ MongoDB Transactions Requirement

Teacher create and delete use MongoDB transactions (atomic User + Teacher creation).  
Transactions require a **replica set**. Options:

- **MongoDB Atlas free tier** — replica set by default ✅ (recommended)
- **Local single node replica set** — run: `mongod --replSet rs0` then in mongo shell: `rs.initiate()`

---

## API Reference

### Auth
| Method | Path | Body | Access |
|--------|------|------|--------|
| POST | `/api/auth/register` | `name, email, password, schoolName, address, phone` | Public |
| POST | `/api/auth/login` | `email, password` | Public |
| GET | `/api/auth/me` | — | Authenticated |

### Schools
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/schools` | All roles |
| PUT | `/api/schools` | Principal only · multipart/form-data with `logo` file |

### Teachers
| Method | Path | Access |
|--------|------|--------|
| GET | `/api/teachers` | All roles |
| POST | `/api/teachers` | Principal |
| PUT | `/api/teachers/:id` | Principal |
| DELETE | `/api/teachers/:id` | Principal |

### Students
| Method | Path | Access |
|--------|------|--------|
| GET | `/api/students?class=5&section=A` | All roles (teachers scoped to their classes) |
| POST | `/api/students` | All roles |
| PUT | `/api/students/:id` | All roles |
| DELETE | `/api/students/:id` | Principal, Admin |

### Exams
| Method | Path | Access |
|--------|------|--------|
| GET | `/api/exams?class=5&section=A` | All roles |
| POST | `/api/exams` | Admin, Principal |
| PUT | `/api/exams/:id` | Admin, Principal |
| DELETE | `/api/exams/:id` | Admin, Principal |

### Marks
| Method | Path | Body | Access |
|--------|------|------|--------|
| GET | `/api/marks?examId=&studentId=` | — | All roles |
| POST | `/api/marks/bulk` | `{ marks: [...] }` | All roles (teacher access enforced) |
| PUT | `/api/marks/:id` | `{ marksObtained }` | All roles |

### Results
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/results/:examId` | Full ranked class result |
| GET | `/api/results/:examId/student/:studentId` | Single student result |
| GET | `/api/results/:examId/student/:studentId/pdf` | Streams PDF download |
| GET | `/api/results/:examId/export/csv` | Streams CSV download |

### Users (Principal only)
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/users` | All school users |
| POST | `/api/users/admin` | Create office admin account |
| PATCH | `/api/users/:id/toggle` | Activate/deactivate user |

---

## Validation

All request bodies pass through Joi schemas in `/validations/`.  
Invalid requests return `422` with per-field error details:

```json
{
  "message": "Validation failed",
  "details": [
    { "field": "email", "message": "email must be a valid email" },
    { "field": "age", "message": "age must be greater than or equal to 18" }
  ]
}
```

---

## Grade Logic

| Percentage | Grade |
|-----------|-------|
| ≥ 90 | A+ |
| ≥ 80 | A |
| ≥ 70 | B |
| ≥ 60 | C |
| ≥ 50 | D |
| < 50 | F (Fail) |

Pass threshold: **50%**

Ranking handles **ties** — students with the same percentage receive the same rank.

---

## Cloudinary Upload Flow

```
Client (multipart/form-data)
  → multer (memory storage, 2MB limit, image-only filter)
  → buffer streamed to Cloudinary via streamifier
  → secure_url + public_id saved to School document
  → old logo deleted from Cloudinary on logo replacement
```

---

## Code Formatting

```bash
npm run format    # prettier --write .
```

Config (`.prettierrc`): single quotes, semicolons, 2-space indent, trailing commas.
