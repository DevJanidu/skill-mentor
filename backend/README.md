# 📌 SkillMentor Backend API – URL Documentation

Base URL:


# 👤 USERS

POST http://localhost:8080/api/users/sync

→ Sync authenticated user from JWT into database (create/update user)
Access: ADMIN, MENTOR, STUDENT (Authenticated only)

GET http://localhost:8080/api/users/me

→ Get currently authenticated user profile
Access: ADMIN, MENTOR, STUDENT (Authenticated only)

GET http://localhost:8080/api/users

→ Get all users
Access: ADMIN only

GET http://localhost:8080/api/users/{clerkId}

→ Get user details by Clerk ID
Access: ADMIN only

DELETE http://localhost:8080/api/users/{clerkId}

→ Delete user by Clerk ID
Access: ADMIN only

# 🧑‍🏫 MENTORS

GET http://localhost:8080/api/mentors

→ Get list of all mentors
Access: Public

GET http://localhost:8080/api/mentors/{id}

→ Get mentor details by mentor ID
Access: Public

GET http://localhost:8080/api/mentors/{id}/sessions

→ Get all sessions conducted by a mentor
Access: Public

POST http://localhost:8080/api/mentors

→ Create mentor profile for logged-in user
Access: ADMIN, MENTOR

PUT http://localhost:8080/api/mentors/{id}

→ Update mentor details (own profile or admin)
Access: ADMIN or MENTOR (own record only)

DELETE http://localhost:8080/api/mentors/{id}

→ Delete mentor
Access: ADMIN only

# 🎓 STUDENTS

GET http://localhost:8080/api/students

→ Get list of all students
Access: ADMIN only

GET http://localhost:8080/api/students/{id}

→ Get student details
Access: ADMIN or STUDENT (own record)

GET http://localhost:8080/api/students/{id}/sessions

→ Get sessions of a student
Access: ADMIN or STUDENT (own record)

POST http://localhost:8080/api/students

→ Register student profile for logged-in user
Access: STUDENT

PUT http://localhost:8080/api/students/{id}

→ Update student profile
Access: ADMIN or STUDENT (own record)

DELETE http://localhost:8080/api/students/{id}

→ Delete student
Access: ADMIN only

# 📅 SESSIONS

GET http://localhost:8080/api/sessions

→ Get all sessions
Access: Public

GET http://localhost:8080/api/sessions/{id}

→ Get session details
Access: Public

GET http://localhost:8080/api/sessions/student/{studentId}

→ Get sessions associated with a student
Access: ADMIN or STUDENT (own record)

GET http://localhost:8080/api/sessions/mentor/{mentorId}

→ Get sessions associated with a mentor
Access: Public

POST http://localhost:8080/api/sessions

→ Create a new session
Access: ADMIN, MENTOR

PUT http://localhost:8080/api/sessions/{id}

→ Update session
Access: ADMIN or MENTOR (own session only)

DELETE http://localhost:8080/api/sessions/{id}

→ Delete session
Access: ADMIN or MENTOR (own session only)

# 📚 SUBJECTS

GET http://localhost:8080/api/subjects

→ Get all subjects
Access: Public

GET http://localhost:8080/api/subjects/{id}

→ Get subject details
Access: Public

POST http://localhost:8080/api/subjects

→ Create new subject and assign mentor
Access: ADMIN, MENTOR

PUT http://localhost:8080/api/subjects/{id}

→ Update subject
Access: ADMIN, MENTOR

DELETE http://localhost:8080/api/subjects/{id}

→ Delete subject
Access: ADMIN only

