package com.skillmentor.mapper;

import com.skillmentor.dto.session.*;
import com.skillmentor.entity.*;

import java.util.List;

public class SessionMapper {

    public static SessionDTO toDTO(Session session) {

        // Mentor -> User is EAGER (@OneToOne fetch = EAGER on Mentor.user)
        // Do NOT traverse User -> Mentor -> User (lazy and redundant)
        User mentorUser = session.getMentor().getUser();

        return SessionDTO.builder()
                .id(session.getId())
                .mentorId(session.getMentor().getId())
                .mentorName(mentorUser.getFullName())
                .subjectId(session.getSubject().getId())
                .subjectName(session.getSubject().getName())
                .sessionType(session.getSessionType())
                .sessionStatus(session.getSessionStatus() != null ? session.getSessionStatus() : SessionStatus.PENDING)
                .maxParticipants(session.getMaxParticipants())
                .sessionAt(session.getSessionAt())
                .durationMinutes(session.getDurationMinutes())
                .meetingLink(session.getMeetingLink())
                .sessionNotes(session.getSessionNotes())
                .studentReview(session.getStudentReview())
                .studentRating(session.getStudentRating())
                .receiptUrl(session.getReceiptUrl())
                .build();
    }

    public static Session toEntity(
            CreateSessionDTO dto,
            Mentor mentor,
            Subject subject,
            List<Student> students
    ) {
        return Session.builder()
                .mentor(mentor)
                .subject(subject)
                .students(students)
                .sessionType(dto.getSessionType())
                .sessionStatus(SessionStatus.PENDING)
                .sessionAt(dto.getSessionAt())
                .durationMinutes(dto.getDurationMinutes())
                .build();
    }

    public static Session updateSession(Session session, UpdateSessionDTO dto) {
        if (dto.getSessionAt() != null) {
            session.setSessionAt(dto.getSessionAt());
        }

        if (dto.getDurationMinutes() != null) {
            session.setDurationMinutes(dto.getDurationMinutes());
        }

        if (dto.getSessionStatus() != null) {
            session.setSessionStatus(dto.getSessionStatus());
        }

        if (dto.getMaxParticipants() != null) {
            session.setMaxParticipants(dto.getMaxParticipants());
        }

        if (dto.getMeetingLink() != null) {
            session.setMeetingLink(dto.getMeetingLink());
        }

        if (dto.getSessionNotes() != null) {
            session.setSessionNotes(dto.getSessionNotes());
        }

        if (dto.getStudentReview() != null) {
            session.setStudentReview(dto.getStudentReview());
        }

        if (dto.getStudentRating() != null) {
            session.setStudentRating(dto.getStudentRating());
        }

        if (dto.getReceiptUrl() != null) {
            session.setReceiptUrl(dto.getReceiptUrl());
        }

        return session;
    }
}
