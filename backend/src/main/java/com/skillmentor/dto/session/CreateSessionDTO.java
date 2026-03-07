package com.skillmentor.dto.session;

import jakarta.validation.constraints.*;
import lombok.*;

import java.util.Date;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CreateSessionDTO {
    /**
     * Optional – when null/empty the session is created as an open slot
     * that students can book later via POST /api/sessions/book.
     */
    private List<Long> studentIds;

    @NotNull(message = "Mentor ID is required")
    private Long mentorId;

    @NotNull(message = "Subject ID is required")
    private Long subjectId;

    @NotNull(message = "Session type is required")
    private SessionType sessionType;

    @Min(1)
    @Max(50)
    private Integer maxParticipants;

    @NotNull(message = "Session date and time is required")
    @Future(message = "Session must be scheduled in the future")
    private Date sessionAt;

    @NotNull(message = "Duration is required")
    @Min(15)
    @Max(300)
    private Integer durationMinutes;
}
