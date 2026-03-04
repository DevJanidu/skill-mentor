package com.skillmentor.dto.user;

import com.skillmentor.entity.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OnboardingResponse {
    private boolean success;
    private String message;
    private String userId;
    private String clerkId;
    private String email;
    private List<UserRole> roles;
}