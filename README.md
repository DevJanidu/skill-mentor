# SkillMentor

A full-stack skill-mentoring platform connecting students with professional mentors for one-on-one or group sessions. Built for the Sri Lankan market with a modern, mobile-friendly interface.

---

## Features

### Student

- Browse and search mentors and subjects by category
- View detailed mentor profiles (bio, stats, reviews, subjects)
- Book individual or group sessions with a mentor
- Upload payment receipts after booking
- Leave star-rated reviews for completed sessions
- Student dashboard: view upcoming and past sessions

### Mentor

- Onboarding flow to create a profile (title, profession, company, experience, social links)
- Manage availability slots to control when students can book
- Create and manage subjects with thumbnail images
- View and manage incoming session bookings
- Receive session approval notifications
- Mentor dashboard and inbox

### Admin

- Manage all bookings: confirm payment receipts, mark sessions complete, filter by date/status, paginate
- Manage subjects: create, edit with thumbnail URL, delete
- Manage mentors: create, update, delete profiles
- Manage students
- Full CRUD over the platform

---

## Tech Stack

| Layer            | Technology                               |
| ---------------- | ---------------------------------------- |
| Frontend         | React 19, TypeScript, Vite               |
| Styling          | Tailwind CSS v4, shadcn/ui               |
| State / Data     | TanStack Query v5, React Hook Form + Zod |
| Auth             | Clerk (JWT, `publicMetadata.roles`)      |
| Backend          | Spring Boot 3, Java 21                   |
| ORM / DB         | Spring Data JPA, PostgreSQL (Supabase)   |
| Migrations       | Flyway                                   |
| Caching          | Redis                                    |
| Image uploads    | Cloudinary                               |
| Containerization | Docker / Docker Compose                  |

---

## Project Structure

```
skill-mentor-app/
├── frontend/          # React + Vite SPA
│   └── src/
│       ├── pages/     # Route-level page components
│       ├── components/# Reusable UI components
│       ├── hooks/     # TanStack Query hooks (use-queries.ts)
│       ├── lib/       # API client, utilities
│       ├── types/     # Shared TypeScript interfaces
│       └── services/  # axios API layer
└── backend/           # Spring Boot REST API
    └── src/main/java/com/skillmentor/
        ├── controller/
        ├── service/
        ├── entity/
        ├── dto/
        ├── mapper/
        ├── repository/
        └── security/
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Java 21 + Maven
- PostgreSQL database (or Supabase account)
- Redis instance
- Clerk account (for auth)
- Cloudinary account (for image uploads)

---

### Frontend

```bash
cd frontend
npm install
cp .env.example .env        # fill in values (see below)
npm run dev                 # starts on http://localhost:5173
```

#### Frontend Environment Variables (`.env`)

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:8080
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

---

### Backend

```bash
cd backend
cp src/main/resources/application-dev.properties.example src/main/resources/application-dev.properties
# fill in environment variables (see below)
./mvnw spring-boot:run
# or: java -jar target/skillmentor-0.0.1-SNAPSHOT.jar
```

#### Backend Environment Variables

| Variable                 | Description                     |
| ------------------------ | ------------------------------- |
| `SUPERBASE_URL_DEV`      | PostgreSQL JDBC URL             |
| `SUPERBASE_USERNAME_DEV` | DB username                     |
| `SUPERBASE_PASSWORD_DEV` | DB password                     |
| `CLERK_JWKS_URL`         | Clerk JWKS endpoint             |
| `CLERK_ISSUER`           | Clerk issuer URL                |
| `CLERK_AUDIENCE`         | Clerk audience                  |
| `CLERK_SECRET_KEY`       | Clerk secret key                |
| `REDIS_HOST`             | Redis host                      |
| `REDIS_PORT`             | Redis port                      |
| `REDIS_USERNAME`         | Redis username                  |
| `REDIS_PASSWORD`         | Redis password                  |
| `CLUODANARY_CLOUD_NAME`  | Cloudinary cloud name           |
| `CLUODANARY_API_KEY`     | Cloudinary API key              |
| `CLUODANARY_SECRET_KEY`  | Cloudinary API secret           |
| `CORS_ALLOWED_ORIGINS`   | Comma-separated allowed origins |

---

### Docker

```bash
cd backend
docker-compose up --build
```

---

## API Reference

Base URL: `http://localhost:8080`

### Users

