package com.skillmentor.dto.mentor;


import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateMentorDTO {

    @NotBlank(message = "Phone number is required")
    @Pattern(
            regexp = "^(\\+94|0)[7][0-9]{8}$",
            message = "Phone number must be a valid Sri Lankan mobile number"
    )
    private String phoneNumber;

    @NotBlank(message = "Title is required")
    @Size(min = 2, max = 20, message = "Title must be between 2 and 20 characters")
    private String title;

    @NotBlank(message = "Profession is required")
    @Size(min = 2, max = 50, message = "Profession must be between 2 and 50 characters")
    private String profession;

    @NotBlank(message = "Company is required")
    @Size(min = 2, max = 60, message = "Company must be between 2 and 60 characters")
    private String company;

    @Min(value = 0, message = "Experience years cannot be negative")
    @Max(value = 50, message = "Experience years cannot exceed 50")
    private int experienceYears;

    @Size(max = 500, message = "Bio cannot exceed 500 characters")
    private String bio;

}
