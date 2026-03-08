package com.skillmentor.service.impl;

import com.skillmentor.dto.mentor.CreateMentorAvailabilityDTO;
import com.skillmentor.dto.mentor.MentorAvailabilityDTO;
import com.skillmentor.entity.Mentor;
import com.skillmentor.entity.MentorAvailability;
import com.skillmentor.exception.SkillMentorException;
import com.skillmentor.mapper.MentorAvailabilityMapper;
import com.skillmentor.repository.MentorAvailabilityRepository;
import com.skillmentor.repository.MentorRepository;
import com.skillmentor.service.MentorAvailabilityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MentorAvailabilityServiceImpl implements MentorAvailabilityService {

    private final MentorAvailabilityRepository availabilityRepository;
    private final MentorRepository mentorRepository;

    @Override
    @Transactional(readOnly = true)
    public List<MentorAvailabilityDTO> getAvailability(Long mentorId) {
        // Verify mentor exists
        mentorRepository.findById(mentorId)
                .orElseThrow(() -> new SkillMentorException(
                        "Mentor not found with id " + mentorId, HttpStatus.NOT_FOUND));

        return availabilityRepository.findByMentorIdOrderByDayOfWeekAscStartTimeAsc(mentorId)
                .stream()
                .map(MentorAvailabilityMapper::toDto)
                .toList();
    }

    @Override
    @Transactional
    public List<MentorAvailabilityDTO> setAvailability(
            Long mentorId,
            List<CreateMentorAvailabilityDTO> slots,
            String callerClerkId
    ) {
        Mentor mentor = mentorRepository.findById(mentorId)
                .orElseThrow(() -> new SkillMentorException(
                        "Mentor not found with id " + mentorId, HttpStatus.NOT_FOUND));

        validateOwnership(mentor, callerClerkId);

        // Validate each slot: endTime must be after startTime
        for (CreateMentorAvailabilityDTO slot : slots) {
            if (!slot.getEndTime().isAfter(slot.getStartTime())) {
                throw new SkillMentorException(
                        "End time must be after start time for " + slot.getDayOfWeek(),
                        HttpStatus.BAD_REQUEST);
            }
        }

        // Replace all existing availability for this mentor
        availabilityRepository.deleteByMentorId(mentorId);
        availabilityRepository.flush();

        List<MentorAvailability> entities = slots.stream()
                .map(dto -> MentorAvailabilityMapper.toEntity(dto, mentor))
                .toList();

        List<MentorAvailability> saved = availabilityRepository.saveAll(entities);

        log.info("Set {} availability slots for mentor {}", saved.size(), mentorId);

        return saved.stream()
                .map(MentorAvailabilityMapper::toDto)
                .toList();
    }

    @Override
    @Transactional
    public void deleteAvailability(Long mentorId, Long slotId, String callerClerkId) {
        Mentor mentor = mentorRepository.findById(mentorId)
                .orElseThrow(() -> new SkillMentorException(
                        "Mentor not found with id " + mentorId, HttpStatus.NOT_FOUND));

        validateOwnership(mentor, callerClerkId);

        MentorAvailability slot = availabilityRepository.findById(slotId)
                .orElseThrow(() -> new SkillMentorException(
                        "Availability slot not found with id " + slotId, HttpStatus.NOT_FOUND));

        if (!slot.getMentor().getId().equals(mentorId)) {
            throw new SkillMentorException(
                    "Slot does not belong to this mentor", HttpStatus.FORBIDDEN);
        }

        availabilityRepository.delete(slot);
        log.info("Deleted availability slot {} for mentor {}", slotId, mentorId);
    }

    private void validateOwnership(Mentor mentor, String callerClerkId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin) return;

        if (!mentor.getUser().getClerkId().equals(callerClerkId)) {
            throw new SkillMentorException(
                    "You are not the owner of this mentor profile", HttpStatus.FORBIDDEN);
        }
    }
}
