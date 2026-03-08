package com.skillmentor.service.impl;

import com.skillmentor.dto.mentor.CreateMentorAvailabilityDTO;
import com.skillmentor.dto.mentor.MentorAvailabilityDTO;
import com.skillmentor.entity.Mentor;
import com.skillmentor.entity.MentorAvailability;
import com.skillmentor.entity.User;
import com.skillmentor.exception.SkillMentorException;
import com.skillmentor.repository.MentorAvailabilityRepository;
import com.skillmentor.repository.MentorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MentorAvailabilityServiceImplTest {

    @Mock
    private MentorAvailabilityRepository availabilityRepository;

    @Mock
    private MentorRepository mentorRepository;

    @InjectMocks
    private MentorAvailabilityServiceImpl service;

    private Mentor mentor;
    private User mentorUser;

    @BeforeEach
    void setUp() {
        mentorUser = User.builder()
                .id(1L)
                .clerkId("clerk_mentor_1")
                .build();

        mentor = Mentor.builder()
                .id(10L)
                .user(mentorUser)
                .build();

        // Set up security context as MENTOR
        var auth = new UsernamePasswordAuthenticationToken(
                null, null,
                List.of(new SimpleGrantedAuthority("ROLE_MENTOR")));
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void getAvailability_returnsSlotsForMentor() {
        MentorAvailability slot = MentorAvailability.builder()
                .id(1L)
                .mentor(mentor)
                .dayOfWeek(DayOfWeek.MONDAY)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(17, 0))
                .isActive(true)
                .build();

        when(mentorRepository.findById(10L)).thenReturn(Optional.of(mentor));
        when(availabilityRepository.findByMentorIdOrderByDayOfWeekAscStartTimeAsc(10L))
                .thenReturn(List.of(slot));

        List<MentorAvailabilityDTO> result = service.getAvailability(10L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getDayOfWeek()).isEqualTo(DayOfWeek.MONDAY);
        assertThat(result.get(0).getStartTime()).isEqualTo(LocalTime.of(9, 0));
    }

    @Test
    void getAvailability_throwsWhenMentorNotFound() {
        when(mentorRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getAvailability(99L))
                .isInstanceOf(SkillMentorException.class)
                .hasMessageContaining("Mentor not found");
    }

    @Test
    void setAvailability_replacesExistingSlots() {
        when(mentorRepository.findById(10L)).thenReturn(Optional.of(mentor));
        doNothing().when(availabilityRepository).deleteByMentorId(10L);

        CreateMentorAvailabilityDTO dto = CreateMentorAvailabilityDTO.builder()
                .dayOfWeek(DayOfWeek.TUESDAY)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(14, 0))
                .isActive(true)
                .build();

        MentorAvailability saved = MentorAvailability.builder()
                .id(2L)
                .mentor(mentor)
                .dayOfWeek(DayOfWeek.TUESDAY)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(14, 0))
                .isActive(true)
                .build();

        when(availabilityRepository.saveAll(any())).thenReturn(List.of(saved));

        List<MentorAvailabilityDTO> result = service.setAvailability(10L, List.of(dto), "clerk_mentor_1");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getDayOfWeek()).isEqualTo(DayOfWeek.TUESDAY);
        verify(availabilityRepository).deleteByMentorId(10L);
        verify(availabilityRepository).saveAll(any());
    }

    @Test
    void setAvailability_rejectsEndBeforeStart() {
        when(mentorRepository.findById(10L)).thenReturn(Optional.of(mentor));

        CreateMentorAvailabilityDTO bad = CreateMentorAvailabilityDTO.builder()
                .dayOfWeek(DayOfWeek.MONDAY)
                .startTime(LocalTime.of(17, 0))
                .endTime(LocalTime.of(9, 0))
                .isActive(true)
                .build();

        assertThatThrownBy(() -> service.setAvailability(10L, List.of(bad), "clerk_mentor_1"))
                .isInstanceOf(SkillMentorException.class)
                .hasMessageContaining("End time must be after start time");
    }

    @Test
    void setAvailability_rejectsNonOwner() {
        when(mentorRepository.findById(10L)).thenReturn(Optional.of(mentor));

        CreateMentorAvailabilityDTO dto = CreateMentorAvailabilityDTO.builder()
                .dayOfWeek(DayOfWeek.MONDAY)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(17, 0))
                .build();

        assertThatThrownBy(() -> service.setAvailability(10L, List.of(dto), "clerk_other_user"))
                .isInstanceOf(SkillMentorException.class)
                .hasMessageContaining("not the owner");
    }

    @Test
    void setAvailability_adminBypassesOwnershipCheck() {
        // Set up security context as ADMIN
        var auth = new UsernamePasswordAuthenticationToken(
                null, null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(mentorRepository.findById(10L)).thenReturn(Optional.of(mentor));
        when(availabilityRepository.saveAll(any())).thenReturn(List.of());

        CreateMentorAvailabilityDTO dto = CreateMentorAvailabilityDTO.builder()
                .dayOfWeek(DayOfWeek.FRIDAY)
                .startTime(LocalTime.of(8, 0))
                .endTime(LocalTime.of(12, 0))
                .build();

        // Should not throw even with a different clerkId
        List<MentorAvailabilityDTO> result = service.setAvailability(10L, List.of(dto), "clerk_admin");
        assertThat(result).isEmpty();
    }

    @Test
    void deleteAvailability_removesSlotForOwner() {
        MentorAvailability slot = MentorAvailability.builder()
                .id(5L)
                .mentor(mentor)
                .dayOfWeek(DayOfWeek.WEDNESDAY)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(12, 0))
                .isActive(true)
                .build();

        when(mentorRepository.findById(10L)).thenReturn(Optional.of(mentor));
        when(availabilityRepository.findById(5L)).thenReturn(Optional.of(slot));

        service.deleteAvailability(10L, 5L, "clerk_mentor_1");

        verify(availabilityRepository).delete(slot);
    }

    @Test
    void deleteAvailability_rejectsSlotBelongingToDifferentMentor() {
        Mentor otherMentor = Mentor.builder().id(20L).build();
        MentorAvailability slot = MentorAvailability.builder()
                .id(5L)
                .mentor(otherMentor)
                .build();

        when(mentorRepository.findById(10L)).thenReturn(Optional.of(mentor));
        when(availabilityRepository.findById(5L)).thenReturn(Optional.of(slot));

        assertThatThrownBy(() -> service.deleteAvailability(10L, 5L, "clerk_mentor_1"))
                .isInstanceOf(SkillMentorException.class)
                .hasMessageContaining("does not belong");
    }
}
