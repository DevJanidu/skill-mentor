package com.skillmentor.dto.mentor;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateMentorDTO {

    @NotBlank(message = "Phone number is required")
    @Pattern(
            regexp = "^(\\+[1-9]\\d{7,14}|0[7][0-9]{8})$",
            message = "Phone number must be a valid mobile number (e.g. 0712345678 or +447911123456)"
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

    @NotNull(message = "Hourly rate is required")
    @DecimalMin(value = "0.01", message = "Hourly rate must be greater than 0")
    private BigDecimal hourlyRate;

    @NotBlank(message = "Bank account name is required")
    @Size(max = 100, message = "Bank account name cannot exceed 100 characters")
    private String bankAccountName;

    @NotBlank(message = "Bank account number is required")
    @Size(max = 30, message = "Bank account number cannot exceed 30 characters")
    private String bankAccountNumber;

    @NotBlank(message = "Bank name is required")
    @Size(max = 100, message = "Bank name cannot exceed 100 characters")
    private String bankName;

    @Pattern(regexp = "^(https?://.{3,})?$", message = "LinkedIn URL must start with http:// or https://")
    @Size(max = 255, message = "LinkedIn URL too long")
    private String linkedinUrl;

    @Pattern(regexp = "^(https?://.{3,})?$", message = "GitHub URL must start with http:// or https://")
    @Size(max = 255, message = "GitHub URL too long")
    private String githubUrl;
}
