package com.skillmentor.mapper;

import com.skillmentor.dto.mentor.CreateMentorDTO;
import com.skillmentor.dto.mentor.MentorDTO;
import com.skillmentor.dto.mentor.UpdateMentorDTO;
import com.skillmentor.entity.Mentor;
import com.skillmentor.entity.User;


public class MentorMapper {
    public static Mentor toEntity(CreateMentorDTO dto, User user) {
        return Mentor.builder()
                .user(user)
                .phoneNumber(dto.getPhoneNumber())
                .title(dto.getTitle())
                .profession(dto.getProfession())
                .company(dto.getCompany())
                .experienceYears(dto.getExperienceYears())
                .bio(dto.getBio())
                .build();
    }

    public static MentorDTO toDto(Mentor savedMentor) {
        return MentorDTO.builder()
                .id(savedMentor.getId())
                .userId(savedMentor.getUser().getId())
                .clerkId(savedMentor.getUser().getClerkId())
                .fullName(savedMentor.getUser().getFullName())
                .firstName(savedMentor.getUser().getFirstName())
                .lastName(savedMentor.getUser().getLastName())
                .email(savedMentor.getUser().getEmail())
                //menter specific data
                .phoneNumber(savedMentor.getPhoneNumber())
                .title(savedMentor.getTitle())
                .profession(savedMentor.getProfession())
                .company(savedMentor.getCompany())
                .experienceYears(savedMentor.getExperienceYears())
                .bio(savedMentor.getBio())
                .profileImageUrl(savedMentor.getUser().getProfileImageUrl())
                .averageRating(savedMentor.getAverageRating())
                .totalReviews(savedMentor.getTotalReviews())
                .createdAt(savedMentor.getCreatedAt())
                .updatedAt(savedMentor.getUpdatedAt())
                .build();
    }

    public static Mentor updateMentor(Mentor mentor, UpdateMentorDTO dto) {
        if (dto.getPhoneNumber() != null) {
            mentor.setPhoneNumber(dto.getPhoneNumber());
        }
        if (dto.getTitle() != null) {
            mentor.setTitle(dto.getTitle());
        }
        if (dto.getProfession() != null) {
            mentor.setProfession(dto.getProfession());
        }
        if (dto.getCompany() != null) {
            mentor.setCompany(dto.getCompany());
        }
        if (dto.getExperienceYears() >= 0) {
            mentor.setExperienceYears(dto.getExperienceYears());
        }
        if (dto.getBio() != null) {
            mentor.setBio(dto.getBio());
        }
        return mentor;
    }
}
