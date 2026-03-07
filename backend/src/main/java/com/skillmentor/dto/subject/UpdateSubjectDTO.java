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

    @Size(max = 500, message = "Thumbnail URL cannot exceed 500 characters")
    private String thumbnailUrl;

    @Size(max = 100, message = "Category cannot exceed 100 characters")
    private String category;
}
