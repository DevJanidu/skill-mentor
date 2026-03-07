package com.skillmentor.dto.session;

import lombok.*;

import java.util.Date;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SessionDTO {

    private Long id;

    private Long mentorId;
    private String mentorName;

    private Long subjectId;
    private String subjectName;

    /** Primary student (INDIVIDUAL sessions – first enrolled student) */
    private Long studentId;
    private String studentName;

    /** All enrolled student names (useful for GROUP sessions and mentor views) */
    @Builder.Default
    private List<String> studentNames = new java.util.ArrayList<>();

    private Date sessionAt;
    private Integer durationMinutes;
    private Integer maxParticipants;
    private Integer currentParticipants;

    private SessionType sessionType;
    private SessionStatus sessionStatus;
    private ReceiptStatus receiptStatus;

    private String meetingLink;
    private String meetingPassword;
    private String sessionNotes;
    private String studentReview;
    private Integer studentRating;
    private String receiptUrl;
    private String rejectionReason;

    /** Post-session resources (added by mentor after completing session) */
    private String recordingLink;
    private String resourceLink;
    private String assessmentLink;
}
