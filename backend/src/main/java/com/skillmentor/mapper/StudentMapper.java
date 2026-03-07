package com.skillmentor.mapper;

import com.skillmentor.dto.student.CreateStudentDTO;
import com.skillmentor.dto.student.StudentDTO;
import com.skillmentor.dto.student.UpdateStudentDTO;
import com.skillmentor.entity.Student;
import lombok.extern.slf4j.Slf4j;


@Slf4j
public class StudentMapper {
    public static StudentDTO toDTO(Student student) {
        return StudentDTO.builder()
                .id(student.getId())
                .userId(student.getUser().getId())
                .clerkId(student.getUser().getClerkId())
                .firstName(student.getUser().getFirstName())
                .lastName(student.getUser().getLastName())
                .email(student.getUser().getEmail())
                .studentCode(student.getStudentCode())
                .learningGoals(student.getLearningGoals())
                .profileImageUrl(student.getUser().getProfileImageUrl())
                .coverImageUrl(student.getCoverImageUrl())
                .build();
    }

    public static Student toEntity(CreateStudentDTO dto ) {
        return Student.builder()
                .studentCode(dto.getStudentCode())
                .learningGoals(dto.getLearningGoals())
                .build();
    }

    public static Student UpdateStudent(Student student, UpdateStudentDTO dto ) {
        student.setLearningGoals(dto.getLearningGoals());
        return student;
    }
}
