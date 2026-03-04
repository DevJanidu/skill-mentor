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

    @Min(value = 15, message = "Duration must be at least 15 minutes")
    @Max(value = 300, message = "Duration cannot exceed 300 minutes")
    private Integer durationMinutes;

    private SessionType sessionType;
}
