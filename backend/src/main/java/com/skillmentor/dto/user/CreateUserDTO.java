package com.skillmentor.dto.user;

import com.skillmentor.entity.UserRole;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


import java.util.List;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserDTO {

    @NotBlank(message = "Clerk ID is required")
    @Size(min = 5, max = 100, message = "Clerk ID must be between 5 and 100 characters")
    private String clerkId;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 150, message = "Email must not exceed 150 characters")
    private String email;

    @NotBlank(message = "First name is required")
    @Size(min = 1, max = 50, message = "First name must be between 1 and 50 characters")
    @Pattern(regexp = "^[a-zA-Z\\s'-]+$", message = "First name can only contain letters, spaces, hyphens, and apostrophes")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(min = 1, max = 50, message = "Last name must be between 1 and 50 characters")
    @Pattern(regexp = "^[a-zA-Z\\s'-]+$", message = "Last name can only contain letters, spaces, hyphens, and apostrophes")
    private String lastName;

    @Size(max = 100, message = "Full name must not exceed 100 characters")
    private String fullName;

    @NotEmpty(message = "At least one role is required")
    @Size(min = 1, max = 5, message = "User can have between 1 and 5 roles")
    private List<@NotNull(message = "Role cannot be null") UserRole> roles;

    @Pattern(regexp = "^(https?://.*|)$", message = "Profile image URL must be a valid URL or empty")
    @Size(max = 500, message = "Profile image URL must not exceed 500 characters")
    private String profileImageUrl;
}
