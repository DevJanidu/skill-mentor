package com.skillmentor.dto.mentor;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentorDTO {
    private Long id;
    private Long userId;
    private String clerkId;
    private String firstName;
    private String lastName;
    private String email;
    private String fullName;

    private String phoneNumber;
    private String title;
    private String profession;
    private String company;
    private int experienceYears;
    private String bio;
    private String profileImageUrl;
    private String coverImageUrl;
    private BigDecimal hourlyRate;
    private String bankAccountName;
    private String bankAccountNumber;
    private String bankName;
    private Double averageRating;
    private Integer totalReviews;
    private String linkedinUrl;
    private String githubUrl;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
