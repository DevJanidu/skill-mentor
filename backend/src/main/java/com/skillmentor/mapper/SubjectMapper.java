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
                .thumbnailUrl(dto.getThumbnailUrl())
                .category(dto.getCategory())
                .build();
    }

    public static SubjectDTO toDTO(Subject subject) {
        java.util.List<Integer> ratings = subject.getSessions() == null ? java.util.List.of() :
                subject.getSessions().stream()
                        .filter(s -> s.getStudentRating() != null)
                        .map(com.skillmentor.entity.Session::getStudentRating)
                        .toList();
        double avg = ratings.isEmpty() ? 0.0 :
                ratings.stream().mapToInt(Integer::intValue).average().orElse(0.0);
        // Round to one decimal place
        avg = Math.round(avg * 10.0) / 10.0;

        return SubjectDTO.builder()
                .id(subject.getId())
                .subjectName(subject.getName())
                .description(subject.getDescription())
                .thumbnailUrl(subject.getThumbnailUrl())
                .category(subject.getCategory())
                .mentorId(subject.getMentor().getId())
                .mentorName(subject.getMentor().getUser().getFullName())
                .averageRating(avg)
                .totalReviews(ratings.size())
                .createdAt(subject.getCreatedAt())
                .updatedAt(subject.getUpdatedAt())
                .build();
    }

    public static Subject UpdateEntity(Subject subject, UpdateSubjectDTO dto) {
        subject.setName(dto.getName());
        subject.setDescription(dto.getDescription());
        if (dto.getThumbnailUrl() != null) {
            subject.setThumbnailUrl(dto.getThumbnailUrl());
        }
        if (dto.getCategory() != null) {
            subject.setCategory(dto.getCategory());
        }
        return subject;
    }
}
