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


You are a senior full-stack engineer working on my Skill Mentor app.

Your job is to FIX the architecture gaps, implement the missing backend + frontend features, and TEST all related endpoints properly without breaking existing flows.

Tech stack:
- Frontend: React + TypeScript
- Backend: Spring Boot
- Auth: Clerk
- Existing domain: mentors, students, subjects, sessions, onboarding, reviews, admin dashboard, payment slip upload

Important rules:
1. Do not do shallow fixes.
2. Do not hardcode dummy values unless clearly marked as temporary fallback.
3. Keep backward compatibility where reasonable.
4. Refactor carefully and remove dead code only if confirmed unused.
5. Add proper validation, error handling, loading states, empty states, and authorization checks.
6. After implementation, test every changed endpoint and every affected UI flow.
7. Show exact backend validation messages in the frontend.
8. Use clean production-level code.

==================================================
MAIN GOAL
==================================================

Fix all important product gaps in the student-mentor marketplace flow, especially:
- pricing
- mentor bank details
- subject category support
- auth routes
- mentor create-session bug
- endpoint testing
- security / access control
- booking and payment flow consistency

Also add:
- hourly price for mentors
- mentor bank account holder name
- mentor bank account number
- mentor bank name

==================================================
FEATURES TO IMPLEMENT
==================================================

--------------------------------------------------
1. PRICING + MENTOR BANK DETAILS
--------------------------------------------------

Problem:
Currently the payment flow is broken because students do not know:
- how much to pay
- which bank account to pay to
- whose bank account it is
- what reference to use

Required fix:

Backend:
- Add the following fields to Mentor entity:
  - hourlyRate: BigDecimal
  - bankAccountName: String
  - bankAccountNumber: String
  - bankName: String

Validation:
- hourlyRate must be required and > 0
- bankAccountName required for mentors
- bankAccountNumber required for mentors
- bankName required for mentors
- trim inputs
- apply sensible max lengths
- do not allow blank strings

DTO updates:
- MentorDTO
- CreateMentorProfileDTO / UpdateMentorProfileDTO
- Any admin or profile response DTOs that expose mentor profile data
- Any frontend types/interfaces/hooks using mentor profile data

Business logic:
- Payment amount must be shown on PaymentPage
- Calculate amount as:
  sessionPrice = mentor.hourlyRate × (durationMinutes / 60.0)
- Use BigDecimal properly in backend for money calculations
- Round safely to 2 decimal places where needed
- If duration is 90 mins, price should be 1.5 × hourlyRate
- If there is already a fixed sessionPrice architecture, implement carefully; otherwise derive dynamically

Frontend:
- In mentor profile create/edit form, allow mentor to enter:
  - hourly price
  - bank account name
  - bank account number
  - bank name
- In public mentor details and booking/payment flow, display:
  - hourly price clearly
- In PaymentPage, display:
  - amount to pay
  - bank name
  - account holder name
  - account number
  - payment reference text
- Add copy buttons where useful
- Add clear text like:
  “Transfer the amount using the reference below, then upload your payment slip.”

Reference format:
- Generate a simple payment reference like:
  SM-{sessionId}-{studentId}
  or another clean unique reference based on session/booking id

Acceptance criteria:
- Student always sees exact payment amount before uploading slip
- Student always sees mentor bank details
- Mentor can manage these fields from profile
- No payment flow exists without pricing info

--------------------------------------------------
2. SUBJECT CATEGORY SUPPORT
--------------------------------------------------

Problem:
Category exists in SubjectDTO and filtering UI, but cannot be created or updated.

Required fix:

Backend:
- Add category field to:
  - CreateSubjectDTO
  - UpdateSubjectDTO
- Persist category in entity and mapper logic
- Ensure create/update endpoints accept and save category

Frontend:
- Add category input/select field to:
  - MentorSubjectsPage create form
  - MentorSubjectsPage edit form
  - ManageSubjectsPage admin form
- Update frontend DTO/types/api layer
- Ensure category shows in subject cards and detail pages where relevant
- Ensure category filter on /subjects works correctly

Data handling:
- Existing null categories should not break UI
- Filter should still include “All”
- Optionally backfill null categories only if safe and clearly separated

Acceptance criteria:
- New subject can be created with category
- Existing subject category can be edited
- Category filter actually works

--------------------------------------------------
3. ADD CLERK SIGN-IN / SIGN-UP ROUTES
--------------------------------------------------

Problem:
Some code redirects to /sign-in and /sign-up, but routes do not exist.

Required fix:

