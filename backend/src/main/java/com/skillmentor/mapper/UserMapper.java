package com.skillmentor.mapper;


import com.skillmentor.dto.user.UserDTO;
import com.skillmentor.entity.User;

public class UserMapper {

    public static UserDTO toDto(User savedUser) {
        return UserDTO.builder()
                .id(savedUser.getId())
                .clerkId(savedUser.getClerkId())
                .firstName(savedUser.getFirstName())
                .lastName(savedUser.getLastName())
                .fullName(savedUser.getFullName())
                .email(savedUser.getEmail())
                .roles(savedUser.getRoles())
                .profileImageUrl(savedUser.getProfileImageUrl())
                .onboardingCompleted(savedUser.getOnboardingCompleted())
                .lastLogin(savedUser.getLastLogin())
                .build();
    }
}
