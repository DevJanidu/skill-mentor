package com.skillmentor.dto.subject;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateSubjectDTO {
    @NotBlank(message = "Subject name is required")
    @Size(min = 3, max = 100)
    private String name;

    @Size(max = 1000)
    private String description;
}