Frontend App routing:
- Add Clerk routes in App.tsx:

<Route path="sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
<Route path="sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />

Also:
- Ensure redirects from protected pages go to valid auth routes
- Add return/back behavior if applicable
- Verify unauthenticated booking flow no longer hits 404

Acceptance criteria:
- Clicking Book Session while logged out redirects to real sign-in page
- No 404 on sign-in/sign-up navigation

--------------------------------------------------
4. FIX MENTOR CREATE SESSION BUG
--------------------------------------------------

Problem:
Mentor individual session creation is broken because backend requires non-empty studentIds.

Goal:
Make session creation flow logically correct.

Required decision:
- Student should create/book individual sessions for themselves
- Mentor should create open group sessions from mentor dashboard
- Mentor should NOT create “individual” sessions without choosing a student unless there is a valid selector

Implement this cleanly:
Option preferred:
- Restrict MentorCreateSessionPage to GROUP session creation only
- Remove INDIVIDUAL option from mentor session creation UI
- Add explanation text:
  “Individual sessions are created when a student books you.”
- Backend validation should remain logically consistent

Alternative only if architecture already expects both:
- Add student selector when mentor chooses INDIVIDUAL
- Pass valid studentIds
- Keep validation correct

Also:
- Fix exact validation errors so frontend displays precise backend message

Acceptance criteria:
- Mentor session creation no longer returns 400 due to empty studentIds
- Flow aligns with product design

--------------------------------------------------
5. SHOW BACKEND VALIDATION ERRORS EXACTLY
--------------------------------------------------

Problem:
Frontend currently hides exact backend error reasons.

Required fix:

Backend:
- Standardize error response shape for validation/business errors
- Example:
  {
    "timestamp": "...",
    "status": 400,
    "error": "Validation Failed",
    "message": "studentIds must not be empty",
    "fieldErrors": {
      "studentIds": "must not be empty"
    }
  }

Frontend:
- Centralize API error parsing in api client / axios interceptor / fetch wrapper
- Show exact validation messages in forms and toast alerts
- For forms, map field errors to inputs where possible
- For general business errors, show message from backend

Acceptance criteria:
- When create/update/book fails, user sees the real reason
- No generic useless “Something went wrong” unless truly unknown

--------------------------------------------------
6. TEST ALL RELEVANT ENDPOINTS
--------------------------------------------------

I want full endpoint verification for the affected modules.

Backend testing required:
- Add/update integration tests for controllers/services/repositories where relevant
- Use MockMvc / Spring Boot integration tests
- Cover happy path + validation failures + authorization failures

Test these endpoint areas carefully:
1. Mentor profile endpoints
2. Subject CRUD endpoints
3. Session creation endpoints
4. Session booking endpoints
5. Payment slip upload / payment review endpoints
6. Session detail endpoint access control
7. Auth-dependent onboarding redirects if backend relevant
8. Admin subject/mentor management endpoints
9. Group join endpoints if present

Minimum scenarios to test:

Mentor profile
- create mentor profile with hourlyRate + bank details
- update mentor profile successfully
- reject invalid hourlyRate
- reject blank bank fields
- get mentor profile returns new fields

Subjects
- create subject with category
- update subject category
- list/filter subjects by category
- reject invalid payloads

Sessions
- mentor creates valid group session
- mentor cannot create invalid individual session with empty studentIds
- student books individual session successfully
- session price can be derived for payment page
- duration-based pricing calculation works correctly

Payments
- payment page data contains price + bank details
- upload slip works
- mentor/admin review payment works
- rejected payment surfaces reason correctly

Access control
- unrelated student cannot access another student's private session detail
- mentor of session can access
- session student can access
- admin can access if business rules allow
- unauthorized role gets 403/404 as appropriate

Auth routes / frontend flows
- unauthenticated user redirected to /sign-in, not 404

Error handling
- validation errors return exact structured messages

Also:
- If Postman collection or Swagger/OpenAPI exists, update it
- If not, create/update endpoint documentation for changed payloads

--------------------------------------------------
7. SESSION DETAIL ACCESS CONTROL
--------------------------------------------------

Problem:
Any authenticated user may be able to access /sessions/:id.

Required fix:

Backend:
- Secure GET /api/sessions/{id}
- Only allow:
  - assigned student
  - session mentor
  - admin
- Reject everyone else

Frontend:
- Handle 403/404 properly
- Show clean “Not authorized” or “Session not found” UI state

Also protect any sensitive fields:
- meeting link
- meeting password
- payment slip URL
- rejection reason
- private notes

