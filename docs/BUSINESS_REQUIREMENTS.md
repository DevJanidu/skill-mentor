# SkillMentor — Full Business Requirements Document

> **Branch:** `dev`  
> **Last Updated:** March 4, 2026  
> **Stack:** Spring Boot 3 (Java) · PostgreSQL · Clerk Auth · React + Vite + TailwindCSS · Cloudinary

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Actors & Roles](#2-actors--roles)
3. [User Journeys A → Z](#3-user-journeys-a--z)
   - [3.1 Sign-Up & Onboarding](#31-sign-up--onboarding)
   - [3.2 Student Journey](#32-student-journey)
   - [3.3 Mentor Journey](#33-mentor-journey)
   - [3.4 Admin Journey](#34-admin-journey)
4. [Functional Requirements](#4-functional-requirements)
   - [4.1 Authentication & Identity](#41-authentication--identity)
   - [4.2 Onboarding & Role Selection](#42-onboarding--role-selection)
   - [4.3 Mentor Profile Management](#43-mentor-profile-management)
   - [4.4 Subject Management](#44-subject-management)
   - [4.5 Session Management (Mentor Side)](#45-session-management-mentor-side)
   - [4.6 Session Booking (Student Side)](#46-session-booking-student-side)
   - [4.7 Payment Slip Flow](#47-payment-slip-flow)
   - [4.8 Session Lifecycle & Status](#48-session-lifecycle--status)
   - [4.9 Reviews & Ratings](#49-reviews--ratings)
   - [4.10 Admin Controls](#410-admin-controls)
5. [Data Model](#5-data-model)
6. [API Endpoint Catalogue](#6-api-endpoint-catalogue)
   - [6.1 ✅ Implemented Endpoints](#61--implemented-endpoints)
   - [6.2 ❌ Missing Endpoints (To Build)](#62--missing-endpoints-to-build)
7. [Frontend Page Inventory](#7-frontend-page-inventory)
   - [7.1 ✅ Existing Pages](#71--existing-pages)
   - [7.2 ❌ Missing Pages / UIs (To Build)](#72--missing-pages--uis-to-build)
8. [Missing Backend Logic](#8-missing-backend-logic)
9. [Missing Frontend Logic](#9-missing-frontend-logic)
10. [Non-Functional Requirements](#10-non-functional-requirements)
11. [Prioritised Build Backlog](#11-prioritised-build-backlog)

---

## 1. Product Overview

**SkillMentor** is a marketplace platform that connects **Students** who want to learn a skill with **Mentors** who are domain experts. Students find mentors by subject area, request one-on-one or group sessions, pay via bank transfer (slip upload), and receive a meeting link once the mentor confirms payment. An **Admin** oversees the whole ecosystem: users, mentors, students, and bookings.

### Value proposition

| For Students                         | For Mentors                    | For Admin                 |
| ------------------------------------ | ------------------------------ | ------------------------- |
| Browse expert mentors by subject     | Monetise expertise             | Full platform oversight   |
| Book individual or group sessions    | Create & manage subjects       | User & booking management |
| Learn at a scheduled, confirmed time | Accept/reject session requests | Revenue visibility        |

---

## 2. Actors & Roles

| Role      | Description                                                 | How they get the role                    |
| --------- | ----------------------------------------------------------- | ---------------------------------------- |
| `USER`    | Any authenticated user who has not yet completed onboarding | Auto-assigned at first sign-in via Clerk |
| `STUDENT` | A learner who can browse, book, pay, and review sessions    | Self-selected during onboarding          |
| `MENTOR`  | A subject-matter expert who creates subjects & sessions     | Self-selected during onboarding          |
| `ADMIN`   | Platform operator with full CRUD access to all resources    | Assigned manually (Clerk publicMetadata) |

> A user can hold **one primary role** (`STUDENT` or `MENTOR`) set during onboarding. An `ADMIN` can manage all resources. A future enhancement may allow a user to be both STUDENT and MENTOR.

---

## 3. User Journeys A → Z

### 3.1 Sign-Up & Onboarding

```
[User visits app]
      │
      ▼
[Sign in with Clerk (Google / email)]
      │
      ├── First visit → POST /api/users/sync  ← JWT claims written to DB
      │
      ▼
[OnboardingGuard detects onboardingCompleted = false]
      │
      ▼
[/onboarding — Role Selection Page]
      │
      ├── Select STUDENT  ──► fill studentCode + learningGoals
      │                          └─► POST /api/onboarding/complete  { role: "STUDENT" }
      │                          └─► POST /api/students  (create student profile)
      │                          └─► Redirect to /dashboard
      │
      └── Select MENTOR   ──► fill title, profession, company, years, bio
                              └─► POST /api/onboarding/complete  { role: "MENTOR" }
                              └─► POST /api/mentors  (create mentor profile)
                              └─► Redirect to /dashboard
```

**Onboarding writes:**

1. Clerk `publicMetadata.roles` updated via Clerk Backend API.
2. `users.onboarding_completed = true` in DB.
3. Student or Mentor profile row created.

---

### 3.2 Student Journey

```
[Student logs in]
      │
      ▼
[Dashboard — /dashboard]
  • List of upcoming sessions (PENDING / SCHEDULED)
  • History of COMPLETED sessions
  • Pending payment uploads
      │
      ├──► Browse Mentors (/mentors)
      │       · Filter by subject, rating
      │       · View mentor profile (/mentors/:id)
      │             · List of subjects
      │             · List of available sessions
      │
      ├──► Browse Subjects (/subjects)
      │       · Subject list (all mentors)
      │       · Subject detail (/subjects/:id)
      │             · Sessions available under this subject
      │
      ├──► Book a Session
      │       · From mentor profile → pick a subject → Calendar / time picker
      │       · Select INDIVIDUAL or GROUP
      │       · POST /api/sessions/book  → session created with status PENDING
      │       · Redirect to Payment Page (/payment/:sessionId)
      │
      ├──► Upload Payment Slip (/payment/:sessionId)
      │       · Bank slip PNG/JPG/PDF uploaded to Cloudinary
      │       · PATCH /api/sessions/:id/submit-receipt  { receiptUrl }
      │       · Session status → PENDING_PAYMENT_REVIEW
      │
      ├──► Awaiting Mentor Confirmation
      │       · Mentor reviews slip → APPROVED or REJECTED
      │       · If APPROVED → session status → SCHEDULED, meeting link available
      │       · If REJECTED → student notified, can re-submit
      │
      ├──► Attend Session (meeting link shown on dashboard)
      │
      ├──► Leave Review & Rating (after COMPLETED)
      │       · POST /api/sessions/:id/review  { review, rating }
      │
      └──► Join Open Group Session
              · Browse group sessions with available seats
              · POST /api/sessions/:id/join  (attaches student to session)
              · Redirect to Payment Page
```

---

### 3.3 Mentor Journey

```
[Mentor logs in]
      │
      ▼
[Mentor Dashboard — /dashboard]
  • Pending booking requests (with receipt thumbnails)
  • Upcoming SCHEDULED sessions
  • Subjects I teach
      │
      ├──► Manage Profile (/mentor/profile)
      │       · Edit title, profession, bio, photo
      │       · PUT /api/mentors/:id
      │
      ├──► Manage Subjects (/mentor/subjects)
      │       · Create subject  → POST /api/subjects
      │       · Edit / Delete   → PUT/DELETE /api/subjects/:id
      │
      ├──► Create a Session (/mentor/sessions/new)
      │       · Pick subject, type (INDIVIDUAL / GROUP), maxParticipants
      │       · Set date/time, duration
      │       · POST /api/sessions
      │
      ├──► Review Incoming Bookings (/mentor/bookings)
      │       · See session detail + student payment slip image
      │       · PATCH /api/sessions/:id/approve   → status SCHEDULED, add meeting link
      │       · PATCH /api/sessions/:id/reject    → status CANCELED, reason optional
      │
      ├──► Start Session
      │       · PATCH /api/sessions/:id/start    → status STARTED
      │
      └──► Complete Session
              · PATCH /api/sessions/:id/complete  → status COMPLETED
              · Add session notes
```

---

### 3.4 Admin Journey

```
[Admin logs in]
      │
      ▼
[Admin Dashboard — /admin]
  • Platform stats: total users, mentors, students, sessions (by status)
      │
      ├──► Manage Users (/admin/users)
      │       · View all users + roles
      │       · Change roles  PUT /api/onboarding/roles
      │       · Delete user   DELETE /api/users/:clerkId
      │
      ├──► Manage Mentors (/admin/mentors)
      │       · View / edit / delete mentor profiles
      │
      ├──► Manage Subjects (/admin/subjects)
      │       · View, edit, delete any subject
      │
      ├──► Manage Bookings (/admin/bookings)
      │       · See all sessions (all statuses)
      │       · Force-approve, force-cancel any session
      │
      └──► Manage Students (/admin/students)  ← MISSING PAGE
              · View all student profiles
              · Delete student
```

---

## 4. Functional Requirements

### 4.1 Authentication & Identity

| #       | Requirement                                                                   | Status  |
| ------- | ----------------------------------------------------------------------------- | ------- |
| AUTH-01 | Users sign in via Clerk (Google OAuth or email/password)                      | ✅ Done |
| AUTH-02 | JWT from Clerk is validated on every API request                              | ✅ Done |
| AUTH-03 | User record auto-synced to local DB on first request (`POST /api/users/sync`) | ✅ Done |
| AUTH-04 | Roles stored in both Clerk `publicMetadata` and local DB `user_roles` table   | ✅ Done |
| AUTH-05 | Route guards on frontend redirect unauthenticated users to login              | ✅ Done |
| AUTH-06 | `OnboardingGuard` redirects un-onboarded users to `/onboarding`               | ✅ Done |

---

### 4.2 Onboarding & Role Selection

| #      | Requirement                                                                 | Status  |
| ------ | --------------------------------------------------------------------------- | ------- |
| ONB-01 | New users land on onboarding page before any other protected page           | ✅ Done |
| ONB-02 | User selects either `STUDENT` or `MENTOR`                                   | ✅ Done |
| ONB-03 | Role written to Clerk publicMetadata and local DB                           | ✅ Done |
| ONB-04 | After role selection, user fills in profile form (student or mentor fields) | ✅ Done |
| ONB-05 | `onboardingCompleted` flag set in DB; guard no longer redirects             | ✅ Done |
| ONB-06 | Admin can change any user's role via `PUT /api/onboarding/roles`            | ✅ Done |
| ONB-07 | User cannot re-onboard (412 if already onboarded)                           | ✅ Done |

---

### 4.3 Mentor Profile Management

| #      | Requirement                                                                    | Status               |
| ------ | ------------------------------------------------------------------------------ | -------------------- |
| MNT-01 | Mentor profile stores: title, profession, company, experienceYears, bio, phone | ✅ Done              |
| MNT-02 | Profile image stored via Cloudinary URL on `User.profileImageUrl`              | ✅ Done              |
| MNT-03 | Mentor can update their own profile                                            | ✅ Done              |
| MNT-04 | Admin can update or delete any mentor                                          | ✅ Done              |
| MNT-05 | Deleting a mentor also deletes the linked user account                         | ✅ Done              |
| MNT-06 | Public listing of all mentors (no auth required)                               | ✅ Done              |
| MNT-07 | Mentor can upload/change profile photo from dashboard                          | ❌ Missing (UI only) |
| MNT-08 | Mentor can set their recurring availability (time slots)                       | ❌ Missing           |

---

### 4.4 Subject Management

| #      | Requirement                                                             | Status            |
| ------ | ----------------------------------------------------------------------- | ----------------- |
| SUB-01 | Mentor can create subjects (name + description) linked to their profile | ✅ Done           |
| SUB-02 | Mentor can update and delete their subjects                             | ✅ Done           |
| SUB-03 | Public listing of all subjects                                          | ✅ Done           |
| SUB-04 | Subject detail page shows name, description, and available sessions     | ✅ Done (partial) |
| SUB-05 | Admin can manage any subject                                            | ✅ Done           |
| SUB-06 | Subject thumbnail/cover image                                           | ❌ Missing        |
| SUB-07 | Subject linked to a category / skill tag for filtering                  | ❌ Missing        |

---

### 4.5 Session Management (Mentor Side)

| #      | Requirement                                                            | Status                              |
| ------ | ---------------------------------------------------------------------- | ----------------------------------- |
| SES-01 | Mentor creates INDIVIDUAL session (1 student, any duration 15–300 min) | ✅ Done                             |
| SES-02 | Mentor creates GROUP session (2–50 students)                           | ✅ Done                             |
| SES-03 | Session availability check: no double-booking for mentor or student    | ✅ Done                             |
| SES-04 | Session starts as `PENDING` after student books                        | ✅ Done                             |
| SES-05 | Mentor adds meeting link when approving a session                      | ❌ Missing (no approve endpoint)    |
| SES-06 | Mentor can mark session as `STARTED` and `COMPLETED`                   | ❌ Missing (no lifecycle endpoints) |
| SES-07 | Mentor can add session notes after completion                          | ❌ Missing (no dedicated endpoint)  |
| SES-08 | Mentor can reject a booking with an optional reason                    | ❌ Missing                          |
| SES-09 | Mentor sees all pending bookings with payment slip preview             | ❌ Missing (UI)                     |

---

### 4.6 Session Booking (Student Side)

| #       | Requirement                                                                   | Status               |
| ------- | ----------------------------------------------------------------------------- | -------------------- |
| BOOK-01 | Student books an INDIVIDUAL session with any mentor + subject                 | ✅ Done              |
| BOOK-02 | Student books a GROUP session (creates a new group session slot)              | ✅ Done              |
| BOOK-03 | Student joins an **existing** open GROUP session (empty seat still available) | ❌ Missing           |
| BOOK-04 | Student can book multiple mentors and multiple sessions                       | ✅ Done              |
| BOOK-05 | Student cannot double-book themselves at the same time                        | ✅ Done              |
| BOOK-06 | Student can view all their booked sessions from dashboard                     | ✅ Done (partial UI) |
| BOOK-07 | Student can cancel a PENDING session before approval                          | ❌ Missing           |

---

### 4.7 Payment Slip Flow

| #      | Requirement                                                                  | Status                                              |
| ------ | ---------------------------------------------------------------------------- | --------------------------------------------------- |
| PAY-01 | After booking, student is redirected to the payment page                     | ✅ Done (frontend)                                  |
| PAY-02 | Student uploads a bank-transfer slip (image/PDF) to Cloudinary               | ✅ Done (frontend)                                  |
| PAY-03 | Receipt URL saved to `sessions.receipt_url` via dedicated student endpoint   | ❌ Missing (current PUT requires ADMIN/MENTOR role) |
| PAY-04 | Mentor sees receipt image thumbnail in their bookings list                   | ❌ Missing (UI)                                     |
| PAY-05 | Mentor approves payment → session becomes `SCHEDULED` + meeting link set     | ❌ Missing (backend + UI)                           |
| PAY-06 | Mentor rejects payment → session becomes `CANCELED`, reason shown to student | ❌ Missing (backend + UI)                           |
| PAY-07 | Student can re-upload slip if rejected                                       | ❌ Missing                                          |
| PAY-08 | Admin can override approve/reject any payment                                | ❌ Missing                                          |

---

### 4.8 Session Lifecycle & Status

```
                    ┌────────────────────────────────────────────────────────────┐
bookSession()  ──►  │  PENDING  ──► (student uploads slip) ──► PENDING_PAY       │
                    │                                                ↓            │
                    │                              mentor reviews slip            │
                    │                          ┌───────┴──────────┐              │
                    │                      REJECTED           SCHEDULED           │
                    │                          │                   ↓              │
                    │                    (notified)          mentor starts        │
                    │                                             ↓               │
                    │                                         STARTED             │
                    │                                             ↓               │
                    │                                         COMPLETED           │
                    └────────────────────────────────────────────────────────────┘
```

| Status      | Triggered by                                                  | ❌/✅      |
| ----------- | ------------------------------------------------------------- | ---------- |
| `PENDING`   | Student calls `POST /api/sessions/book`                       | ✅         |
| `SCHEDULED` | Mentor approves payment via `PATCH /api/sessions/:id/approve` | ❌ Missing |
| `STARTED`   | Mentor calls `PATCH /api/sessions/:id/start`                  | ❌ Missing |
| `COMPLETED` | Mentor calls `PATCH /api/sessions/:id/complete`               | ❌ Missing |
| `CANCELED`  | Mentor rejects or student cancels                             | ❌ Missing |

---

### 4.9 Reviews & Ratings

| #      | Requirement                                                                     | Status          |
| ------ | ------------------------------------------------------------------------------- | --------------- |
| REV-01 | After session is `COMPLETED`, student can leave a text review + 1–5 star rating | ❌ Missing      |
| REV-02 | Review stored in `sessions` table (`studentReview`, `studentRating`)            | ✅ Fields exist |
| REV-03 | Average rating shown on mentor public profile                                   | ❌ Missing      |
| REV-04 | Admin can delete inappropriate reviews                                          | ❌ Missing      |

---

### 4.10 Admin Controls

| #      | Requirement                                                         | Status                              |
| ------ | ------------------------------------------------------------------- | ----------------------------------- |
| ADM-01 | View all users with role, status, and registration date             | ✅ Done                             |
| ADM-02 | Change any user's role                                              | ✅ Done                             |
| ADM-03 | Delete any user (cascades to mentor/student profile)                | ✅ Done                             |
| ADM-04 | View and manage all mentors                                         | ✅ Done (UI)                        |
| ADM-05 | View and manage all subjects                                        | ✅ Done (UI)                        |
| ADM-06 | View and manage all bookings/sessions                               | ✅ Done (UI)                        |
| ADM-07 | View and manage all students                                        | ❌ Missing (no admin/students page) |
| ADM-08 | Platform stats dashboard (total users, sessions by status, revenue) | ❌ Missing                          |
| ADM-09 | Force-complete or force-cancel any session                          | ❌ Missing                          |

---

## 5. Data Model

### Entities & Relationships

```
users ──────────────────────────────────────────────────────────
  id, clerkId*, email*, firstName, lastName, fullName
  profileImageUrl, onboardingCompleted, lastLogin
  createdAt, updatedAt

user_roles (collection table)
  user_id → users.id
  role  (USER | MENTOR | STUDENT | ADMIN)

mentors
  id, user_id* → users.id (1:1)
  phoneNumber, title, profession, company
  experienceYears, bio
  createdAt, updatedAt

students
  id, user_id* → users.id (1:1)
  studentCode*, learningGoals
  createdAt, updatedAt

subjects
  id, name*, description
  mentor_id* → mentors.id  (M:1)
  createdAt, updatedAt

sessions
  id
  session_type  (INDIVIDUAL | GROUP)
  session_status (PENDING | SCHEDULED | STARTED | COMPLETED | CANCELED)
  maxParticipants, sessionAt, durationMinutes
  meetingLink, sessionNotes
  studentReview, studentRating
  receipt_url
  mentor_id* → mentors.id  (M:1)
  subject_id* → subjects.id (M:1)
  createdAt, updatedAt

session_students (join table)
  session_id → sessions.id
  student_id → students.id
```

### Fields missing from current schema (need to add)

| Entity     | Missing Field                                                      | Purpose                                                    |
| ---------- | ------------------------------------------------------------------ | ---------------------------------------------------------- |
| `sessions` | `receipt_status` ENUM(`NONE`, `SUBMITTED`, `APPROVED`, `REJECTED`) | Track payment review state independently of session status |
| `sessions` | `rejection_reason` TEXT                                            | Mentor's reason for rejecting a payment                    |
| `sessions` | `meeting_password` VARCHAR                                         | Optional Zoom/Meet password                                |
| `subjects` | `thumbnail_url` VARCHAR                                            | Cover image for subject card                               |
| `subjects` | `category` VARCHAR                                                 | Filter/search grouping                                     |
| `mentors`  | `average_rating` DECIMAL                                           | Cached aggregate, updated on review                        |

---

## 6. API Endpoint Catalogue

### 6.1 ✅ Implemented Endpoints

#### Users — `/api/users`

| Method | Path         | Auth          | Description               |
| ------ | ------------ | ------------- | ------------------------- |
| POST   | `/sync`      | Authenticated | Sync Clerk JWT user to DB |
| GET    | `/me`        | Authenticated | Get current user          |
| GET    | `/`          | ADMIN         | List all users            |
| GET    | `/{clerkId}` | ADMIN         | Get user by Clerk ID      |
| DELETE | `/{clerkId}` | ADMIN         | Delete user               |

#### Onboarding — `/api/onboarding`

| Method | Path        | Auth          | Description                         |
| ------ | ----------- | ------------- | ----------------------------------- |
| POST   | `/complete` | Authenticated | Set role, create profile, mark done |
| GET    | `/status`   | Authenticated | Check onboarding status             |
| PUT    | `/roles`    | ADMIN         | Override user roles                 |

#### Mentors — `/api/mentors`

| Method | Path             | Auth                 | Description                  |
| ------ | ---------------- | -------------------- | ---------------------------- |
| GET    | `/`              | Public               | List all mentors             |
| GET    | `/{id}`          | Public               | Get mentor by ID             |
| GET    | `/{id}/sessions` | ADMIN/MENTOR/STUDENT | Get sessions for this mentor |
| POST   | `/`              | Authenticated        | Create mentor profile        |
| PUT    | `/{id}`          | ADMIN/MENTOR         | Update mentor                |
| DELETE | `/{id}`          | ADMIN/MENTOR         | Delete mentor + user         |

#### Students — `/api/students`

| Method | Path             | Auth          | Description                   |
| ------ | ---------------- | ------------- | ----------------------------- |
| GET    | `/`              | ADMIN/STUDENT | List all students             |
| GET    | `/{id}`          | Authenticated | Get student by ID             |
| GET    | `/{id}/sessions` | ADMIN/STUDENT | Get sessions for this student |
| POST   | `/`              | Authenticated | Register student profile      |
| PUT    | `/{id}`          | ADMIN/STUDENT | Update student                |
| DELETE | `/{id}`          | ADMIN/STUDENT | Delete student                |

#### Subjects — `/api/subjects`

| Method | Path    | Auth         | Description       |
| ------ | ------- | ------------ | ----------------- |
| GET    | `/`     | Public       | List all subjects |
| GET    | `/{id}` | Public       | Get subject by ID |
| POST   | `/`     | ADMIN/MENTOR | Create subject    |
| PUT    | `/{id}` | ADMIN/MENTOR | Update subject    |
| DELETE | `/{id}` | ADMIN/MENTOR | Delete subject    |

#### Sessions — `/api/sessions`

| Method | Path                   | Auth          | Description                          |
| ------ | ---------------------- | ------------- | ------------------------------------ |
| GET    | `/`                    | ADMIN/MENTOR  | List all sessions                    |
| GET    | `/{id}`                | ADMIN/MENTOR  | Get session                          |
| POST   | `/`                    | ADMIN/MENTOR  | Create session (admin/mentor-direct) |
| PUT    | `/{id}`                | ADMIN/MENTOR  | Update session                       |
| DELETE | `/{id}`                | ADMIN/MENTOR  | Delete session                       |
| POST   | `/book`                | ADMIN/STUDENT | Student books a new session          |
| GET    | `/student/{studentId}` | ADMIN/STUDENT | Student's sessions                   |
| GET    | `/mentor/{mentorId}`   | ADMIN/MENTOR  | Mentor's sessions                    |

---

### 6.2 ❌ Missing Endpoints (To Build)

#### Session Lifecycle

| Method | Path                                | Auth         | Description                                             |
| ------ | ----------------------------------- | ------------ | ------------------------------------------------------- |
| PATCH  | `/api/sessions/{id}/submit-receipt` | STUDENT      | Student uploads payment slip URL                        |
| PATCH  | `/api/sessions/{id}/approve`        | MENTOR/ADMIN | Approve payment, set meeting link, status → SCHEDULED   |
| PATCH  | `/api/sessions/{id}/reject`         | MENTOR/ADMIN | Reject payment, set rejection reason, status → CANCELED |
| PATCH  | `/api/sessions/{id}/start`          | MENTOR/ADMIN | Mark session as STARTED                                 |
| PATCH  | `/api/sessions/{id}/complete`       | MENTOR/ADMIN | Mark session as COMPLETED                               |
| DELETE | `/api/sessions/{id}/cancel`         | STUDENT      | Student cancels PENDING session                         |

#### Group Session Join

| Method | Path                       | Auth    | Description                                       |
| ------ | -------------------------- | ------- | ------------------------------------------------- |
| POST   | `/api/sessions/{id}/join`  | STUDENT | Join an existing open GROUP session               |
| DELETE | `/api/sessions/{id}/leave` | STUDENT | Leave a group session (if PENDING)                |
| GET    | `/api/sessions/open`       | STUDENT | List all open GROUP sessions with available seats |

#### Reviews

| Method | Path                        | Auth    | Description                 |
| ------ | --------------------------- | ------- | --------------------------- |
| POST   | `/api/sessions/{id}/review` | STUDENT | Submit review + star rating |
| DELETE | `/api/sessions/{id}/review` | ADMIN   | Remove review               |

#### Admin Stats

| Method | Path               | Auth  | Description                                                      |
| ------ | ------------------ | ----- | ---------------------------------------------------------------- |
| GET    | `/api/admin/stats` | ADMIN | Platform overview (users, sessions by status, mentors, students) |

#### Student Receipt Re-upload

| Method | Path                                | Auth    | Description                   |
| ------ | ----------------------------------- | ------- | ----------------------------- |
| PATCH  | `/api/sessions/{id}/submit-receipt` | STUDENT | Upload/re-upload payment slip |

---

## 7. Frontend Page Inventory

### 7.1 ✅ Existing Pages

| Route                 | Component                | Notes                                                             |
| --------------------- | ------------------------ | ----------------------------------------------------------------- |
| `/`                   | `Home.tsx`               | Landing page (stats bar, hero, mentor preview, testimonials, FAQ) |
| `/onboarding`         | `OnboardingRolePage.tsx` | Role selection + profile form for MENTOR or STUDENT               |
| `/mentors`            | `MentorsPage.tsx`        | Browse all mentors                                                |
| `/mentors/:id`        | `MentorProfilePage.tsx`  | Mentor profile + subject list                                     |
| `/subjects`           | `SubjectsPage.tsx`       | Browse all subjects                                               |
| `/subjects/:id`       | `SubjectDetailPage.tsx`  | Subject sessions list                                             |
| `/dashboard`          | `DashboardPage.tsx`      | Student/Mentor shared dashboard                                   |
| `/payment/:sessionId` | `PaymentPage.tsx`        | Upload payment slip                                               |
| `/admin`              | `AdminDashboardPage.tsx` | Admin overview                                                    |
| `/admin/bookings`     | `ManageBookingsPage.tsx` | Admin session management                                          |
| `/admin/mentors`      | `ManageMentorsPage.tsx`  | Admin mentor management                                           |
| `/admin/subjects`     | `ManageSubjectsPage.tsx` | Admin subject management                                          |

### 7.2 ❌ Missing Pages / UIs (To Build)

| Route                                 | Description                                                                                                | Priority |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------- |
| `/admin/students`                     | Admin view of all students — list, delete, search                                                          | HIGH     |
| `/admin/stats`                        | Dashboard stats cards (user counts, session counts by status, recent activity)                             | HIGH     |
| `/mentor/dashboard`                   | Mentor-specific dashboard: pending bookings with slip thumbnails, upcoming sessions, subjects              | HIGH     |
| `/mentor/sessions/new`                | Create a new session form (type, subject, time, maxParticipants)                                           | HIGH     |
| `/mentor/sessions/:id/review-payment` | View payment slip, approve or reject with reason                                                           | HIGH     |
| `/mentor/profile/edit`                | Edit mentor profile fields + upload photo                                                                  | HIGH     |
| `/mentor/subjects`                    | Manage subjects: create, edit, delete                                                                      | MEDIUM   |
| `/student/dashboard`                  | Student-specific dashboard: session timeline, status badges, meeting links (currently shares `/dashboard`) | HIGH     |
| `/sessions/open`                      | Browse open GROUP sessions with seats remaining, join button                                               | HIGH     |
| `/sessions/:id`                       | Session detail page (status, meeting link when scheduled, receipt status, notes)                           | HIGH     |
| `/sessions/:id/review`                | Leave a review form shown after session is COMPLETED                                                       | MEDIUM   |
| `/profile`                            | Shared profile edit page for current authenticated user                                                    | MEDIUM   |

---

## 8. Missing Backend Logic

### 8.1 Payment slip submission by student (CRITICAL)

`PUT /api/sessions/:id` currently requires `ADMIN` or `MENTOR` role. A student cannot update the `receiptUrl`. A dedicated `PATCH /api/sessions/{id}/submit-receipt` endpoint must be created that:

- Is accessible to the owning STUDENT only
- Validates the student is enrolled in the session
- Accepts `{ receiptUrl: string }` in the body
- Updates `sessions.receipt_url` and adds a `receipt_status` of `SUBMITTED`

### 8.2 Mentor payment approval/rejection flow

No lifecycle endpoints exist. Need to implement:

- `PATCH /api/sessions/{id}/approve` — validates caller is the session's mentor, sets status `SCHEDULED`, stores meeting link, clears rejection reason
- `PATCH /api/sessions/{id}/reject` — validates caller is the session's mentor, sets status `CANCELED`, stores `rejectionReason`

### 8.3 Session lifecycle status transitions

Need `start` and `complete` endpoint pairs:

- `PATCH /api/sessions/{id}/start` — only when `SCHEDULED`, only by owning mentor
- `PATCH /api/sessions/{id}/complete` — only when `STARTED`, only by owning mentor; optionally store session notes

### 8.4 Join existing group session

`POST /api/sessions/book` always creates a **new** session entity. Students should also be able to join a pre-existing open group session. Implement:

- `POST /api/sessions/{id}/join` — attaches the current student to an existing GROUP session provided seats remain (`students.size() < maxParticipants`), status must be `PENDING` or `SCHEDULED`
- Validate no time overlap for the joining student

### 8.5 Student session cancellation

`DELETE /api/sessions/{id}` requires ADMIN/MENTOR. Students need:

- `DELETE /api/sessions/{id}/cancel` — only allowed when status is `PENDING`, only by enrolled student

### 8.6 Review submission

Fields `studentReview` and `studentRating` exist on the entity but no dedicated endpoint exists:

- `POST /api/sessions/{id}/review` — allowed only by enrolled student, only when status is `COMPLETED`
- Should validate 1–5 rating, non-empty review

### 8.7 Admin stats aggregation

No `/api/admin/stats` endpoint. Need a query that returns:

- Total users / mentors / students
- Sessions broken down by `SessionStatus`
- Recent signups (last 7 / 30 days)

### 8.8 Schema additions required

```sql
-- receipt_status on sessions
ALTER TABLE sessions
  ADD COLUMN receipt_status VARCHAR(30) DEFAULT 'NONE',
  ADD COLUMN rejection_reason TEXT;

-- subject enrichment
ALTER TABLE subjects
  ADD COLUMN thumbnail_url VARCHAR(500),
  ADD COLUMN category VARCHAR(100);

-- mentor rating cache
ALTER TABLE mentors
  ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.00,
  ADD COLUMN total_reviews INT DEFAULT 0;
```

---

## 9. Missing Frontend Logic

### 9.1 Payment slip submission wired to wrong role

`PaymentPage.tsx` calls `useUpdateSession()` which calls `PUT /api/sessions/:id` — this requires ADMIN/MENTOR role and **will fail** for a student in production. Must be replaced with the new `PATCH /api/sessions/{id}/submit-receipt` student endpoint.

### 9.2 Role-split dashboard

`DashboardPage.tsx` is used by both students and mentors. It should detect the user's role and render the correct view, or route to separate `/student/dashboard` and `/mentor/dashboard` pages. Current implementation needs conditional rendering or routing logic.

### 9.3 Mentor booking inbox

No UI exists for a mentor to see incoming bookings. The `ManageBookingsPage.tsx` is an admin-only page. A mentor-specific booking inbox must show: student name, session time, subject, and a preview/thumbnail of the uploaded payment slip, with Approve / Reject buttons.

### 9.4 Group session join flow

No UI exists to browse open group sessions and join them. The `SubjectDetailPage.tsx` can show sessions with available seats, but a join CTA and the corresponding join API call is missing.

### 9.5 Session detail page

After booking a session, students should see a dedicated session detail page showing current status, meeting link (when available), receipt status, and next steps. No such page exists.

### 9.6 Post-session review form

After a session reaches `COMPLETED` status, a "Leave Review" prompt or page should appear for the student. No such UI exists.

### 9.7 Admin students page

`/admin/students` page is completely missing from the admin section. Admin can currently manage mentors and subjects but cannot view or manage students.

### 9.8 `receiptUrl` cleanup

The `CLOUDINARY_API_KEY` in `.env` has a leading tab character (`\t639751726936497`) which will cause Cloudinary upload failures. Fix: remove the whitespace.

---

## 10. Non-Functional Requirements

| Category           | Requirement                                                                                                                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Security**       | All write endpoints enforce role via Spring `@PreAuthorize`. Clerk JWT verified on every request.                                                                                        |
| **Performance**    | Hikari pool max 15 connections. Cache config present (`CasheConfig.java`). Add caching on mentor list endpoint.                                                                          |
| **Scalability**    | Stateless REST API; can be horizontally scaled. Session store is in-memory Clerk JWT — no session state.                                                                                 |
| **Reliability**    | DB health check via Spring Actuator (to be enabled).                                                                                                                                     |
| **File Uploads**   | Payment slips and profile images are stored on Cloudinary. Max file size should be enforced (5 MB suggested). File type validation (image/jpeg, image/png, application/pdf) on frontend. |
| **CORS**           | Configured via `cors.allowed-origins` (currently `localhost:3000, localhost:5173, localhost:8080`). Update for production domain.                                                        |
| **API Docs**       | Swagger/OpenAPI configured (`OpenAPIConfigs.java`). Available at `/swagger-ui.html`.                                                                                                     |
| **Error handling** | `GlobalExceptionHandler` maps `SkillMentorException` → correct HTTP status + `ApiErrorResponse` body.                                                                                    |

---

## 11. Prioritised Build Backlog

### 🔴 P0 — Critical (Blocks core workflow)

| ID   | Item                                                                                      | Type         |
| ---- | ----------------------------------------------------------------------------------------- | ------------ |
| P0-1 | `PATCH /api/sessions/{id}/submit-receipt` — Student receipt upload endpoint               | Backend      |
| P0-2 | `PATCH /api/sessions/{id}/approve` — Mentor approves payment + adds meeting link          | Backend      |
| P0-3 | `PATCH /api/sessions/{id}/reject` — Mentor rejects payment with reason                    | Backend      |
| P0-4 | Fix `PaymentPage.tsx` to call `/submit-receipt` (student) instead of full session update  | Frontend     |
| P0-5 | Mentor booking inbox UI — see pending sessions + slip thumbnails + approve/reject buttons | Frontend     |
| P0-6 | Add `receipt_status` and `rejection_reason` columns to `sessions` table                   | Backend / DB |

### 🟠 P1 — High (Core product features)

| ID   | Item                                                                         | Type     |
| ---- | ---------------------------------------------------------------------------- | -------- |
| P1-1 | `PATCH /api/sessions/{id}/start` and `/complete` lifecycle endpoints         | Backend  |
| P1-2 | `POST /api/sessions/{id}/join` — Join open group session                     | Backend  |
| P1-3 | `DELETE /api/sessions/{id}/cancel` — Student cancels pending booking         | Backend  |
| P1-4 | Session detail page `/sessions/:id` with status, meeting link, receipt state | Frontend |
| P1-5 | Role-split dashboard (student view vs mentor view)                           | Frontend |
| P1-6 | Mentor session creation form `/mentor/sessions/new`                          | Frontend |
| P1-7 | Browse open group sessions page `/sessions/open`                             | Frontend |
| P1-8 | Mentor profile edit page `/mentor/profile/edit`                              | Frontend |
| P1-9 | Admin students management page `/admin/students`                             | Frontend |

### 🟡 P2 — Medium (Improves usability)

| ID   | Item                                                                       | Type               |
| ---- | -------------------------------------------------------------------------- | ------------------ |
| P2-1 | `POST /api/sessions/{id}/review` — Student submits review after completion | Backend            |
| P2-2 | `GET /api/admin/stats` — Platform aggregated stats                         | Backend            |
| P2-3 | Post-session review form `/sessions/:id/review`                            | Frontend           |
| P2-4 | Admin stats dashboard cards `/admin/stats`                                 | Frontend           |
| P2-5 | Mentor average rating computed and shown on public profile                 | Backend + Frontend |
| P2-6 | Subject thumbnail support (`thumbnail_url` field + Cloudinary upload)      | Backend + Frontend |
| P2-7 | Subject category/tag filtering                                             | Backend + Frontend |

### 🟢 P3 — Low (Nice to have)

| ID   | Item                                                         | Type               |
| ---- | ------------------------------------------------------------ | ------------------ |
| P3-1 | Email notification to student when payment approved/rejected | Backend            |
| P3-2 | Email notification to mentor when a new booking is placed    | Backend            |
| P3-3 | Mentor recurring availability time-slot management           | Backend + Frontend |
| P3-4 | Admin force-complete / force-cancel session                  | Backend + Frontend |
| P3-5 | Student learning goals progress tracker                      | Frontend           |
| P3-6 | Fix leading whitespace in `.env` `CLOUDINARY_API_KEY`        | Config             |

---

_End of Business Requirements Document_
