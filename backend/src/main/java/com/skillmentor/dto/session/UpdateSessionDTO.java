package com.skillmentor.dto.session;

import jakarta.validation.constraints.*;
import lombok.*;

import java.util.Date;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UpdateSessionDTO {

    @Future
    private Date sessionAt;

    @Min(15)
    @Max(300)
    private Integer durationMinutes;

    @NotNull
    private SessionStatus sessionStatus;

    @NotNull(message = "Session type is required")
    private SessionType sessionType;

    @Min(1)
    @Max(50)
    private Integer maxParticipants;

    @Size(max = 500)
    private String meetingLink;

    @Size(max = 2000)
    private String sessionNotes;

    @Size(max = 2000)
    private String studentReview;

    @Min(1)
    @Max(5)
    private Integer studentRating;

    @Size(max = 500)
    private String receiptUrl;
}
