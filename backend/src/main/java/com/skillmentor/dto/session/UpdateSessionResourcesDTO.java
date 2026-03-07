package com.skillmentor.dto.session;

import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * Mentor-submitted session info update.
 * Covers both pre-session fields (meetingLink, meetingPassword) and
 * post-session resource fields (recordingLink, resourceLink, etc.).
 * All fields are optional — only non-null values update the session.
 */
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UpdateSessionResourcesDTO {

    @Size(max = 500, message = "Meeting link must be at most 500 characters")
    private String meetingLink;

    @Size(max = 100, message = "Meeting password must be at most 100 characters")
    private String meetingPassword;

    @Size(max = 500, message = "Recording link must be at most 500 characters")
    private String recordingLink;

    @Size(max = 500, message = "Resource link must be at most 500 characters")
    private String resourceLink;

    @Size(max = 500, message = "Assessment link must be at most 500 characters")
    private String assessmentLink;

    @Size(max = 2000, message = "Session notes must be at most 2000 characters")
    private String sessionNotes;
}
