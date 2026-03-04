package com.skillmentor.mapper;


import com.skillmentor.dto.subject.CreateSubjectDTO;
import com.skillmentor.dto.subject.SubjectDTO;
import com.skillmentor.dto.subject.UpdateSubjectDTO;
import com.skillmentor.entity.Subject;

public class SubjectMapper {

    public static Subject toEntity(CreateSubjectDTO dto) {
        return Subject.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .build();


    }

    public static SubjectDTO toDTO(Subject subject) {
        return SubjectDTO.builder()
                .id(subject.getId())
                .subjectName(subject.getName())
                .description(subject.getDescription())
                .mentorId(subject.getMentor().getId())
                .mentorName(subject.getMentor().getUser().getFullName())
                .createdAt(subject.getCreatedAt())
                .updatedAt(subject.getUpdatedAt())
                .build();
    }

    public static Subject UpdateEntity(Subject subject,UpdateSubjectDTO dto) {
       subject.setName(dto.getName());
       subject.setDescription(dto.getDescription());
       return subject;
    }
}
