package com.skillmentor.controller;

import com.skillmentor.dto.user.OnboardingRequest;
import com.skillmentor.dto.user.OnboardingResponse;
import com.skillmentor.dto.user.UserDTO;
import com.skillmentor.entity.User;
import com.skillmentor.entity.UserRole;
import com.skillmentor.exception.SkillMentorException;
import com.skillmentor.security.ClerkService;
import com.skillmentor.security.UserPrincipal;

import com.skillmentor.service.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller for user onboarding and role management
 */
@Slf4j
@RestController
@RequestMapping("/api/onboarding")
@RequiredArgsConstructor
@Tag(name = "On Boarding Controller")
public class OnboardingController extends AbstractController {

    private final UserService userService;
    private final ClerkService clerkService;


    /**
     * Complete user onboarding by selecting a role
     * POST /api/onboarding/complete
     */

    @PostMapping("/complete")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OnboardingResponse> completeOnboarding(
            @Valid @RequestBody OnboardingRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("User {} completing onboarding with role: {}",
                userPrincipal.getEmail(), request.getRole());

        String clerkId = userPrincipal.getId();

        if (clerkId == null) {
            log.error("UserPrincipal is null or has no ID");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(OnboardingResponse.builder()
                            .success(false)
                            .message("User not authenticated")
                            .build());
        }

        try {
            // ── Step 1: Ensure user exists in DB (auto-sync from JWT claims) ──
            // New Clerk users won't have a DB row yet, so we create it here
            // with a default USER role first, then update the role below.
            List<UserRole> defaultRoles = new ArrayList<>();
            defaultRoles.add(UserRole.USER);

            userService.syncUserFromToken(
                    clerkId,
                    userPrincipal.getEmail(),
                    userPrincipal.getFirstName(),
                    userPrincipal.getFullName(),
                    userPrincipal.getLastName(),
                    userPrincipal.getImgUrl(),
                    defaultRoles
            );

            // ── Step 2: Check if already onboarded ──
            User user = userService.getUserEntityByClerkId(clerkId);
            if (Boolean.TRUE.equals(user.getOnboardingCompleted())) {
                throw new SkillMentorException("User already onboarded",
                        HttpStatus.BAD_REQUEST);
            }

            // ── Step 3: Build the selected roles list ──
            List<UserRole> roles = new ArrayList<>();
            roles.add(request.getRole());

            // ── Step 4: Update roles in Clerk publicMetadata ──
            boolean clerkUpdated = clerkService.updateUserRoles(clerkId, roles);

            if (!clerkUpdated) {
                log.error("Failed to update roles in Clerk for user: {}", clerkId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(OnboardingResponse.builder()
                                .success(false)
                                .message("Failed to update user roles in Clerk")
                                .build());
            }

            // ── Step 5: Update DB user with selected role ──
            UserDTO userDTO = userService.syncUserFromToken(
                    clerkId,
                    userPrincipal.getEmail(),
                    userPrincipal.getFirstName(),
                    userPrincipal.getFullName(),
                    userPrincipal.getLastName(),
                    userPrincipal.getImgUrl(),
                    roles
            );

            // ── Step 6: Mark onboarding complete ──
            userService.markOnboardingComplete(clerkId);

            OnboardingResponse response = OnboardingResponse.builder()
                    .success(true)
                    .message("Onboarding completed successfully")
                    .userId(userDTO.getId().toString())
                    .clerkId(userDTO.getClerkId())
                    .email(userDTO.getEmail())
                    .roles(roles)
                    .build();

            log.info("Onboarding completed for user: {}", userPrincipal.getEmail());

            return sendOkResponse(response);

        } catch (Exception e) {
            log.error("Error completing onboarding", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(OnboardingResponse.builder()
                            .success(false)
                            .message("Failed to complete onboarding: " +
                                    (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()))
                            .build());
        }
    }

    /**
     * Check if user has completed onboarding
     * GET /api/onboarding/status
     */
    @GetMapping("/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getOnboardingStatus(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("Checking onboarding status for user: {}", userPrincipal.getId());

        try {
            boolean dbExists = userService.existsByClerkId(userPrincipal.getId());

            // If user doesn't exist in DB yet, they haven't completed onboarding
            boolean dbCompleted = dbExists
                    && Boolean.TRUE.equals(
                            userService.getUserByClerkId(userPrincipal.getId()).getOnboardingCompleted());

            // Get roles from Clerk
            List<UserRole> roles = clerkService.getUserRoles(userPrincipal.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("completed", dbCompleted);
            response.put("clerkId", userPrincipal.getId());
            response.put("email", userPrincipal.getEmail());
            response.put("roles", roles);

            return sendOkResponse(response);

        } catch (Exception e) {
            log.error("Error checking onboarding status: {}", e.getMessage(), e);

            Map<String, Object> response = new HashMap<>();
            response.put("completed", false);
            response.put("error", e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Update user roles (Admin only)
     * PUT /api/onboarding/roles
     */
    @PutMapping("/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OnboardingResponse> updateUserRoles(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserPrincipal admin) {

        String targetClerkId = (String) request.get("clerkId");
        @SuppressWarnings("unchecked")
        List<String> roleStrings = (List<String>) request.get("roles");

        log.info("Admin {} updating roles for user: {}", admin.getEmail(), targetClerkId);

        try {
            List<UserRole> roles = roleStrings.stream()
                    .map(UserRole::valueOf)
                    .toList();

            // Update in Clerk
            boolean updated = clerkService.updateUserRoles(targetClerkId, roles);

            if (!updated) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(OnboardingResponse.builder()
                                .success(false)
                                .message("Failed to update user roles")
                                .build());
            }

            // Update in database if user exists
            if (userService.existsByClerkId(targetClerkId)) {
                userService.updateRoles(targetClerkId, roles);
            }

            return sendOkResponse(OnboardingResponse.builder()
                    .success(true)
                    .message("User roles updated successfully")
                    .clerkId(targetClerkId)
                    .roles(roles)
                    .build());

        } catch (Exception e) {
            log.error("Error updating user roles: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(OnboardingResponse.builder()
                            .success(false)
                            .message("Failed to update roles: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Get current user's roles
     * GET /api/onboarding/my-roles
     */
    @GetMapping("/my-roles")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getMyRoles(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("Fetching roles for user: {}", userPrincipal.getId());

        List<UserRole> roles = clerkService.getUserRoles(userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("clerkId", userPrincipal.getId());
        response.put("email", userPrincipal.getEmail());
        response.put("roles", roles);

        return sendOkResponse(response);
    }
}