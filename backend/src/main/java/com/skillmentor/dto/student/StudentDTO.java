package com.skillmentor.dto.student;


import com.skillmentor.dto.session.SessionDTO;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class StudentDTO {

    private Long id;

    private Long userId;
    private String clerkId;
    private String email;
    private String firstName;
    private String lastName;

    private String studentCode;
    private String learningGoals;
    private String profileImageUrl;
    private String coverImageUrl;

}
