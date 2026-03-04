package com.skillmentor.dto.user;

import com.skillmentor.entity.UserRole;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OnboardingRequest {

    @NotNull(message = "Role is required")
    private UserRole role;

}