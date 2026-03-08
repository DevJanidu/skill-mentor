package com.skillmentor.dto.subject;


import lombok.*;


import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubjectDTO {

    private Long id;
    private String subjectName;

    private String description;
    private String thumbnailUrl;
    private String category;

    private Long mentorId;
    private String mentorName;

    private double averageRating;
    private int totalReviews;
    private int enrollmentCount;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
