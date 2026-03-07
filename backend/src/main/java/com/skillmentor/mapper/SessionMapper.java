package com.skillmentor.mapper;

import com.skillmentor.dto.session.*;
import com.skillmentor.entity.*;

import java.util.ArrayList;
import java.util.List;

public class SessionMapper {

    public static SessionDTO toDTO(Session session) {

        // Mentor -> User is EAGER (@OneToOne fetch = EAGER on Mentor.user)
        User mentorUser = session.getMentor().getUser();

        // Resolve student info from enrolled students list
        List<Student> students = session.getStudents();
        Long studentId = null;
        String studentName = null;
        List<String> studentNames = new ArrayList<>();

        if (students != null && !students.isEmpty()) {
            // Collect all student names (within @Transactional scope â€“ lazy loads work here)
            for (Student s : students) {
                User su = s.getUser();
                if (su != null) {
                    studentNames.add(su.getFullName() != null ? su.getFullName() : su.getEmail());
                }
            }
            // Primary student (first in list â€“ meaningful for INDIVIDUAL sessions)
            Student primary = students.get(0);
            studentId = primary.getId();
            if (primary.getUser() != null) {
                studentName = primary.getUser().getFullName() != null
                        ? primary.getUser().getFullName()
                        : primary.getUser().getEmail();
            }
        }

        return SessionDTO.builder()
                .id(session.getId())
                .mentorId(session.getMentor().getId())
                .mentorName(mentorUser.getFullName())
                .subjectId(session.getSubject().getId())
                .subjectName(session.getSubject().getName())
                .studentId(studentId)
                .studentName(studentName)
                .studentNames(studentNames)
                .sessionType(session.getSessionType())
                .sessionStatus(session.getSessionStatus() != null ? session.getSessionStatus() : SessionStatus.PENDING)
                .receiptStatus(session.getReceiptStatus() != null ? session.getReceiptStatus() : com.skillmentor.dto.session.ReceiptStatus.NONE)
                .maxParticipants(session.getMaxParticipants())
                .currentParticipants(students != null ? students.size() : 0)
                .sessionAt(session.getSessionAt())
                .durationMinutes(session.getDurationMinutes())
                .meetingLink(session.getMeetingLink())
                .meetingPassword(session.getMeetingPassword())
                .sessionNotes(session.getSessionNotes())
                .studentReview(session.getStudentReview())
                .studentRating(session.getStudentRating())
                .receiptUrl(session.getReceiptUrl())
                .rejectionReason(session.getRejectionReason())
                .recordingLink(session.getRecordingLink())
                .resourceLink(session.getResourceLink())
                .assessmentLink(session.getAssessmentLink())
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