| Method | Path                   | Access | Description             |
| ------ | ---------------------- | ------ | ----------------------- |
| POST   | `/api/users/sync`      | Auth   | Sync Clerk user into DB |
| GET    | `/api/users/me`        | Auth   | Get current user        |
| GET    | `/api/users`           | Admin  | List all users          |
| DELETE | `/api/users/{clerkId}` | Admin  | Delete user             |

### Mentors

| Method | Path                              | Access             | Description           |
| ------ | --------------------------------- | ------------------ | --------------------- |
| GET    | `/api/mentors`                    | Public             | List all mentors      |
| GET    | `/api/mentors/{id}`               | Public             | Get mentor profile    |
| GET    | `/api/mentors/{id}/sessions`      | Public             | Get mentor sessions   |
| POST   | `/api/mentors`                    | Mentor/Admin       | Create mentor profile |
| PUT    | `/api/mentors/{id}`               | Mentor (own)/Admin | Update mentor profile |
| DELETE | `/api/mentors/{id}`               | Admin              | Delete mentor         |
| POST   | `/api/mentors/{id}/profile-image` | Mentor (own)/Admin | Upload profile image  |
| POST   | `/api/mentors/{id}/cover-image`   | Mentor (own)/Admin | Upload cover image    |

### Subjects

| Method | Path                 | Access | Description        |
| ------ | -------------------- | ------ | ------------------ |
| GET    | `/api/subjects`      | Public | List all subjects  |
| GET    | `/api/subjects/{id}` | Public | Get subject detail |
| POST   | `/api/subjects`      | Admin  | Create subject     |
| PUT    | `/api/subjects/{id}` | Admin  | Update subject     |
| DELETE | `/api/subjects/{id}` | Admin  | Delete subject     |

### Sessions (Bookings)

| Method | Path                          | Access       | Description            |
| ------ | ----------------------------- | ------------ | ---------------------- |
| GET    | `/api/sessions`               | Admin        | List all sessions      |
| GET    | `/api/sessions/{id}`          | Auth         | Get session detail     |
| POST   | `/api/sessions`               | Student      | Book a session         |
| PUT    | `/api/sessions/{id}`          | Admin        | Update session         |
| DELETE | `/api/sessions/{id}`          | Admin        | Delete session         |
| POST   | `/api/sessions/{id}/receipt`  | Student      | Submit payment receipt |
| POST   | `/api/sessions/{id}/approve`  | Admin/Mentor | Approve session        |
| POST   | `/api/sessions/{id}/reject`   | Admin/Mentor | Reject session         |
| POST   | `/api/sessions/{id}/start`    | Mentor       | Mark session started   |
| POST   | `/api/sessions/{id}/complete` | Admin/Mentor | Mark session complete  |
| POST   | `/api/sessions/{id}/cancel`   | Auth         | Cancel session         |
| POST   | `/api/sessions/{id}/review`   | Student      | Submit review          |

### Availability

| Method | Path                             | Access       | Description                     |
| ------ | -------------------------------- | ------------ | ------------------------------- |
| GET    | `/api/mentors/{id}/availability` | Public       | Get mentor's availability slots |
| POST   | `/api/mentors/{id}/availability` | Mentor (own) | Create availability slot        |
| DELETE | `/api/availability/{id}`         | Mentor (own) | Delete slot                     |

---

## Database Migrations (Flyway)

Migrations live in `backend/src/main/resources/db/migration/`:

| Version | Description                                         |
| ------- | --------------------------------------------------- |
| V1      | Initial schema (users, mentors, subjects, sessions) |
| V2      | Mentor availability                                 |
| V3      | Session receipt & lifecycle columns                 |
| V4      | Open group sessions                                 |
| V5      | Mentor cover image                                  |
| V6      | Session student tracking                            |
| V7      | Mentor social links (LinkedIn, GitHub)              |

---

## Authentication & Roles

Authentication is handled by **Clerk**. After signing in, users sync their profile via `POST /api/users/sync`. Roles are stored in Clerk's `publicMetadata.roles` array:

| Role      | Access                                         |
| --------- | ---------------------------------------------- |
| `STUDENT` | Book sessions, submit receipts, leave reviews  |
| `MENTOR`  | Manage own profile, availability, and sessions |
| `ADMIN`   | Full platform management                       |

Backend endpoints are protected with Spring Security + `@PreAuthorize` annotations validating the Clerk JWT.

---

## Deployment

| Service  | Platform              |
| -------- | --------------------- |
| Frontend | Vercel                |
| Backend  | Railway               |
| Database | Supabase (PostgreSQL) |
| Cache    | Redis Cloud           |
| Images   | Cloudinary            |

---

## License

MIT
