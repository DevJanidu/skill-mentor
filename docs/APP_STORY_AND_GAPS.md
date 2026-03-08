# SkillMentor — Full App Story & Missing Pieces

> Generated: March 2026  
> Covers: End-to-end flows for Student, Mentor, and Admin + a gap analysis

---

## TABLE OF CONTENTS

1. [Public / Marketing Layer](#1-public--marketing-layer)
2. [Auth & Onboarding Flow](#2-auth--onboarding-flow)
3. [Student Journey — End to End](#3-student-journey--end-to-end)
4. [Mentor Journey — End to End](#4-mentor-journey--end-to-end)
5. [Admin Journey — End to End](#5-admin-journey--end-to-end)
6. [Session Lifecycle State Machine](#6-session-lifecycle-state-machine)
7. [Missing Pieces — Ranked by Severity](#7-missing-pieces--ranked-by-severity)

---

## 1. Public / Marketing Layer

**Route: `/`** → `Home.tsx`

| Section        | Component           | Purpose                                              |
| -------------- | ------------------- | ---------------------------------------------------- |
| Hero           | `Header.tsx`        | Tagline, CTA buttons (Find Mentor / Browse Subjects) |
| Stats          | `StatsBar.tsx`      | Platform numbers (mentors, sessions, students, etc.) |
| Subjects       | `SubjectGrid.tsx`   | Featured subjects grid                               |
| How It Works   | `HowItWorks.tsx`    | 3-step explainer                                     |
| Mentor Preview | `MentorPreview.tsx` | Sample mentor cards                                  |
| Testimonials   | `Testimonials.tsx`  | Student quotes                                       |
| FAQ            | `Faq.tsx`           | Common questions                                     |
| Final CTA      | `FinalCTA.tsx`      | Sign-up nudge                                        |

**Route: `/mentors`** → `MentorsPage.tsx`

- Public grid of all mentors
- Search by name, profession, company
- Shows subjects taught per mentor
- "View Profile" → goes to `/mentors/:mentorId`

**Route: `/mentors/:mentorId`** → `MentorProfilePage.tsx`

- Mentor bio, title, company, years of experience, rating
- Subjects list (paginated)
- Reviews from students (paginated)
- **"Book Session"** button (triggers `BookingDialog`)
  - If not signed in → redirect to `/sign-in`
  - If signed in but not a student → redirect to `/onboarding/role`

**Route: `/subjects`** → `SubjectsPage.tsx`

- All subjects with search, category filter, minimum rating filter
- Paginated (12 per page)
- Each card shows mentor name, rating, review count

**Route: `/subjects/:subjectId`** → `SubjectDetailPage.tsx`

- Subject detail with thumbnail, description, category
- Mentor info sidebar (avatar, name, profession)
- Other subjects by same mentor
- **"Book Session"** button (same auth guard as above)

---

## 2. Auth & Onboarding Flow

```
User visits app
    │
    ▼
Clerk Sign In / Sign Up
    │
    ├─ On first sign-in ──────────────────────────────────────────►
    │   OnboardingGuard checks /api/onboarding/status
    │   .completed === false → redirect to /onboarding/role
    │
    ▼
/onboarding/role  (OnboardingRolePage.tsx)
    │
    ├─ Step 1: Pick Role
    │     ┌─────────────┐     ┌─────────────┐
    │     │   STUDENT   │     │   MENTOR    │
    │     └──────┬──────┘     └──────┬──────┘
    │            │                   │
    ├─ Step 2: Fill Details          │
    │     STUDENT fields:            │  MENTOR fields:
    │     - Student Code (auto-gen)  │  - Phone number
    │     - Learning Goals (opt.)    │  - Title
    │                                │  - Profession
    │                                │  - Company
    │                                │  - Experience Years
    │                                │  - Bio (opt.)
    │
    ├─ On Submit:
    │   1. POST /api/users/sync          ← create/update User in DB
    │   2. POST /api/onboarding/complete ← set role in Clerk + DB
    │   3. POST /api/students            ← create student profile
    │      OR POST /api/mentors          ← create mentor profile
    │
    └─► redirect → /dashboard (student) or /mentor/dashboard (mentor)
```

**OnboardingGuard** (wraps all protected routes)

- Calls `GET /api/onboarding/status`
- If `completed === false` → hard redirect to `/onboarding/role`
- JWT is attached via Clerk `getToken({ template: "skill-mentor" })`

---

## 3. Student Journey — End to End

### Step 1 — Browse & Discover

```
/mentors or /subjects (public, no auth needed)
    │
    ▼
Pick a mentor or subject of interest
    │
    ▼
/mentors/:mentorId  OR  /subjects/:subjectId
    │
    ▼
Click "Book Session"
    │  (if not signed in → Clerk sign-in → back here)
    │  (if no STUDENT role → /onboarding/role)
    │
    ▼
BookingDialog opens
```

### Step 2 — Book a Session

```
BookingDialog (BookingDialog.tsx)
    │
    ├─ Select Subject (dropdown of mentor's subjects)
    ├─ Pick Session Type: INDIVIDUAL or GROUP
    │     └─ if GROUP: set Max Participants
    ├─ Pick Date & Time (datetime-local input)
    └─ Set Duration (default 60 min)
    │
    ▼  POST /api/sessions/book
    │  { mentorId, subjectId, sessionType, sessionAt, durationMinutes, maxParticipants? }
    │
    Session created:
    │  status: PENDING
    │  receiptStatus: NONE
    │
    ▼  redirect → /payment/:sessionId
```

### Step 3 — Payment (Manual Bank Transfer)

```
/payment/:sessionId  (PaymentPage.tsx)
    │
    ├─ Shows session details (mentor, subject, date, duration)
    ├─ Upload bank transfer receipt (image file)
    │     └─ uploadFile() → Cloudinary → get receiptUrl
    │
    ▼  PATCH /api/sessions/:id/submit-receipt
    │  { receiptUrl }
    │
    Session receiptStatus: NONE → SUBMITTED
    │
    ▼  "Waiting for mentor confirmation" success message
    └─► Student returns to /dashboard
```

### Step 4 — Wait for Mentor Approval

```
Student Dashboard (/dashboard → StudentDashboardPage.tsx)
    │
    ├─ Action Required Section:
    │     └─ Sessions with receiptStatus: REJECTED → re-upload option
    │
    ├─ Upcoming Sessions:
    │     └─ Shows next 3 SCHEDULED/PENDING sessions
    │
    └─ All Sessions tab (filter by status)
          PENDING  → waiting for mentor approval
          SCHEDULED → approved, meeting link available
          STARTED   → session in progress
          COMPLETED → session done
          CANCELED  → session canceled
```

### Step 5 — Session Day

```
When session is SCHEDULED:
    │
    ├─ Student sees meeting link + password in:
    │     - Dashboard session card
    │     - /sessions/:sessionId detail page
    │
    └─ Clicks meeting link → joins external meeting (Zoom/Teams/etc.)
```

### Step 6 — Post Session Review

```
After session status = COMPLETED:
    │
    ├─ Student Dashboard shows "Leave a Review" action item
    │
    ▼  ReviewDialog opens
    │  - Star rating (1–5 stars)
    │  - Written review text
    │
    ▼  POST /api/sessions/:id/review
    │  { studentRating, studentReview }
    │
    └─ Review appears on Mentor's public profile
```

### Step 7 — Post-Session Resources

```
After COMPLETED, mentor may add resources:
    │
    └─ Student sees in /sessions/:sessionId:
         - Recording link
         - Resource link
         - Assessment link
```

### Student Dashboard Summary

```
/dashboard (StudentDashboardPage.tsx)
├─ Profile Hero: avatar, cover image, name, student code
│     └─ Upload profile/cover image
├─ Stats: completed, upcoming, avg rating given
├─ Action Required: receipt rejected, needs review, starting soon
├─ Upcoming Sessions (next 3)
├─ All Sessions (tabbed: ALL / PENDING / SCHEDULED / STARTED / COMPLETED / CANCELED)
│     └─ Each session: status badge, receipt badge, cancel button, pay button, review button
└─ /sessions/:id link → full session detail
```

---

## 4. Mentor Journey — End to End

### Step 1 — Profile Setup

```
/mentor/profile  (MentorEditProfilePage.tsx)
    │
    ├─ Auto-detects create vs edit mode
    ├─ Fields: phone, title, profession, company, exp. years, bio
    ├─ Profile image upload (multipart → /api/mentors/:id/profile-image)
    └─ Cover image upload  (multipart → /api/mentors/:id/cover-image)
```

### Step 2 — Manage Subjects

```
/mentor/subjects  (MentorSubjectsPage.tsx)
    │
    ├─ Create Subject: name, description, thumbnail image
    │     POST /api/subjects
    │     POST /api/subjects/:id/thumbnail
    ├─ Edit Subject
    ├─ Delete Subject (with confirm)
    └─ Paginated subject cards (6 per page)
```

### Step 3 — Create a Group Session

```
/mentor/create-session  (MentorCreateSessionPage.tsx)
    │
    ├─ Pick subject (from mentor's own subjects)
    ├─ Pick session type: INDIVIDUAL or GROUP
    ├─ Set date/time
    ├─ Set duration
    ├─ If GROUP: set max participants
    │
    ▼  POST /api/sessions
    │  { mentorId, subjectId, sessionType, sessionAt, durationMinutes,
    │    maxParticipants, studentIds: [] }
    │
    └─► redirect to /mentor/dashboard
```

### Step 4 — Inbox (Session Approval Workflow)

```
/mentor/inbox  (MentorInboxPage.tsx)
    │
    ├─ Tab: PENDING (new bookings waiting for review)
    │     Each card shows:
    │     ├─ Student name, subject, date, duration
    │     ├─ Receipt image preview (if submitted)
    │     ├─ Receipt status badge
    │     │
    │     ├─ [Approve] button → ApproveDialog:
    │     │     Enter meeting link (required)
    │     │     Enter meeting password (optional)
    │     │     PATCH /api/sessions/:id/approve
    │     │     → Session: PENDING → SCHEDULED
    │     │        receiptStatus: SUBMITTED → APPROVED
    │     │
    │     └─ [Reject] button → RejectDialog:
    │           Enter rejection reason
    │           PATCH /api/sessions/:id/reject
    │           → Session: PENDING stays (or CANCELED)
    │              receiptStatus → REJECTED
    │
    ├─ Tab: SCHEDULED (approved sessions)
    │     ├─ [Start] → PATCH /api/sessions/:id/start → STARTED
    │     └─ View meeting link
    │
    ├─ Tab: STARTED (in-progress)
    │     └─ [Complete] → PATCH /api/sessions/:id/complete → COMPLETED
    │
    └─ Tabs: COMPLETED, CANCELED (read-only history)
```

### Step 5 — Sessions Management

```
/mentor/sessions  (MentorSessionsPage.tsx)
    │
    ├─ Advanced filters: subject, status, type, receipt status, date
    ├─ Full session cards with all actions (same as inbox)
    └─ Sessions sorted by date
```

### Step 6 — Post-Session Resources

```
/sessions/:sessionId  (SessionDetailPage.tsx)
    │
    After session COMPLETED, mentor sees resource form:
    ├─ Recording link
    ├─ Resource link
    └─ Assessment link
    │
    ▼  PATCH /api/sessions/:id/resources
```

### Step 7 — Reviews

```
/mentor/reviews  (MentorReviewsPage.tsx)
    │
    ├─ Overall average rating + star display
    ├─ Rating distribution bar chart (1–5 stars)
    └─ Individual review cards (session, student name, date, stars, text)
```

### Mentor Dashboard Summary

```
/mentor/dashboard  (MentorDashboardPage.tsx)
├─ Profile Hero: avatar, cover image, name, title, company, rating
│     └─ Upload profile/cover image
├─ Stats: pending, scheduled, completed sessions, avg rating
├─ Action Required Queue: ready to approve, ready to start, in progress
├─ Recent Sessions (last 5)
└─ Quick-nav links → inbox, create session, subjects, reviews
```

---

## 5. Admin Journey — End to End

Admin users have the `ADMIN` role in Clerk public metadata.  
`AdminRoute` guard blocks non-admin users.

```
/admin  (AdminDashboardPage.tsx)
├─ Stats cards: total sessions, mentors, subjects, students
└─ Recent sessions table

/admin/bookings  (ManageBookingsPage.tsx)
├─ All sessions across all mentors
├─ Filter by status (tabs)
├─ Search by mentor name, subject, ID
├─ Edit session: change status, meeting link, notes
└─ Delete session (with confirmation)

/admin/subjects  (ManageSubjectsPage.tsx)
├─ All subjects
├─ Create / Edit / Delete subject
└─ Assign to mentor

/admin/mentors  (ManageMentorsPage.tsx)
├─ All mentor profiles
├─ Create / Edit / Delete mentor
└─ Search by name, profession, company

/admin/students  (ManageStudentsPage.tsx)
├─ All students
├─ Search by name, email, student code
└─ Delete student (with confirmation dialog)
```

---

## 6. Session Lifecycle State Machine

```
                  ┌─────────────────────────────────────────────────────┐
                  │              SESSION STATUS TRANSITIONS              │
                  └─────────────────────────────────────────────────────┘

  Student books
       │
       ▼
   [PENDING] ──────────────────────────────────────────► [CANCELED]
       │   Student: submit receipt (receiptStatus: SUBMITTED)           ▲
       │   Mentor:  approve → meeting link provided                     │
       │            ├─ receiptStatus: APPROVED                          │
       │            └─ OR reject → receiptStatus: REJECTED              │ cancel
       │                                                                │
       ▼                                                                │
  [SCHEDULED] ─────────────────────────────────────────────────────────┤
       │   Mentor: start session                                        │
       ▼                                                                │
   [STARTED] ──────────────────────────────────────────────────────────┤
       │   Mentor: complete session                                     │
       ▼
  [COMPLETED]
       │   Student: submit review (optional)
       ▼
   Review stored on session + mentor rating updated

Receipt Status (parallel track):
  NONE → SUBMITTED → APPROVED
                  └─► REJECTED → student re-uploads → SUBMITTED → ...
```

---

## 7. Missing Pieces — Ranked by Severity

---

### 🔴 CRITICAL — Will Break Core Function

#### [GAP-1] No Pricing Information Anywhere

**What's missing:**  
There is no `price`, `hourlyRate`, or `sessionPrice` field in `Mentor`, `Subject`, or `Session` entities anywhere in the codebase (backend or frontend). The `PaymentPage` tells the student to upload a bank slip but never shows them:

- How much to pay
- Which bank account to transfer to
- What reference to use

The student has absolutely no payment information and there is no way to calculate a price.

**Impact:** Payment flow is completely broken for real-world use.  
**Fix needed:**

- Add `hourlyRate` (BigDecimal) to `Mentor` entity
- Show calculated price in PaymentPage: `hourlyRate × (durationMinutes / 60)`
- Or add a `sessionPrice` field to `Session` for fixed pricing
- Add payment bank details (could be on MentorDTO or a config)

---

#### [GAP-2] Subject Category Cannot Be Set

**What's missing:**  
`SubjectDTO` has a `category` field, and `SubjectsPage` has a category filter dropdown — but `CreateSubjectDTO` and `UpdateSubjectDTO` only have `name` and `description`. There is no `category` field in the creation/edit schemas, so **no subject can ever have a category set** via the UI or API.

**Impact:** Category filter on `/subjects` always shows only "All" since all categories are null.  
**Fix needed:**

- Add `category?: string` to `CreateSubjectDTO` and `UpdateSubjectDTO`
- Add `category` input field to `MentorSubjectsPage` create/edit form
- Add `category` field to `ManageSubjectsPage` admin form
- Add `category` to backend `CreateSubjectDTO` / `UpdateSubjectDTO`

---

#### [GAP-3] No `/sign-in` or `/sign-up` Routes Defined

**What's missing:**  
`BookingDialog` calls `navigate("/sign-in")` and `SubjectDetailPage` redirects unauthenticated users to `/sign-in`, but **there is no `/sign-in` or `/sign-up` route in `App.tsx`**. These redirects will hit a 404.

**Impact:** Unauthenticated users who click "Book Session" get a 404 instead of a sign-in screen.  
**Fix needed:**

- Add Clerk's `<SignIn>` and `<SignUp>` route components to `App.tsx`

```tsx
import { SignIn, SignUp } from "@clerk/clerk-react";
<Route path="sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
<Route path="sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />
```

---

#### [GAP-4] Mentor Individual Session Creation is Broken

**What's missing:**  
When a mentor uses `/mentor/create-session` to create an `INDIVIDUAL` session, the code sends `studentIds: []` (empty array). Per architecture notes, the backend `CreateSessionDTO` requires `@NotEmpty studentIds`. This will return a **400 error**.

**Impact:** Mentors cannot create individual sessions from the mentor dashboard.  
**Fix needed:**

- Either: Change the `MentorCreateSessionPage` to only allow GROUP session creation (individual sessions are created by students booking them)
- Or: Add a student selector to `MentorCreateSessionPage` for INDIVIDUAL type
- Or: Remove `@NotEmpty` from `CreateSessionDTO.studentIds` in the backend (since `POST /api/sessions/book` already handles student self-booking)

---

### 🟠 HIGH — Significant UX / Business Logic Gap

#### [GAP-5] `DashboardPage.tsx` is Dead Code

**What's missing:**  
`frontend/src/pages/DashboardPage.tsx` exports a `DashboardPage` component but it is **not imported or used anywhere** in `App.tsx`. The actual student dashboard uses `StudentDashboardPage.tsx`. This 300+ line file is orphaned code.

**Impact:** Developer confusion, potential stale logic, build bloat.  
**Fix needed:** Delete `DashboardPage.tsx` or confirm if it's meant to replace/merge with `StudentDashboardPage.tsx`.

---

#### [GAP-6] No Notification System

**What's missing:**  
There are zero notifications in the app. Students and mentors only discover status changes by refreshing their dashboards manually.

Key events with no notification:

- Student books → Mentor gets no alert
- Mentor approves/rejects → Student gets no alert
- Meeting link provided → No email/push to student
- Receipt rejected → No immediate alert to student
- Session starting in 30 min → No reminder

**Impact:** Critical for a marketplace product. Mentors will miss bookings.  
**Fix needed:**

- Email notifications via SendGrid/Resend on key session lifecycle events
- Or in-app notification bell (Notification entity + polling or WebSocket)

---

#### [GAP-7] No Mentor Availability / Calendar

**What's missing:**  
There's no concept of mentor availability. When a student opens `BookingDialog`, they can pick any date and time in the future with no validation against the mentor's availability or existing schedule.

**Impact:** Students can book sessions that conflict with other bookings or when the mentor is unavailable.  
**Fix needed:**

- `MentorAvailability` entity: day-of-week blocks or specific date ranges
- Show available time slots in `BookingDialog` instead of free datetime-local input
- Or at minimum: show the mentor's existing scheduled sessions as blocked times

---

#### [GAP-8] Group Session Booking Creates a New Session (Should Join Existing)

**What's missing:**  
In `BookingDialog`, when a student selects `GROUP` session type, it calls `POST /api/sessions/book` which creates a **brand new group session** owned by that student. But group sessions are supposed to be created by mentors and joined by students via `POST /api/sessions/:id/join`.

**Impact:** Group session model is broken — students can accidentally create group sessions that show up in the mentor's inbox as bookings, when the intent is to join an existing open session.  
**Fix needed:**

- Remove `GROUP` option from student `BookingDialog` entirely
- In `BookingDialog`, for GROUP sessions: show a list of existing open group sessions for that mentor's subjects and use the join flow instead
- Or add guidance text: "For group sessions, visit [Open Sessions](/sessions/open)"

---

#### [GAP-9] Session Detail Page Has No Access Control

**What's missing:**  
`/sessions/:sessionId` is accessible by any authenticated user. A student can navigate to `/sessions/99` and see a completely different student's private session details (meeting link, password, receipt URL, rejection reason).

**Impact:** Privacy leak — meeting credentials and personal data exposed.  
**Fix needed:**

- Backend: `GET /api/sessions/:id` should validate that the requesting user is the session's student, mentor, or an admin
- Frontend: Show a "Not authorized" screen if the logged-in user isn't part of this session

---

#### [GAP-10] No Student Profile for Mentors to View

**What's missing:**  
In the mentor inbox and session management, mentors see `studentName` as plain text. They cannot click to view the student's profile (learning goals, history, number of sessions, etc.). The backend has `GET /api/students/:id` but there is no student profile page in the frontend.

**Impact:** Mentors have no context about who they're teaching.  
**Fix needed:**

- Create a `StudentProfilePage` at `/students/:studentId`
- Link student names in mentor session cards to this page

---

### 🟡 MEDIUM — Quality / Completeness Gaps

#### [GAP-11] No Mentor Verification / Approval Workflow

**What's missing:**  
Any user who picks "Mentor" during onboarding can immediately create a profile, add subjects, and start accepting bookings. There's no admin approval step, no credential verification, no "pending approval" state.

**Fix needed:**

- Add `isVerified: boolean` / `verificationStatus: PENDING | APPROVED | REJECTED` to Mentor entity
- Admin `ManageMentorsPage` should have Approve/Reject actions
- Unverified mentors' profiles shouldn't show in public `/mentors` listing

---

#### [GAP-12] No Student Settings / Edit Profile Page

**What's missing:**  
Students can update their `learningGoals` inline on the dashboard, but there's no dedicated settings/profile page at e.g. `/student/settings`. They cannot change their display name (handled by Clerk), nor update other profile details after onboarding.

**Fix needed:**

- Add `/student/settings` route with student profile form
- Allow updating learningGoals, profile image, cover image in one place

---

#### [GAP-13] No Waitlist for Full Group Sessions

**What's missing:**  
When `currentParticipants >= maxParticipants` on a group session, the `JOIN` button in `OpenGroupSessionsPage` makes the API call anyway (no front-end guard). The backend will probably reject it, but there's no UI feedback or waitlist option.

**Fix needed:**

- Disable "Join Session" button when session is full
- Show "Session Full" badge
- Optional: "Notify me if a spot opens" waitlist feature

---

#### [GAP-14] No Post-Session Mentor Rating of Student

**What's missing:**  
Students can rate and review mentors after sessions (`POST /api/sessions/:id/review`). But mentors cannot rate or leave structured feedback about students. The `CompleteSessionDTO` exists but only stores completion notes.

**Fix needed:**

- Add `mentorNotes` on student performance to `SessionDTO`
- This enriches student profiles and helps mentors assess returning students

---

#### [GAP-15] No Admin Analytics / Reports

**What's missing:**  
The admin dashboard has 4 count cards (total sessions, mentors, subjects, students) and a recent sessions table. There are no:

- Revenue tracking (sessions × price)
- Session completion rate
- Mentor performance leaderboard
- Student activity over time
- Monthly booking trends chart

**Fix needed:**

- Add a `/api/admin/analytics` endpoint with aggregated stats
- Add charts to `AdminDashboardPage` using Recharts or similar

---

#### [GAP-16] Payment Verification Has No Receipt Image Zoom

**What's missing:**  
In the mentor inbox, there's a `previewUrl` state to show the receipt image, but the preview is a small thumbnail. Mentors need to zoom in to verify bank transfer details clearly.

**Fix needed:**

- Add a lightbox/zoom modal for the receipt image preview

---

#### [GAP-17] No Guided Onboarding Flow for Mentors

**What's missing:**  
After the onboarding page, a new mentor lands on `/mentor/dashboard` with 0 subjects and no guidance. There's no step-by-step wizard that says:

1. ✅ Create profile
2. ⬜ Add your first subject
3. ⬜ Create your first session

**Fix needed:**

- Add a "Getting Started" checklist card to `MentorDashboardPage` that hides once all steps are complete

---

#### [GAP-18] JWT / Onboarding Race Condition

**What's missing:**  
After `POST /api/onboarding/complete`, the Clerk JWT in the client still contains the old roles (no role or USER). The `isMentor()` check on the redirect (`App.tsx` line 83–86) may send the newly-onboarded mentor to the student dashboard because the JWT hasn't refreshed yet.

**Fix needed:**

- After `onboardingApi.complete()` succeeds, force a Clerk token refresh: `await user.reload()` then navigate
- Or add a brief "Setting up your account…" screen with a token refresh loop before redirect

---

### 🔵 LOW — Minor Polish / Clean-up

| #      | Gap                                                                                                                       | Fix                                                           |
| ------ | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| GAP-19 | `DashboardPage.tsx` orphaned file                                                                                         | Delete the file                                               |
| GAP-20 | No "Confirm Cancel" for session cancellation on student dashboard                                                         | Add a confirmation dialog                                     |
| GAP-21 | `SubjectsPage` category filter shows only actual DB categories, but initial subjects have null category (see GAP-2)       | Resolve after fixing GAP-2                                    |
| GAP-22 | `BookingDialog` GROUP type → sets `maxParticipants` from a dropdown, but the backend may have a different default logic   | Clarify behavior per GAP-8 fix                                |
| GAP-23 | `PaymentPage` "Already Submitted" state doesn't redirect but shows a static message — student can re-upload by refreshing | Add navigation back to dashboard                              |
| GAP-24 | No 404 page defined in App.tsx routing                                                                                    | Add catch-all `<Route path="*" element={<NotFoundPage />} />` |
| GAP-25 | `MentorPreview` component on Home page uses hardcoded data, not real mentors from API                                     | Connect to `useMentors()`                                     |
| GAP-26 | `Testimonials` component uses hardcoded data                                                                              | Could pull from real reviews via API                          |
| GAP-27 | Session filter state resets on page refresh for student dashboard                                                         | Use URL query params or localStorage for filter persistence   |

---

## Summary Table

| Priority    | Count | Description                                                                                                                                                                 |
| ----------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🔴 Critical | 4     | GAP-1 (no pricing), GAP-2 (category broken), GAP-3 (no sign-in routes), GAP-4 (mentor create-session 400 error)                                                             |
| 🟠 High     | 6     | GAP-5 (dead code), GAP-6 (no notifications), GAP-7 (no availability), GAP-8 (group booking logic), GAP-9 (no access control on session detail), GAP-10 (no student profile) |
| 🟡 Medium   | 8     | GAP-11 through GAP-18                                                                                                                                                       |
| 🔵 Low      | 9     | GAP-19 through GAP-27                                                                                                                                                       |

---

## What IS Working Well ✅

- Complete auth layer via Clerk with JWT role-based access
- Full session lifecycle: PENDING → SCHEDULED → STARTED → COMPLETED
- Receipt submission + mentor approval flow
- Group session creation and join/leave
- Post-session resources (recording, links, assessment)
- Student and mentor reviews with rating aggregation
- Full admin CRUD for all entities
- Image uploads (profile, cover, subjects, receipts) via Cloudinary
- TanStack Query for data caching + mutation feedback with toasts
- Role-based routing guards (ProtectedRoute, AdminRoute, OnboardingGuard)
- Mentor and student profile image/cover upload
- Session filtering and sorting in mentor dashboard
- Public browsing without auth
