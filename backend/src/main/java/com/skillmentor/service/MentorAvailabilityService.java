package com.skillmentor.service;

import com.skillmentor.dto.mentor.CreateMentorAvailabilityDTO;
import com.skillmentor.dto.mentor.MentorAvailabilityDTO;

import java.util.List;

public interface MentorAvailabilityService {

    List<MentorAvailabilityDTO> getAvailability(Long mentorId);

    List<MentorAvailabilityDTO> setAvailability(Long mentorId, List<CreateMentorAvailabilityDTO> slots, String callerClerkId);

    void deleteAvailability(Long mentorId, Long slotId, String callerClerkId);
}
