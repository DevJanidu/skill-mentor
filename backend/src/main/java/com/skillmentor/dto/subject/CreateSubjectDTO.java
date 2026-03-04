package com.skillmentor.dto.subject;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateSubjectDTO {
    @NotBlank(message = "Subject name is required")
    @Size(min = 3, max = 100, message = "Subject name must be between 3 and 100 characters")
    private String name;

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;

    @NotNull(message = "Mentor ID is required")
    private Long mentorId;
}
