package com.skillmentor.dto.user;

import com.skillmentor.entity.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder

public class UserDTO {
    private Long id;
    private String clerkId;
    private String email;
    private String firstName;
    private String lastName;
    private String fullName;
    private List<UserRole> roles;
    private String profileImageUrl;
    private Boolean onboardingCompleted = false;
    private LocalDateTime lastLogin;
}
