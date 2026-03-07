package com.skillmentor.dto.session;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ApproveSessionDTO {

    @NotBlank(message = "Meeting link is required")
    @Size(max = 500, message = "Meeting link must be at most 500 characters")
    private String meetingLink;

    @Size(max = 100, message = "Meeting password must be at most 100 characters")
    private String meetingPassword;
}
