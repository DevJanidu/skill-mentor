package com.skillmentor.utils;

import com.skillmentor.entity.Session;
import com.skillmentor.exception.SkillMentorException;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;

public final class SessionAvailabilityUtil {

    private SessionAvailabilityUtil() {
        // Prevent instantiation
    }

    /* =========================
       CORE TIME VALIDATION
       ========================= */

    public static void validateFutureSession(Date sessionAt) {
        if (sessionAt.before(new Date())) {
            throw new SkillMentorException(
                    "Session cannot be scheduled in the past",
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    public static Instant calculateEndTime(Instant start, Integer durationMinutes) {
        return start.plus(durationMinutes, ChronoUnit.MINUTES);
    }

    /* =========================
       OVERLAP CHECK
       ========================= */

    public static boolean isOverlapping(
            Instant newStart,
            Instant newEnd,
            Instant existingStart,
            Instant existingEnd
    ) {
        return newStart.isBefore(existingEnd) && newEnd.isAfter(existingStart);
    }

    /* =========================
       MENTOR AVAILABILITY
       ========================= */

    public static void validateMentorAvailability(
            List<Session> mentorSessions,
            Instant newStart,
            Instant newEnd
    ) {
        for (Session session : mentorSessions) {
            if (session.getSessionAt() == null || session.getDurationMinutes() == null) continue;

            Instant existingStart = session.getSessionAt().toInstant();
            Instant existingEnd = calculateEndTime(
                    existingStart,
                    session.getDurationMinutes()
            );

            if (isOverlapping(newStart, newEnd, existingStart, existingEnd)) {
                throw new SkillMentorException(
                        "Mentor is already booked during this time",
                        HttpStatus.CONFLICT
                );
            }
        }
    }

    /* =========================
       STUDENT AVAILABILITY
       ========================= */

    public static void validateStudentAvailability(
            List<Session> studentSessions,
            Instant newStart,
            Instant newEnd
    ) {
        for (Session session : studentSessions) {
            if (session.getSessionAt() == null || session.getDurationMinutes() == null) continue;

            Instant existingStart = session.getSessionAt().toInstant();
            Instant existingEnd = calculateEndTime(
                    existingStart,
                    session.getDurationMinutes()
            );

            if (isOverlapping(newStart, newEnd, existingStart, existingEnd)) {
                throw new SkillMentorException(
                        "Student already has a session during this time",
                        HttpStatus.CONFLICT
                );
            }
        }
    }
}
