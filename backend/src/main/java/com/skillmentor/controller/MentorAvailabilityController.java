package com.skillmentor.controller;

import com.skillmentor.dto.mentor.CreateMentorAvailabilityDTO;
import com.skillmentor.dto.mentor.MentorAvailabilityDTO;
import com.skillmentor.security.UserPrincipal;
import com.skillmentor.service.MentorAvailabilityService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mentors/{mentorId}/availability")
@RequiredArgsConstructor
@Validated
@PreAuthorize("isAuthenticated()")
@Tag(name = "Mentor Availability")
public class MentorAvailabilityController extends AbstractController {

    private final MentorAvailabilityService availabilityService;

    /** Public: any authenticated user can view a mentor's availability. */
    @GetMapping
    public ResponseEntity<List<MentorAvailabilityDTO>> getAvailability(
            @PathVariable @Min(1) Long mentorId
    ) {
        return sendOkResponse(availabilityService.getAvailability(mentorId));
    }

    /** Mentor (owner) or Admin replaces all availability slots. */
    @PreAuthorize("hasAnyRole('ADMIN','MENTOR')")
    @PutMapping
    public ResponseEntity<List<MentorAvailabilityDTO>> setAvailability(
            @PathVariable @Min(1) Long mentorId,
            @Valid @RequestBody List<CreateMentorAvailabilityDTO> slots,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        return sendOkResponse(
                availabilityService.setAvailability(mentorId, slots, userPrincipal.getId()));
    }

    /** Mentor (owner) or Admin deletes a single availability slot. */
    @PreAuthorize("hasAnyRole('ADMIN','MENTOR')")
    @DeleteMapping("/{slotId}")
    public ResponseEntity<Void> deleteAvailability(
            @PathVariable @Min(1) Long mentorId,
            @PathVariable @Min(1) Long slotId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        availabilityService.deleteAvailability(mentorId, slotId, userPrincipal.getId());
        return sendNoContentResponse();
    }
}
