package com.skillmentor.controller;



import com.skillmentor.dto.user.UserDTO;
import com.skillmentor.entity.UserRole;
import com.skillmentor.security.UserPrincipal;
import com.skillmentor.service.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "User Controller")
public class UserController extends AbstractController {

    private final UserService userService;

    /**
     * Sync current user to database from JWT token
     * This is called automatically after login or when needed
     * POST /api/users/sync
     */

    @PostMapping("/sync")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDTO> syncCurrentUser(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            org.springframework.security.core.Authentication authentication) {

        log.info("Syncing user: {}", userPrincipal.getEmail());

        //  FIX: Convert to ArrayList (mutable)
        List<UserRole> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(role -> role.replace("ROLE_", ""))
                .map(UserRole::valueOf)
                .collect(Collectors.toCollection(ArrayList::new));

        UserDTO userDTO = userService.syncUserFromToken(
                userPrincipal.getId(),
                userPrincipal.getEmail(),
                userPrincipal.getFirstName(),
                userPrincipal.getFullName(),
                userPrincipal.getLastName(),
                userPrincipal.getImgUrl(),
                roles
        );

        return sendOkResponse(userDTO);
    }
    /**
     * Get current authenticated user
     * GET /api/users/me
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDTO> getCurrentUser(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("Fetching current user: {}", userPrincipal.getId());

        UserDTO userDTO = userService.getUserByClerkId(userPrincipal.getId());

        return sendOkResponse(userDTO);
    }

    /**
     * Get all users (Admin only)
     * GET /api/users
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        log.info("Admin fetching all users");

        List<UserDTO> users = userService.getAllUsers();

        return sendOkResponse(users);
    }

    /**
     * Get user by Clerk ID (Admin only)
     * GET /api/users/{clerkId}
     */
    @GetMapping("/{clerkId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDTO> getUserByClerkId(@PathVariable String clerkId) {
        log.info("Admin fetching user by Clerk ID: {}", clerkId);

        UserDTO userDTO = userService.getUserByClerkId(clerkId);

        return sendOkResponse(userDTO);
    }

    /**
     * Delete user (Admin only)
     * DELETE /api/users/{clerkId}
     */
    @DeleteMapping("/{clerkId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteUser(@PathVariable String clerkId) {
        log.warn("Admin deleting user with Clerk ID: {}", clerkId);

        userService.deleteUser(clerkId);

        return sendOkResponse(String.format("User deleted with Clerk ID: %s", clerkId));
    }
}