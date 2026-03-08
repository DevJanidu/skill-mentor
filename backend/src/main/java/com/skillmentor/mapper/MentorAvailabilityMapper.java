package com.skillmentor.mapper;

import com.skillmentor.dto.mentor.CreateMentorAvailabilityDTO;
import com.skillmentor.dto.mentor.MentorAvailabilityDTO;
import com.skillmentor.entity.Mentor;
import com.skillmentor.entity.MentorAvailability;

public class MentorAvailabilityMapper {

    private MentorAvailabilityMapper() {}

    public static MentorAvailability toEntity(CreateMentorAvailabilityDTO dto, Mentor mentor) {
        return MentorAvailability.builder()
                .mentor(mentor)
                .dayOfWeek(dto.getDayOfWeek())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .build();
    }

    public static MentorAvailabilityDTO toDto(MentorAvailability entity) {
        return MentorAvailabilityDTO.builder()
                .id(entity.getId())
                .mentorId(entity.getMentor().getId())
                .dayOfWeek(entity.getDayOfWeek())
                .startTime(entity.getStartTime())
                .endTime(entity.getEndTime())
                .isActive(entity.getIsActive())
                .build();
    }
}
