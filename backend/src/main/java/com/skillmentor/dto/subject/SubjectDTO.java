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

    private Long mentorId;
    private String mentorName;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