Acceptance criteria:
- No privacy leak across users

--------------------------------------------------
8. GROUP SESSION BOOKING LOGIC
--------------------------------------------------

Problem:
Student GROUP booking currently creates a new group session instead of joining an existing one.

Required fix:
- Do not let student create a brand new group session from BookingDialog unless product design explicitly supports that
- Prefer this behavior:
  - student books INDIVIDUAL from mentor page
  - student joins existing GROUP sessions from open sessions page

Implementation:
- Remove or disable GROUP option from normal student BookingDialog
- Add helper text directing user to open group sessions page
- If existing architecture supports join flow:
  - ensure GROUP joining uses POST /api/sessions/{id}/join
- Prevent confusion between “create group session” and “join group session”

Acceptance criteria:
- Student does not accidentally create new group sessions when intending to join one

--------------------------------------------------
9. MENTOR DASHBOARD / PROFILE QUALITY IMPROVEMENTS
--------------------------------------------------

Required additions:
- Show mentor hourly price in dashboard/profile/edit pages
- Show mentor bank details form section
- Add better helper text and validation
- Ensure mentor preview/profile public pages display pricing cleanly
- Ensure mentor onboarding/edit flow feels complete

Optional polish if time permits:
- Getting Started checklist:
  1. Create profile
  2. Add first subject
  3. Create first group session

--------------------------------------------------
10. DEAD CODE CLEANUP
--------------------------------------------------

Investigate DashboardPage.tsx.
- If completely unused and replaced by StudentDashboardPage.tsx, remove it
- Update imports/routes if needed
- Make sure no accidental references remain

Do not delete files blindly.
Confirm before removal by checking imports and routes.

--------------------------------------------------
11. ADD 404 PAGE
--------------------------------------------------

If missing:
- Add NotFoundPage
- Add catch-all route:
  <Route path="*" element={<NotFoundPage />} />

Ensure auth redirects and broken paths behave properly.

--------------------------------------------------
12. MENTOR AVAILABILITY + TIME CONFLICT PREVENTION
--------------------------------------------------

Problem:
Students can currently pick any future date/time without checking whether:
- the mentor is actually available
- the mentor already has another session at that time
- the selected slot overlaps an existing booking
- the selected time falls outside mentor working hours

This can create invalid bookings and double-book the mentor.

Required fix:
Implement real mentor availability and strict time conflict prevention across backend and frontend.

Backend:
Add a proper mentor availability model.

Recommended structure:
- MentorAvailability entity
  - id
  - mentorId
  - dayOfWeek
  - startTime
  - endTime
  - isActive
- Optional future extension:
  - specificDate overrides
  - blocked dates / unavailable exceptions
  - buffer time between sessions

At minimum implement:
1. Weekly recurring mentor availability
2. Conflict detection against existing sessions
3. Validation to prevent overlapping bookings

Business rules:
- A student can only book a slot that falls fully inside the mentor’s available time window
- A student cannot book a slot that overlaps any existing session for that mentor
- A mentor cannot create a group session that overlaps an existing session
- Same mentor must never have two active sessions overlapping in time
- Session overlap logic must consider:
  - requested start datetime
  - durationMinutes
  - computed end datetime
- Block conflicts for statuses that still reserve time, such as:
  - PENDING
  - PAYMENT_SUBMITTED
  - CONFIRMED
  - APPROVED
  - or any equivalent active/reserved states in current architecture
- Cancelled/rejected/completed sessions should not block the slot unless business rules say otherwise

Conflict logic:
- Compute session end time from start + duration
- Reject any new session where:
  existing.start < requested.end
  AND existing.end > requested.start

Create backend endpoints such as:
- GET /api/mentors/{mentorId}/availability
- PUT/POST /api/mentors/{mentorId}/availability
- GET /api/mentors/{mentorId}/available-slots?date=YYYY-MM-DD&durationMinutes=60
or equivalent clean REST design

Availability management:
Mentor must be able to:
- set available days
- set available start/end times
- update availability later
- disable a day completely

Frontend:
Add a mentor availability management UI where mentors can:
- choose available weekdays
- set start/end times for each day
- save and edit availability
- clearly see their configured schedule

Booking UX:
Do NOT use a raw free datetime input as the main booking method if avoidable.
Instead:
- fetch mentor available slots for the selected date
- show only valid bookable times
- disable unavailable times
- show “No slots available” when none exist
- after student selects duration, refresh slots accordingly
- clearly show timezone and local booking time

