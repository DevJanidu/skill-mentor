package com.skillmentor.controller;


import com.skillmentor.dto.mentor.CreateMentorDTO;
import com.skillmentor.dto.mentor.MentorDTO;
import com.skillmentor.dto.mentor.UpdateMentorDTO;
import com.skillmentor.dto.session.SessionDTO;

import com.skillmentor.security.UserPrincipal;
import com.skillmentor.service.MentorService;
import com.skillmentor.service.SessionService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;


import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mentors")
@RequiredArgsConstructor
@Tag(name = "Mentor Controller")
public class MentorController extends AbstractController {

    private final MentorService mentorService;
    private final SessionService sessionService;


    @GetMapping
    public ResponseEntity<List<MentorDTO>> getAllMentors() {
        List<MentorDTO> mentors = mentorService.getAllMentors();
        return sendOkResponse(mentors);
    }


    @GetMapping("/{id}")
    public ResponseEntity<MentorDTO> getMentorById(@PathVariable Long id) {
        return sendOkResponse(mentorService.getMentorById(id));
    }

    @PreAuthorize("hasAnyRole('ADMIN','MENTOR','STUDENT')")
    @GetMapping("/{id}/sessions")
    public ResponseEntity<List<SessionDTO>> getSessionsByMentor(@PathVariable Long id) {
        return sendOkResponse(sessionService.getSessionsByMentor(id));
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping
    public ResponseEntity<MentorDTO> createMentor(@Valid @RequestBody CreateMentorDTO dto,
                                                  @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {

        return sendCreatedAtResponse(mentorService.createMentor(dto,userPrincipal.getId()));
    }

    @PreAuthorize("hasAnyRole('ADMIN','MENTOR')")
    @PutMapping("/{id}")
    public ResponseEntity<MentorDTO> updateMentor(@PathVariable Long id,
                                                  @Valid @RequestBody UpdateMentorDTO dto) {

        return sendOkResponse(mentorService.updateMentor(id, dto));
    }

    @PreAuthorize("hasAnyRole('ADMIN','MENTOR')")
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteMentor(@PathVariable Long id) {
        mentorService.deleteMentor(id);
        return sendOkResponse(String.format("mentor deleted with id (%s)", id));
    }
}
