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

    private Date sessionAt;
    private Integer durationMinutes;
    private Integer maxParticipants;

    private SessionType sessionType;
    private SessionStatus sessionStatus;

    private String meetingLink;
    private String sessionNotes;
    private String studentReview;
    private Integer studentRating;
    private String receiptUrl;
}
