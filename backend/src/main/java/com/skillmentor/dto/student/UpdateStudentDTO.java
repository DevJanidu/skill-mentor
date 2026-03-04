package com.skillmentor.dto.student;


import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UpdateStudentDTO {

    @Size(max = 2000, message = "Learning goals must not exceed 2000 characters")
    private String learningGoals;
}
