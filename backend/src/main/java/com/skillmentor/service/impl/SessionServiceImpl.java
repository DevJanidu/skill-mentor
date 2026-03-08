package com.skillmentor.service.impl;

import com.skillmentor.dto.session.*;
import com.skillmentor.entity.Mentor;
import com.skillmentor.entity.Session;
import com.skillmentor.entity.Student;
import com.skillmentor.entity.Subject;
import com.skillmentor.exception.SkillMentorException;
import com.skillmentor.mapper.SessionMapper;
import com.skillmentor.repository.MentorRepository;
import com.skillmentor.repository.SessionRepository;
import com.skillmentor.repository.StudentRepository;
import com.skillmentor.repository.SubjectRepository;
import com.skillmentor.service.SessionService;
import com.skillmentor.utils.SessionAvailabilityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SessionServiceImpl implements SessionService {

    private final SessionRepository sessionRepository;
    private final StudentRepository studentRepository;
    private final MentorRepository mentorRepository;
    private final SubjectRepository subjectRepository;


      // FETCH OPERATIONS


    @Override
    @Transactional(readOnly = true)
    public List<SessionDTO> getAllSessions() {
        log.debug("Fetching all sessions");

        return sessionRepository.findAll()
                .stream()
                .map(SessionMapper::toDTO)
                .toList();
    }

    @Cacheable(value = "sessionDetails", key = "#id")
    @Override
    @Transactional(readOnly = true)
    public SessionDTO getSessionById(Long id, String callerClerkId) {
        log.debug("Fetching session with id {} [cache miss]", id);

        Session session = sessionRepository.findById(id)
                .orElseThrow(() -> new SkillMentorException(
                        "Session not found with id " + id,
                        HttpStatus.NOT_FOUND
                ));

        // Access control: admin, owning mentor, or enrolled student
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            boolean isMentorOwner = session.getMentor() != null
                    && session.getMentor().getUser() != null
                    && callerClerkId.equals(session.getMentor().getUser().getClerkId());

            boolean isEnrolledStudent = session.getStudents().stream()
                    .anyMatch(s -> s.getUser() != null && callerClerkId.equals(s.getUser().getClerkId()));

            if (!isMentorOwner && !isEnrolledStudent) {
                throw new SkillMentorException(
                        "You do not have access to this session", HttpStatus.FORBIDDEN);
            }
        }

        return SessionMapper.toDTO(session);
    }


    //  CREATE SESSION


    @Caching(evict = {
            @CacheEvict(value = "mentorSessions", key = "#dto.mentorId"),
            @CacheEvict(value = "dashboardStats", allEntries = true)
    })
    @Override
    @Transactional
    public SessionDTO createSession(CreateSessionDTO dto) {
        log.debug("Creating new session, type={}", dto.getSessionType());

        // --- Mentor ---
        Mentor mentor = mentorRepository.findById(dto.getMentorId())
                .orElseThrow(() -> new SkillMentorException(
                        "Mentor not found with id " + dto.getMentorId(),
                        HttpStatus.NOT_FOUND
                ));

        // --- Subject ---
        Subject subject = subjectRepository.findById(dto.getSubjectId())
                .orElseThrow(() -> new SkillMentorException(
                        "Subject not found with id " + dto.getSubjectId(),
                        HttpStatus.NOT_FOUND
                ));

        // --- Students (optional – empty list = open session slot) ---
        List<Long> studentIdList = (dto.getStudentIds() != null) ? dto.getStudentIds() : List.of();
        List<Student> students = studentRepository.findAllById(studentIdList);

        if (students.size() != studentIdList.size()) {
            throw new SkillMentorException(
                    "One or more students not found",
                    HttpStatus.NOT_FOUND
            );
        }

        // SESSION TYPE VALIDATION
        if (dto.getSessionType() == SessionType.INDIVIDUAL) {
            // Allow 0 students (open slot) OR exactly 1 pre-assigned student
            if (!students.isEmpty() && students.size() != 1) {
                throw new SkillMentorException(
                        "Individual sessions can have at most one pre-assigned student",
                        HttpStatus.BAD_REQUEST
                );
            }
            // maxParticipants for INDIVIDUAL is always 1 – auto-correct silently
            dto.setMaxParticipants(1);

        } else if (dto.getSessionType() == SessionType.GROUP) {
            // For GROUP sessions
            if (dto.getMaxParticipants() == null || dto.getMaxParticipants() < 2) {
                throw new SkillMentorException(
                        "Group session must have maxParticipants >= 2",
                        HttpStatus.BAD_REQUEST
                );
            }

            if (dto.getMaxParticipants() > 50) {
                throw new SkillMentorException(
                        "Group session cannot exceed 50 participants",
                        HttpStatus.BAD_REQUEST
                );
            }

            if (!students.isEmpty() && students.size() > dto.getMaxParticipants()) {
                throw new SkillMentorException(
                        "Number of students (" + students.size() + ") exceeds maximum participants (" + dto.getMaxParticipants() + ")",
                        HttpStatus.BAD_REQUEST
                );
            }
        }

        // Create the session entity
        Session session = SessionMapper.toEntity(dto, mentor, subject, students);

        // Ensure maxParticipants reflects session type
        if (session.getSessionType() == SessionType.INDIVIDUAL) {
            session.setMaxParticipants(1);
        } else {
            session.setMaxParticipants(dto.getMaxParticipants());
        }

        // TIME & AVAILABILITY
        SessionAvailabilityUtil.validateFutureSession(dto.getSessionAt());

        Instant start = dto.getSessionAt().toInstant();
        Instant end = SessionAvailabilityUtil.calculateEndTime(
                start,
                dto.getDurationMinutes()
        );

        // Active statuses used to block scheduling
        List<SessionStatus> activeStatuses = List.of(
                SessionStatus.PENDING,
                SessionStatus.SCHEDULED,
                SessionStatus.STARTED
        );

        // Mentor availability
        SessionAvailabilityUtil.validateMentorAvailability(
                sessionRepository.findActiveSessionsByMentorId(mentor.getId(), activeStatuses),
                start,
                end
        );

        // Student availability (ALL students)
        for (Student student : students) {
            SessionAvailabilityUtil.validateStudentAvailability(
                    sessionRepository.findActiveSessionsByStudentId(student.getId(), activeStatuses),
                    start,
                    end
            );
        }

        // SAVE SESSION
        log.debug("Saving session with type: {}", dto.getSessionType());
        Session savedSession = sessionRepository.save(session);
        log.debug(" session CREATED ");
        return SessionMapper.toDTO(savedSession);
    }


      // UPDATE SESSION


    @Caching(evict = {
            @CacheEvict(value = "sessionDetails", key = "#id"),
            @CacheEvict(value = "mentorSessions", allEntries = true),
            @CacheEvict(value = "dashboardStats", allEntries = true)
    })
    @Override
    @Transactional
    public SessionDTO updateSessionDto(Long id, UpdateSessionDTO dto) {
        log.debug("Updating session with id {}", id);


        // --- AUTO-CORRECT maxParticipants based on session type ---
        if (dto.getSessionType() == SessionType.INDIVIDUAL) {
            if (dto.getMaxParticipants() != null && dto.getMaxParticipants() != 1) {
                log.warn("Auto-updating maxParticipants from {} to 1 for INDIVIDUAL session",
                        dto.getMaxParticipants());
                dto.setMaxParticipants(1);
            }
        }


        try {
            Session session = sessionRepository.findById(id)
                    .orElseThrow(() -> new SkillMentorException(
                            "Session not found with id " + id,
                            HttpStatus.NOT_FOUND
                    ));

            // VALIDATE maxParticipants based on session type (if provided)
            if (dto.getMaxParticipants() != null) {
                if (session.getSessionType() == SessionType.INDIVIDUAL) {
                    // INDIVIDUAL sessions must always have maxParticipants = 1
                    if (dto.getMaxParticipants() != 1) {
                        throw new SkillMentorException(
                                "Individual session must have maxParticipants = 1",
                                HttpStatus.BAD_REQUEST
                        );
                    }
                } else if (session.getSessionType() == SessionType.GROUP) {
                    // GROUP sessions must have maxParticipants between 2 and 50
                    if (dto.getMaxParticipants() < 2) {
                        throw new SkillMentorException(
                                "Group session must have maxParticipants >= 2",
                                HttpStatus.BAD_REQUEST
                        );
                    }

                    if (dto.getMaxParticipants() > 50) {
                        throw new SkillMentorException(
                                "Group session cannot exceed 50 participants",
                                HttpStatus.BAD_REQUEST
                        );
                    }

                    // Check if current enrolled students exceed new max
                    int currentStudentCount = session.getStudents().size();
                    if (currentStudentCount > dto.getMaxParticipants()) {
                        throw new SkillMentorException(
                                "Cannot reduce maxParticipants to " + dto.getMaxParticipants() +
                                        " because " + currentStudentCount + " students are already enrolled",
                                HttpStatus.BAD_REQUEST
                        );
                    }
                }
            }

            // VALIDATE session time change (if provided)
            if (dto.getSessionAt() != null) {
                SessionAvailabilityUtil.validateFutureSession(dto.getSessionAt());

                Instant newStart = dto.getSessionAt().toInstant();
                Integer duration = dto.getDurationMinutes() != null
                        ? dto.getDurationMinutes()
                        : session.getDurationMinutes();

                Instant newEnd = SessionAvailabilityUtil.calculateEndTime(newStart, duration);

                // Check mentor availability (exclude current session)
                List<Session> mentorSessions = sessionRepository.findByMentorId(session.getMentor().getId())
                        .stream()
                        .filter(s -> !s.getId().equals(id))
                        .toList();

                SessionAvailabilityUtil.validateMentorAvailability(mentorSessions, newStart, newEnd);

                // Check all students' availability (exclude current session)
                for (Student student : session.getStudents()) {
                    List<Session> studentSessions = sessionRepository.findByStudentId(student.getId())
                            .stream()
                            .filter(s -> !s.getId().equals(id))
                            .toList();

                    SessionAvailabilityUtil.validateStudentAvailability(studentSessions, newStart, newEnd);
                }
            }

            // Update the session
            Session updatedSession = SessionMapper.updateSession(session, dto);
            Session savedSession = sessionRepository.save(updatedSession);

            return SessionMapper.toDTO(savedSession);

        } catch (SkillMentorException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Unexpected error updating session {}", id, ex);
            throw new SkillMentorException(
                    "Internal server error while updating session",
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }


       // DELETE SESSION


    @Caching(evict = {
            @CacheEvict(value = "sessionDetails", key = "#id"),
            @CacheEvict(value = "mentorSessions", allEntries = true),
            @CacheEvict(value = "dashboardStats", allEntries = true)
    })
    @Override
    @Transactional
    public void deleteSession(Long id) {
        log.debug("Deleting session with id {}", id);

        Session session = sessionRepository.findById(id)
                .orElseThrow(() -> new SkillMentorException(
                        "Session not found with id " + id,
                        HttpStatus.NOT_FOUND
                ));

        sessionRepository.delete(session);
    }


     //  FILTERED QUERIES


    @Override
    @Transactional(readOnly = true)
    public List<SessionDTO> getSessionsByStudent(Long studentId) {
        return sessionRepository.findByStudentId(studentId)
                .stream()
                .map(SessionMapper::toDTO)
                .toList();
    }

    @Cacheable(value = "mentorSessions", key = "#mentorId")
    @Override
    @Transactional(readOnly = true)
    public List<SessionDTO> getSessionsByMentor(Long mentorId) {
        return sessionRepository.findByMentorId(mentorId)
                .stream()
                .map(SessionMapper::toDTO)
                .toList();
    }


    //  STUDENT SELF-BOOKING


    @Caching(evict = {
            @CacheEvict(value = "mentorSessions", allEntries = true),
            @CacheEvict(value = "dashboardStats", allEntries = true)
    })
    @Transactional
    @Override
    public SessionDTO bookSession(BookSessionDTO dto, String callerClerkId) {
        log.debug("Student {} booking session with mentor {}", callerClerkId, dto.getMentorId());

        // --- Resolve the calling student ---
        Student student = studentRepository.findByUserClerkId(callerClerkId)
                .orElseThrow(() -> new SkillMentorException(
                        "Student profile not found for current user",
                        HttpStatus.NOT_FOUND
                ));

        // --- Mentor ---
        Mentor mentor = mentorRepository.findById(dto.getMentorId())
                .orElseThrow(() -> new SkillMentorException(
                        "Mentor not found with id " + dto.getMentorId(),
                        HttpStatus.NOT_FOUND
                ));

        // --- Subject ---
        Subject subject = subjectRepository.findById(dto.getSubjectId())
                .orElseThrow(() -> new SkillMentorException(
                        "Subject not found with id " + dto.getSubjectId(),
                        HttpStatus.NOT_FOUND
                ));

        // Verify the subject belongs to this mentor
        if (!subject.getMentor().getId().equals(mentor.getId())) {
            throw new SkillMentorException(
                    "Subject does not belong to the selected mentor",
                    HttpStatus.BAD_REQUEST
            );
        }

        // Determine session type (default INDIVIDUAL)
        SessionType sessionType = dto.getSessionType() != null ? dto.getSessionType() : SessionType.INDIVIDUAL;

        // Build session entity
        Session session = Session.builder()
                .mentor(mentor)
                .subject(subject)
                .students(new ArrayList<>(List.of(student)))
                .sessionType(sessionType)
                .sessionStatus(SessionStatus.PENDING)
                .maxParticipants(sessionType == SessionType.INDIVIDUAL
                        ? 1
                        : (dto.getMaxParticipants() != null ? dto.getMaxParticipants() : 2))
                .sessionAt(dto.getSessionAt())
                .durationMinutes(dto.getDurationMinutes())
                .build();

        // TIME & AVAILABILITY
        SessionAvailabilityUtil.validateFutureSession(dto.getSessionAt());

        Instant start = dto.getSessionAt().toInstant();
        Instant end = SessionAvailabilityUtil.calculateEndTime(start, dto.getDurationMinutes());

        // Active statuses that block scheduling
        List<SessionStatus> activeStatuses = List.of(
                SessionStatus.PENDING,
                SessionStatus.SCHEDULED,
                SessionStatus.STARTED
        );

        // Mentor availability
        SessionAvailabilityUtil.validateMentorAvailability(
                sessionRepository.findActiveSessionsByMentorId(mentor.getId(), activeStatuses), start, end
        );

        // Student availability
        SessionAvailabilityUtil.validateStudentAvailability(
                sessionRepository.findActiveSessionsByStudentId(student.getId(), activeStatuses), start, end
        );

        // SAVE
        Session saved = sessionRepository.save(session);
        log.debug("Session booked successfully with id {}", saved.getId());
        return SessionMapper.toDTO(saved);
    }


    // ═════════════════════════════════════════════════════════════════════
    //  P0: SUBMIT RECEIPT (STUDENT)
    // ═════════════════════════════════════════════════════════════════════

    @Caching(evict = {
            @CacheEvict(value = "sessionDetails", key = "#sessionId"),
            @CacheEvict(value = "mentorSessions", allEntries = true)
    })
    @Transactional
    @Override
    public SessionDTO submitReceipt(Long sessionId, SubmitReceiptDTO dto, String callerClerkId) {
        log.debug("Student {} submitting receipt for session {}", callerClerkId, sessionId);

        Student student = studentRepository.findByUserClerkId(callerClerkId)
                .orElseThrow(() -> new SkillMentorException(
                        "Student profile not found for current user", HttpStatus.NOT_FOUND));

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SkillMentorException(
                        "Session not found with id " + sessionId, HttpStatus.NOT_FOUND));

        // Verify student is enrolled
        boolean enrolled = session.getStudents().stream()
                .anyMatch(s -> s.getId().equals(student.getId()));
        if (!enrolled) {
            throw new SkillMentorException("You are not enrolled in this session", HttpStatus.FORBIDDEN);
        }

        // Cannot submit receipt for completed or canceled sessions
        if (session.getSessionStatus() == SessionStatus.COMPLETED
                || session.getSessionStatus() == SessionStatus.CANCELED) {
            throw new SkillMentorException(
                    "Cannot submit receipt for a " + session.getSessionStatus() + " session",
                    HttpStatus.BAD_REQUEST);
        }

        session.setReceiptUrl(dto.getReceiptUrl());
        session.setReceiptStatus(ReceiptStatus.SUBMITTED);
        session.setRejectionReason(null); // clear previous rejection

        Session saved = sessionRepository.save(session);
        log.info("Receipt submitted for session {}", sessionId);
        return SessionMapper.toDTO(saved);
    }


    // ═════════════════════════════════════════════════════════════════════
    //  P0: APPROVE SESSION (MENTOR / ADMIN)
    // ═════════════════════════════════════════════════════════════════════

    @Caching(evict = {
            @CacheEvict(value = "sessionDetails", key = "#sessionId"),
            @CacheEvict(value = "mentorSessions", allEntries = true),
            @CacheEvict(value = "dashboardStats", allEntries = true)
    })
    @Transactional
    @Override
    public SessionDTO approveSession(Long sessionId, ApproveSessionDTO dto, String callerClerkId) {
        log.debug("Approving session {} by {}", sessionId, callerClerkId);

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SkillMentorException(
                        "Session not found with id " + sessionId, HttpStatus.NOT_FOUND));

        // Ownership check: caller must be the owning mentor (admin bypassed in controller)
        validateMentorOwnership(session, callerClerkId);

        if (session.getReceiptStatus() != ReceiptStatus.SUBMITTED) {
            throw new SkillMentorException(
                    "Can only approve sessions with a SUBMITTED receipt (current: " + session.getReceiptStatus() + ")",
                    HttpStatus.BAD_REQUEST);
        }

        session.setSessionStatus(SessionStatus.SCHEDULED);
        session.setReceiptStatus(ReceiptStatus.APPROVED);
        session.setMeetingLink(dto.getMeetingLink());
        session.setMeetingPassword(dto.getMeetingPassword());
        session.setRejectionReason(null);

        Session saved = sessionRepository.save(session);
        log.info("Session {} approved with meeting link", sessionId);
        return SessionMapper.toDTO(saved);
    }


    // ═════════════════════════════════════════════════════════════════════
    //  P0: REJECT SESSION (MENTOR / ADMIN)
    // ═════════════════════════════════════════════════════════════════════

    @Caching(evict = {
            @CacheEvict(value = "sessionDetails", key = "#sessionId"),
            @CacheEvict(value = "mentorSessions", allEntries = true)
    })
    @Transactional
    @Override
    public SessionDTO rejectSession(Long sessionId, RejectSessionDTO dto, String callerClerkId) {
        log.debug("Rejecting session {} by {}", sessionId, callerClerkId);

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SkillMentorException(
                        "Session not found with id " + sessionId, HttpStatus.NOT_FOUND));

        validateMentorOwnership(session, callerClerkId);

        if (session.getReceiptStatus() != ReceiptStatus.SUBMITTED) {
            throw new SkillMentorException(
                    "Can only reject sessions with a SUBMITTED receipt (current: " + session.getReceiptStatus() + ")",
                    HttpStatus.BAD_REQUEST);
        }

        // Receipt is rejected but session stays PENDING so student can re-upload a correct receipt.
        // Using the cancel endpoint is the correct way to fully cancel a session.
        session.setReceiptStatus(ReceiptStatus.REJECTED);
        session.setRejectionReason(dto.getReason());

        Session saved = sessionRepository.save(session);
        log.info("Session {} rejected: {}", sessionId, dto.getReason());
        return SessionMapper.toDTO(saved);
    }


    // ═════════════════════════════════════════════════════════════════════
    //  P1: START SESSION
    // ═════════════════════════════════════════════════════════════════════

    @Caching(evict = {
            @CacheEvict(value = "sessionDetails", key = "#sessionId"),
            @CacheEvict(value = "mentorSessions", allEntries = true),
            @CacheEvict(value = "dashboardStats", allEntries = true)
    })
    @Transactional
    @Override
    public SessionDTO startSession(Long sessionId, String callerClerkId) {
        log.debug("Starting session {} by {}", sessionId, callerClerkId);

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SkillMentorException(
                        "Session not found with id " + sessionId, HttpStatus.NOT_FOUND));

        validateMentorOwnership(session, callerClerkId);

        if (session.getSessionStatus() != SessionStatus.SCHEDULED) {
            throw new SkillMentorException(
                    "Can only start SCHEDULED sessions (current: " + session.getSessionStatus() + ")",
                    HttpStatus.BAD_REQUEST);
        }

        session.setSessionStatus(SessionStatus.STARTED);
        Session saved = sessionRepository.save(session);
        log.info("Session {} started", sessionId);
        return SessionMapper.toDTO(saved);
    }


    // ═════════════════════════════════════════════════════════════════════
    //  P1: COMPLETE SESSION
    // ═════════════════════════════════════════════════════════════════════

    @Caching(evict = {
            @CacheEvict(value = "sessionDetails", key = "#sessionId"),
            @CacheEvict(value = "mentorSessions", allEntries = true),
            @CacheEvict(value = "dashboardStats", allEntries = true)
    })
    @Transactional
    @Override
    public SessionDTO completeSession(Long sessionId, CompleteSessionDTO dto, String callerClerkId) {
        log.debug("Completing session {} by {}", sessionId, callerClerkId);

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SkillMentorException(
                        "Session not found with id " + sessionId, HttpStatus.NOT_FOUND));

        validateMentorOwnership(session, callerClerkId);

        if (session.getSessionStatus() != SessionStatus.STARTED) {
            throw new SkillMentorException(
                    "Can only complete STARTED sessions (current: " + session.getSessionStatus() + ")",
                    HttpStatus.BAD_REQUEST);
        }

        session.setSessionStatus(SessionStatus.COMPLETED);
        if (dto != null && dto.getSessionNotes() != null) {
            session.setSessionNotes(dto.getSessionNotes());
        }

        Session saved = sessionRepository.save(session);
        log.info("Session {} completed", sessionId);
        return SessionMapper.toDTO(saved);
    }


    // ═════════════════════════════════════════════════════════════════════
    //  P1: CANCEL SESSION (STUDENT)
    // ═════════════════════════════════════════════════════════════════════

    @Caching(evict = {
            @CacheEvict(value = "sessionDetails", key = "#sessionId"),
            @CacheEvict(value = "mentorSessions", allEntries = true),
            @CacheEvict(value = "dashboardStats", allEntries = true)
    })
    @Transactional
    @Override
    public SessionDTO cancelSession(Long sessionId, String callerClerkId) {
        log.debug("User {} canceling session {}", callerClerkId, sessionId);

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SkillMentorException(
                        "Session not found with id " + sessionId, HttpStatus.NOT_FOUND));

        // Only allow cancellation of sessions that haven't started yet
        if (session.getSessionStatus() == SessionStatus.STARTED
                || session.getSessionStatus() == SessionStatus.COMPLETED
                || session.getSessionStatus() == SessionStatus.CANCELED) {
            throw new SkillMentorException(
                    "Cannot cancel a session with status: " + session.getSessionStatus(),
                    HttpStatus.BAD_REQUEST);
        }

        // Resolve caller role and enforce ownership accordingly
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isMentor = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_MENTOR"));

        if (isAdmin) {
            // Admins can cancel any session — no ownership check
        } else if (isMentor) {
            // Mentor must own the session
            Mentor mentor = mentorRepository.findByUserClerkId(callerClerkId)
                    .orElseThrow(() -> new SkillMentorException(
                            "Mentor profile not found for current user", HttpStatus.NOT_FOUND));
            if (!mentor.getId().equals(session.getMentor().getId())) {
                throw new SkillMentorException(
                        "You are not the owning mentor of this session", HttpStatus.FORBIDDEN);
            }
        } else {
            // Student must be enrolled
            Student student = studentRepository.findByUserClerkId(callerClerkId)
                    .orElseThrow(() -> new SkillMentorException(
                            "Student profile not found for current user", HttpStatus.NOT_FOUND));
            boolean enrolled = session.getStudents().stream()
                    .anyMatch(s -> s.getId().equals(student.getId()));
            if (!enrolled) {
                throw new SkillMentorException(
                        "You are not enrolled in this session", HttpStatus.FORBIDDEN);
            }
        }

        session.setSessionStatus(SessionStatus.CANCELED);
        Session saved = sessionRepository.save(session);
        log.info("Session {} canceled by user {}", sessionId, callerClerkId);
        return SessionMapper.toDTO(saved);
    }


    // ═════════════════════════════════════════════════════════════════════
    //  P1: OPEN GROUP SESSIONS
    // ═════════════════════════════════════════════════════════════════════

    @Override
    @Transactional(readOnly = true)
    public List<SessionDTO> getOpenGroupSessions() {
        log.debug("Fetching open group sessions");
        return sessionRepository.findOpenGroupSessions(
                        SessionType.GROUP,
                        List.of(SessionStatus.PENDING, SessionStatus.SCHEDULED),
                        java.time.LocalDateTime.now()
                ).stream()
                .map(SessionMapper::toDTO)
                .toList();
    }


    // ═════════════════════════════════════════════════════════════════════
    //  P1: JOIN GROUP SESSION
    // ═════════════════════════════════════════════════════════════════════

    @Caching(evict = {
            @CacheEvict(value = "sessionDetails", key = "#sessionId"),
            @CacheEvict(value = "mentorSessions", allEntries = true)
    })
    @Transactional
    @Override
    public SessionDTO joinSession(Long sessionId, String callerClerkId) {
        log.debug("Student {} joining session {}", callerClerkId, sessionId);

        Student student = studentRepository.findByUserClerkId(callerClerkId)
                .orElseThrow(() -> new SkillMentorException(
                        "Student profile not found for current user", HttpStatus.NOT_FOUND));

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SkillMentorException(
                        "Session not found with id " + sessionId, HttpStatus.NOT_FOUND));

        if (session.getSessionType() != SessionType.GROUP) {
            throw new SkillMentorException("Can only join GROUP sessions", HttpStatus.BAD_REQUEST);
        }

        if (session.getSessionStatus() != SessionStatus.PENDING
                && session.getSessionStatus() != SessionStatus.SCHEDULED) {
            throw new SkillMentorException(
                    "Can only join PENDING or SCHEDULED sessions", HttpStatus.BAD_REQUEST);
        }

        // Already enrolled?
        boolean alreadyEnrolled = session.getStudents().stream()
                .anyMatch(s -> s.getId().equals(student.getId()));
        if (alreadyEnrolled) {
            throw new SkillMentorException("You are already enrolled in this session", HttpStatus.CONFLICT);
        }

        // Seats check
        if (session.getStudents().size() >= session.getMaxParticipants()) {
            throw new SkillMentorException("Session is full – no seats available", HttpStatus.CONFLICT);
        }

        // Time overlap check for student
        Instant start = session.getSessionAt().toInstant();
        Instant end = SessionAvailabilityUtil.calculateEndTime(start, session.getDurationMinutes());
        List<SessionStatus> joinActiveStatuses = List.of(
                SessionStatus.PENDING, SessionStatus.SCHEDULED, SessionStatus.STARTED);
        SessionAvailabilityUtil.validateStudentAvailability(
                sessionRepository.findActiveSessionsByStudentId(student.getId(), joinActiveStatuses), start, end);

        session.getStudents().add(student);
        Session saved = sessionRepository.save(session);
        log.info("Student {} joined session {}", student.getId(), sessionId);
        return SessionMapper.toDTO(saved);
    }


    // ═════════════════════════════════════════════════════════════════════
    //  P1: LEAVE GROUP SESSION
    // ═════════════════════════════════════════════════════════════════════

    @Caching(evict = {
            @CacheEvict(value = "sessionDetails", key = "#sessionId"),
            @CacheEvict(value = "mentorSessions", allEntries = true)
    })
    @Transactional
    @Override
    public SessionDTO leaveSession(Long sessionId, String callerClerkId) {
        log.debug("Student {} leaving session {}", callerClerkId, sessionId);

        Student student = studentRepository.findByUserClerkId(callerClerkId)
                .orElseThrow(() -> new SkillMentorException(
                        "Student profile not found for current user", HttpStatus.NOT_FOUND));

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SkillMentorException(
                        "Session not found with id " + sessionId, HttpStatus.NOT_FOUND));

        boolean enrolled = session.getStudents().stream()
                .anyMatch(s -> s.getId().equals(student.getId()));
        if (!enrolled) {
            throw new SkillMentorException("You are not enrolled in this session", HttpStatus.FORBIDDEN);
        }

        if (session.getSessionStatus() != SessionStatus.PENDING) {
            throw new SkillMentorException(
                    "Can only leave PENDING sessions (current: " + session.getSessionStatus() + ")",
                    HttpStatus.BAD_REQUEST);
        }

        session.getStudents().removeIf(s -> s.getId().equals(student.getId()));
        Session saved = sessionRepository.save(session);
        log.info("Student {} left session {}", student.getId(), sessionId);
        return SessionMapper.toDTO(saved);
    }


    // ═════════════════════════════════════════════════════════════════════
    //  P2: SUBMIT REVIEW
    // ═════════════════════════════════════════════════════════════════════

    @Caching(evict = {
            @CacheEvict(value = "sessionDetails", key = "#sessionId"),
            @CacheEvict(value = "mentorSessions", allEntries = true),
            @CacheEvict(value = "mentorReviews", allEntries = true),
            @CacheEvict(value = "mentorProfile", allEntries = true),
            @CacheEvict(value = "publicMentorList", allEntries = true)
    })
    @Transactional
    @Override
    public SessionDTO submitReview(Long sessionId, ReviewSessionDTO dto, String callerClerkId) {
        log.debug("Student {} reviewing session {}", callerClerkId, sessionId);

        Student student = studentRepository.findByUserClerkId(callerClerkId)
                .orElseThrow(() -> new SkillMentorException(
                        "Student profile not found for current user", HttpStatus.NOT_FOUND));

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SkillMentorException(
                        "Session not found with id " + sessionId, HttpStatus.NOT_FOUND));

        boolean enrolled = session.getStudents().stream()
                .anyMatch(s -> s.getId().equals(student.getId()));
        if (!enrolled) {
            throw new SkillMentorException("You are not enrolled in this session", HttpStatus.FORBIDDEN);
        }

        if (session.getSessionStatus() != SessionStatus.COMPLETED) {
            throw new SkillMentorException(
                    "Can only review COMPLETED sessions", HttpStatus.BAD_REQUEST);
        }

        if (session.getStudentRating() != null) {
            throw new SkillMentorException("This session has already been reviewed", HttpStatus.CONFLICT);
        }

        session.setStudentRating(dto.getRating());
        session.setStudentReview(dto.getReview());
        sessionRepository.save(session);

        // Recalculate mentor rating
        recalculateMentorRating(session.getMentor());

        log.info("Review submitted for session {}", sessionId);
        return SessionMapper.toDTO(session);
    }


    // ═════════════════════════════════════════════════════════════════════
    //  P2: DELETE REVIEW (ADMIN)
    // ═════════════════════════════════════════════════════════════════════

    @Caching(evict = {
            @CacheEvict(value = "sessionDetails", key = "#sessionId"),
            @CacheEvict(value = "mentorSessions", allEntries = true),
            @CacheEvict(value = "mentorReviews", allEntries = true),
            @CacheEvict(value = "mentorProfile", allEntries = true),
            @CacheEvict(value = "publicMentorList", allEntries = true)
    })
    @Transactional
    @Override
    public SessionDTO deleteReview(Long sessionId) {
        log.debug("Admin deleting review for session {}", sessionId);

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SkillMentorException(
                        "Session not found with id " + sessionId, HttpStatus.NOT_FOUND));

        session.setStudentRating(null);
        session.setStudentReview(null);
        sessionRepository.save(session);

        // Recalculate mentor rating
        recalculateMentorRating(session.getMentor());

        log.info("Review deleted for session {}", sessionId);
        return SessionMapper.toDTO(session);
    }


    // ═════════════════════════════════════════════════════════════════════
    //  P3: UPDATE POST-SESSION RESOURCES (MENTOR)
    // ═════════════════════════════════════════════════════════════════════

    @Caching(evict = {
            @CacheEvict(value = "sessionDetails", key = "#sessionId"),
            @CacheEvict(value = "mentorSessions", allEntries = true)
    })
    @Transactional
    @Override
    public SessionDTO updateSessionResources(Long sessionId, UpdateSessionResourcesDTO dto, String callerClerkId) {
        log.debug("Mentor {} updating resources for session {}", callerClerkId, sessionId);

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SkillMentorException(
                        "Session not found with id " + sessionId, HttpStatus.NOT_FOUND));

        validateMentorOwnership(session, callerClerkId);

        if (session.getSessionStatus() == SessionStatus.PENDING
                || session.getSessionStatus() == SessionStatus.CANCELED) {
            throw new SkillMentorException(
                    "Cannot update resources for a " + session.getSessionStatus() + " session",
                    HttpStatus.BAD_REQUEST);
        }

        if (dto.getMeetingLink() != null)     session.setMeetingLink(dto.getMeetingLink());
        if (dto.getMeetingPassword() != null) session.setMeetingPassword(dto.getMeetingPassword());
        if (dto.getRecordingLink() != null)   session.setRecordingLink(dto.getRecordingLink());
        if (dto.getResourceLink() != null)    session.setResourceLink(dto.getResourceLink());
        if (dto.getAssessmentLink() != null)  session.setAssessmentLink(dto.getAssessmentLink());
        if (dto.getSessionNotes() != null)    session.setSessionNotes(dto.getSessionNotes());

        Session saved = sessionRepository.save(session);
        log.info("Resources updated for session {}", sessionId);
        return SessionMapper.toDTO(saved);
    }


    // ═════════════════════════════════════════════════════════════════════
    //  HELPER METHODS
    // ═════════════════════════════════════════════════════════════════════

    private void validateMentorOwnership(Session session, String callerClerkId) {
        // ADMINs bypass the ownership check (controller @PreAuthorize already restricts to ADMIN | MENTOR)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin) return;

        Mentor mentor = mentorRepository.findByUserClerkId(callerClerkId).orElse(null);
        if (mentor == null || !mentor.getId().equals(session.getMentor().getId())) {
            throw new SkillMentorException(
                    "You are not the owning mentor of this session", HttpStatus.FORBIDDEN);
        }
    }

    private void recalculateMentorRating(Mentor mentor) {
        List<Session> reviewedSessions = sessionRepository.findReviewedSessionsByMentorId(mentor.getId());
        if (reviewedSessions.isEmpty()) {
            mentor.setAverageRating(0.0);
            mentor.setTotalReviews(0);
        } else {
            double avg = reviewedSessions.stream()
                    .mapToInt(Session::getStudentRating)
                    .average()
                    .orElse(0.0);
            mentor.setAverageRating(Math.round(avg * 100.0) / 100.0);
            mentor.setTotalReviews(reviewedSessions.size());
        }
        mentorRepository.save(mentor);
        log.info("Mentor {} rating recalculated: avg={}, total={}",
                mentor.getId(), mentor.getAverageRating(), mentor.getTotalReviews());
    }
}
