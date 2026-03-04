package com.skillmentor.service.impl;

import com.skillmentor.dto.session.BookSessionDTO;
import com.skillmentor.dto.session.CreateSessionDTO;
import com.skillmentor.dto.session.SessionDTO;
import com.skillmentor.dto.session.SessionStatus;
import com.skillmentor.dto.session.SessionType;
import com.skillmentor.dto.session.UpdateSessionDTO;
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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
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
    public List<SessionDTO> getAllSessions() {
        log.debug("Fetching all sessions");

        return sessionRepository.findAll()
                .stream()
                .map(SessionMapper::toDTO)
                .toList();
    }

    @Override
    public SessionDTO getSessionById(Long id) {
        log.debug("Fetching session with id {}", id);

        Session session = sessionRepository.findById(id)
                .orElseThrow(() -> new SkillMentorException(
                        "Session not found with id " + id,
                        HttpStatus.NOT_FOUND
                ));

        return SessionMapper.toDTO(session);
    }


     //  CREATE SESSION


    @Override
    public SessionDTO createSession(CreateSessionDTO dto) {
        log.debug("Creating new session type of {}", dto.getSessionType());
        log.debug("Creating new session");

        // --- AUTO-CORRECT maxParticipants based on session type ---
        if (dto.getSessionType() == SessionType.INDIVIDUAL) {
            if (dto.getMaxParticipants() != null && dto.getMaxParticipants() != 1) {
                log.warn("Auto-correcting maxParticipants from {} to 1 for INDIVIDUAL session",
                        dto.getMaxParticipants());
                dto.setMaxParticipants(1);
            }
        }


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

        // --- Students ---
        List<Student> students = studentRepository.findAllById(dto.getStudentIds());

        if (students.size() != dto.getStudentIds().size()) {
            throw new SkillMentorException(
                    "One or more students not found",
                    HttpStatus.NOT_FOUND
            );
        }

        // SESSION TYPE VALIDATION (BEFORE creating entity)
        if (dto.getSessionType() == SessionType.INDIVIDUAL) {
            // For INDIVIDUAL sessions
            if (students.size() != 1) {
                throw new SkillMentorException(
                        "Individual session must have exactly one student",
                        HttpStatus.BAD_REQUEST
                );
            }

            if (dto.getMaxParticipants() != null && dto.getMaxParticipants() != 1) {
                throw new SkillMentorException(
                        "Individual session must have maxParticipants = 1",
                        HttpStatus.BAD_REQUEST
                );
            }
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

            if (students.size() > dto.getMaxParticipants()) {
                throw new SkillMentorException(
                        "Number of students (" + students.size() + ") exceeds maximum participants (" + dto.getMaxParticipants() + ")",
                        HttpStatus.BAD_REQUEST
                );
            }
        }

        // Create the session entity
        Session session = SessionMapper.toEntity(dto, mentor, subject, students);

        // Set maxParticipants based on session type
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

        // Mentor availability
        SessionAvailabilityUtil.validateMentorAvailability(
                sessionRepository.findByMentorId(mentor.getId()),
                start,
                end
        );

        // Student availability (ALL students)
        for (Student student : students) {
            SessionAvailabilityUtil.validateStudentAvailability(
                    sessionRepository.findByStudentId(student.getId()),
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


    @Override
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


    @Override
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
    public List<SessionDTO> getSessionsByStudent(Long studentId) {
        return sessionRepository.findByStudentId(studentId)
                .stream()
                .map(SessionMapper::toDTO)
                .toList();
    }

    @Override
    public List<SessionDTO> getSessionsByMentor(Long mentorId) {
        return sessionRepository.findByMentorId(mentorId)
                .stream()
                .map(SessionMapper::toDTO)
                .toList();
    }


    //  STUDENT SELF-BOOKING


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
                .students(List.of(student))
                .sessionType(sessionType)
                .sessionStatus(SessionStatus.PENDING)
                .maxParticipants(sessionType == SessionType.INDIVIDUAL ? 1 : 2)
                .sessionAt(dto.getSessionAt())
                .durationMinutes(dto.getDurationMinutes())
                .build();

        // TIME & AVAILABILITY
        SessionAvailabilityUtil.validateFutureSession(dto.getSessionAt());

        Instant start = dto.getSessionAt().toInstant();
        Instant end = SessionAvailabilityUtil.calculateEndTime(start, dto.getDurationMinutes());

        // Mentor availability
        SessionAvailabilityUtil.validateMentorAvailability(
                sessionRepository.findByMentorId(mentor.getId()), start, end
        );

        // Student availability
        SessionAvailabilityUtil.validateStudentAvailability(
                sessionRepository.findByStudentId(student.getId()), start, end
        );

        // SAVE
        Session saved = sessionRepository.save(session);
        log.debug("Session booked successfully with id {}", saved.getId());
        return SessionMapper.toDTO(saved);
    }
}
