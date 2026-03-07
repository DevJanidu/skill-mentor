package com.skillmentor.dto.session;

import jakarta.validation.constraints.*;
import lombok.*;

import java.util.Date;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BookSessionDTO {

    @NotNull(message = "Mentor ID is required")
    private Long mentorId;

    @NotNull(message = "Subject ID is required")
    private Long subjectId;

    @NotNull(message = "Session date and time is required")
    @Future(message = "Session must be scheduled in the future")
    private Date sessionAt;

    @NotNull(message = "Duration is required")
    @Min(value = 15, message = "Duration must be at least 15 minutes")
    @Max(value = 300, message = "Duration cannot exceed 300 minutes")
    private Integer durationMinutes;

    @NotNull(message = "Session type is required (INDIVIDUAL or GROUP)")
    private SessionType sessionType;

    /** For GROUP sessions: max number of participants (2–50). Ignored for INDIVIDUAL. */
    @Min(value = 2, message = "Group sessions must allow at least 2 participants")
    @Max(value = 50, message = "Group sessions cannot exceed 50 participants")
    private Integer maxParticipants;
}
