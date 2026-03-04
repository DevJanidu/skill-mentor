package com.skillmentor.dto.student;


import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CreateStudentDTO {

    @NotBlank(message = "Student code is required")
    @Size(min = 3, max = 20, message = "Student code must be between 3 and 20 characters")
    private String studentCode;

    @Size(max = 2000, message = "Learning goals must not exceed 2000 characters")
    private String learningGoals;
}
