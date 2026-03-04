package com.skillmentor.service;

import com.skillmentor.dto.user.CreateUserDTO;
import com.skillmentor.dto.user.UserDTO;
import com.skillmentor.entity.User;
import com.skillmentor.entity.UserRole;

import java.util.List;

public interface UserService {

    /**
     * Sync user from Clerk JWT (auto-create if not exists, update if exists)
     * This is the ONLY way users are created
     */
    UserDTO syncUserFromToken(String clerkId, String email, String firstName,String fullName,
                              String lastName, String imageUrl, List<UserRole> roles);

    /**
     * Get user by Clerk ID
     */
    UserDTO getUserByClerkId(String clerkId);

    /**
     * Get user entity by Clerk ID (for internal use by other services like MentorService)
     */
    User getUserEntityByClerkId(String clerkId);

    /**
     * Get all users (Admin only - for user management)
     */
    List<UserDTO> getAllUsers();

    /**
     * Update user's last login time
     */
    void updateLastLogin(String clerkId);

    /**
     * Mark onboarding as completed
     */
    void markOnboardingComplete(String clerkId);

    /**
     * Check if user exists by Clerk ID
     */
    boolean existsByClerkId(String clerkId);

    /**
     *   get user by mentor id t6o delete mentor and user
     *   at the same time without any error
     *
     */
    User getUserByMentorId(Long mentorId);

    /**
     *   get user by mentor id t6o delete mentor and user
     *   at the same time without any error
     *
     */
    User getUserByStudentId(Long studentId);




    /**
     * Update user roles in the database
     */
    void updateRoles(String clerkId, List<UserRole> roles);

    /**
     * Delete user (Admin only - soft delete recommended)
     */
    void deleteUser(String clerkId);
}