Conflict prevention:
- Even if frontend filters slots, backend must still enforce conflicts
- If two users try to book the same slot at nearly the same time, backend must reject one safely
- Return a clear conflict error message such as:
  “This time slot is no longer available. Please choose another time.”

Mentor session creation:
- When mentor creates a group session, only allow times that do not conflict with their existing sessions
- Prevent mentor from scheduling outside their own availability unless explicitly allowed by business rules
- If business rules allow override creation, clearly separate it as an advanced/admin-only behavior

UI states:
- Show booked/unavailable slots as disabled
- Show available slots clearly
- Show exact backend conflict messages on failure
- On booking failure due to race condition, refresh available slots automatically

Testing required:
Backend tests:
- create availability successfully
- reject invalid availability ranges
- reject overlapping availability blocks if needed
- student can book inside available window
- student cannot book outside available window
- student cannot book overlapping existing session
- mentor cannot create conflicting session
- cancelled/completed sessions no longer block if intended
- available slots endpoint returns only valid slots

Frontend/manual tests:
- mentor can save availability
- student sees only valid slots
- conflicting times are not selectable
- simultaneous conflict returns clear error
- slot list refreshes after booking failure

Acceptance criteria:
- Mentor availability is visible and manageable
- Students only see real available time slots
- Time conflicts are blocked server-side
- Double booking is prevented
- Booking flow is based on actual mentor availability, not arbitrary datetime selection

==================================================
FRONTEND IMPLEMENTATION DETAILS
==================================================

Please improve these areas carefully:
- React Query hooks / API hooks
- DTO typings
- form validation
- loading and error states
- toasts/snackbars
- precise backend error display
- protected routes
- empty states
- payment UI clarity

Pages/components likely affected:
- App.tsx
- BookingDialog
- PaymentPage
- MentorCreateSessionPage
- Mentor profile create/edit page
- Mentor dashboard
- Subject pages
- ManageSubjectsPage
- SubjectDetailPage
- OpenGroupSessionsPage
- Session detail page
- Any API client types/hooks
- NotFoundPage (new if missing)

Use consistent UI and do not break the current design language.

==================================================
BACKEND IMPLEMENTATION DETAILS
==================================================

Please update:
- entity models
- DTOs
- mappers
- services
- controllers
- validation annotations
- exception handling
- authorization checks
- integration tests
- database migration

Database:
- Add migration for mentor fields:
  - hourly_rate
  - bank_account_name
  - bank_account_number
  - bank_name

Use safe migration strategy.
If existing mentors exist, handle nullability carefully:
- either backfill defaults safely
- or migrate as nullable then enforce in update/create workflow
Explain what you choose in code comments or summary.

Security:
- Verify role checks for mentor/student/admin
- Ensure session access restrictions are enforced server-side, not just frontend

Money:
- Use BigDecimal only
- No floating-point money logic in backend

==================================================
TESTING CHECKLIST
==================================================

After coding, run and verify:

Backend:
- unit/integration tests pass
- all changed endpoints tested
- validation failures tested
- role/authorization tested
- price calculation tested

Frontend:
- logged out user clicking book -> sign-in page
- mentor can update hourly price and bank details
- student can see amount + bank details in PaymentPage
- subject category create/edit/filter works
- mentor create group session works
- invalid actions show exact backend errors
- session detail unauthorized access handled
- 404 page works

Manual end-to-end flows:
1. New mentor onboarding
2. Mentor adds profile + hourly rate + bank details
3. Mentor adds subject with category
4. Student opens mentor page
5. Student books individual session
6. Student sees calculated payment amount and mentor bank info
7. Student uploads slip
8. Mentor reviews booking/payment
9. Session detail accessible only to allowed users

==================================================
EXPECTED OUTPUT FORMAT
==================================================

Work in this order:
1. Analyze current implementation and list exact files to change
2. Implement backend changes first
3. Implement frontend changes
4. Add/update tests
5. Remove dead code if confirmed unused
6. Summarize every changed file
7. Summarize every endpoint tested
8. Mention any assumptions clearly
9. Mention any remaining optional improvements separately

For every important bug fix, explain:
- root cause
- exact change made
- how it was tested


==================================================
NON-NEGOTIABLE REQUIREMENTS
==================================================

- Do not leave payment flow half-done
- Do not leave category UI without backend support
- Do not leave /sign-in redirects broken
- Do not keep mentor create-session broken
- Do not hide backend validation messages
- Do not skip endpoint tests
- Do not expose private session data to unrelated users

Now implement this fully and carefully.