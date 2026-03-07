package com.skillmentor.dto.session;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RejectSessionDTO {

    @NotBlank(message = "Rejection reason is required")
    @Size(max = 2000, message = "Rejection reason must be at most 2000 characters")
    private String reason;
}
