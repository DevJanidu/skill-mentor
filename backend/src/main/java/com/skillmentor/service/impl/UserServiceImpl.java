package com.skillmentor.service.impl;

import com.skillmentor.dto.user.UserDTO;
import com.skillmentor.entity.User;
import com.skillmentor.entity.UserRole;
import com.skillmentor.exception.SkillMentorException;
import com.skillmentor.mapper.UserMapper;
import com.skillmentor.repository.UserRepository;
import com.skillmentor.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;  // ← Add this
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

import static com.skillmentor.mapper.UserMapper.toDto;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public UserDTO syncUserFromToken(
            String clerkId,
            String email,
            String firstName,
            String fullName,
            String lastName,
            String imageUrl,
            List<UserRole> roles) {

        log.info("Syncing user from token - ClerkId: {}, Email: {}", clerkId, email);

        // CRITICAL FIX: Convert to mutable ArrayList
        List<UserRole> mutableRoles = new ArrayList<>(roles);

        User user = userRepository.findByClerkId(clerkId)
                .map(existingUser -> {
                    log.info("User exists, updating: {}", existingUser.getEmail());
                    existingUser.setEmail(email);
                    existingUser.setFirstName(firstName);
                    existingUser.setLastName(lastName);
                    existingUser.setFullName(fullName);

                    // Only update profileImageUrl from Clerk if the user hasn't set
                    // a custom image via in-app upload (Cloudinary URL)
                    boolean hasCustomUpload = existingUser.getProfileImageUrl() != null
                            && existingUser.getProfileImageUrl().contains("res.cloudinary.com");
                    if (!hasCustomUpload) {
                        existingUser.setProfileImageUrl(imageUrl);
                    }

                    // CRITICAL FIX: Clear and add all (instead of setRoles)
                    if (existingUser.getRoles() == null) {
                        existingUser.setRoles(new ArrayList<>());
                    }
                    existingUser.getRoles().clear();
                    existingUser.getRoles().addAll(mutableRoles);

                    existingUser.setLastLogin(LocalDateTime.now());
                    return existingUser;
                })
                .orElseGet(() -> {
                    log.info("New user detected, creating: {}", email);
                    return User.builder()
                            .clerkId(clerkId)
                            .email(email)
                            .firstName(firstName)
                            .lastName(lastName)
                            .fullName(fullName != null ? fullName : (firstName + " " + lastName))
                            .profileImageUrl(imageUrl)
                            .roles(mutableRoles)  //  Use mutable list
                            .onboardingCompleted(false)
                            .lastLogin(LocalDateTime.now())
                            .build();
                });

        User savedUser = userRepository.save(user);
        log.info(" User synced successfully: {}", savedUser.getEmail());

        return toDto(savedUser);
    }

    // ... rest of your methods remain the same

    @Override
    @Transactional(readOnly = true)
    public UserDTO getUserByClerkId(String clerkId) {
        log.info("Fetching user with Clerk ID: {}", clerkId);

        User user = userRepository.findByClerkId(clerkId).orElseThrow(() -> {
            log.error("User not found with Clerk ID: {}", clerkId);
            return new SkillMentorException("User not found with Clerk ID: " + clerkId, HttpStatus.NOT_FOUND);
        });

        return toDto(user);
    }

    @Override
    @Transactional(readOnly = true)
    public User getUserEntityByClerkId(String clerkId) {
        log.debug("Fetching user entity with Clerk ID: {}", clerkId);

        return userRepository.findByClerkId(clerkId).orElseThrow(() ->
                new SkillMentorException("User not found with Clerk ID: " + clerkId, HttpStatus.NOT_FOUND));
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDTO> getAllUsers() {
        log.info("Fetching all users");

        List<User> users = userRepository.findAll();
        log.info("Found {} users", users.size());

        return users.stream().map(UserMapper::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updateLastLogin(String clerkId) {
        log.debug("Updating last login for user: {}", clerkId);

        userRepository.findByClerkId(clerkId).ifPresent(user -> {
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);
        });
    }

    @Override
    @Transactional
    public void markOnboardingComplete(String clerkId) {
        log.info("Marking onboarding complete for user: {}", clerkId);

        User user = getUserEntityByClerkId(clerkId);
        user.setOnboardingCompleted(true);
        userRepository.save(user);

        log.info("✅ Onboarding marked complete for user: {}", clerkId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByClerkId(String clerkId) {
        return userRepository.existsByClerkId(clerkId);
    }

    @Override
    public User getUserByMentorId(Long mentorId) {
        return userRepository.findUserByMentorId(mentorId)
                .orElseThrow(() ->
                        new SkillMentorException("user not found with mentor id: "
                                + mentorId, HttpStatus.NOT_FOUND));
    }

    @Override
    public User getUserByStudentId(Long studentId) {
        return userRepository.findUserByStudentId(studentId)
                .orElseThrow(() ->
                        new SkillMentorException("user not found with student id: " + studentId,
                                HttpStatus.NOT_FOUND));
    }

    @Override
    @Transactional
    public void updateRoles(String clerkId, List<UserRole> roles) {
        log.info("Updating roles for user {} to {}", clerkId, roles);
        User user = getUserEntityByClerkId(clerkId);
        if (user.getRoles() == null) {
            user.setRoles(new ArrayList<>());
        }
        user.getRoles().clear();
        user.getRoles().addAll(roles);
        userRepository.save(user);
        log.info("Roles updated for user: {}", clerkId);
    }

    @Override
    @Transactional
    public void deleteUser(String clerkId) {
        log.warn("Deleting user with Clerk ID: {}", clerkId);

        User user = getUserEntityByClerkId(clerkId);
        userRepository.delete(user);

        log.info("✅ User deleted: {}", user.getEmail());
    }
}