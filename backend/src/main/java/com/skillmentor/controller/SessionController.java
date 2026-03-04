package com.skillmentor.controller;

import com.skillmentor.dto.session.BookSessionDTO;
import com.skillmentor.dto.session.CreateSessionDTO;
import com.skillmentor.dto.session.SessionDTO;
import com.skillmentor.dto.session.UpdateSessionDTO;
import com.skillmentor.security.UserPrincipal;
import com.skillmentor.service.SessionService;
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
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
@Validated
@PreAuthorize("isAuthenticated()")
@Tag(name = "Session Controller")
public class SessionController extends AbstractController {

    private final SessionService sessionService;

    @PreAuthorize("hasAnyRole('ADMIN','MENTOR')")
    @GetMapping
    public ResponseEntity<List<SessionDTO>> getAllSessions() {

        return sendOkResponse(sessionService.getAllSessions());
    }


    @PreAuthorize("hasAnyRole('ADMIN','MENTOR')")
    @GetMapping("/{id}")
    public ResponseEntity<SessionDTO> getSessionById(
            @PathVariable @Min(value = 1, message = "Session ID must be positive") Long id
    ) {
        return sendOkResponse(sessionService.getSessionById(id));
    }
    @PreAuthorize("hasAnyRole('ADMIN','MENTOR')")
    @PostMapping
    public ResponseEntity<SessionDTO> createSession(
            @Valid @RequestBody CreateSessionDTO dto
    ) {
        return sendCreatedAtResponse(sessionService.createSession(dto));
    }

    @PreAuthorize("hasAnyRole('ADMIN','MENTOR')")
    @PutMapping("/{id}")
    public ResponseEntity<SessionDTO> updateSession(
            @PathVariable @Min(value = 1, message = "Session ID must be positive") Long id,
            @Valid @RequestBody UpdateSessionDTO dto
    ) {
        return sendOkResponse(sessionService.updateSessionDto(id, dto));
    }

    @PreAuthorize("hasAnyRole('ADMIN','MENTOR')")
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteSession(
            @PathVariable @Min(value = 1, message = "Session ID must be positive") Long id
    ) {
        sessionService.deleteSession(id);
        return sendOkResponse("Session deleted successfully with id " + id);
    }

    // ── Student self-booking endpoint ────────────────────────────────────

    @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    @PostMapping("/book")
    public ResponseEntity<SessionDTO> bookSession(
            @Valid @RequestBody BookSessionDTO dto,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        return sendCreatedAtResponse(
                sessionService.bookSession(dto, userPrincipal.getId())
        );
    }

    @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<SessionDTO>> getSessionsByStudent(
            @PathVariable @Min(value = 1, message = "Student ID must be positive") Long studentId
    ) {
        return sendOkResponse(sessionService.getSessionsByStudent(studentId));
    }
    @PreAuthorize("hasAnyRole('ADMIN','MENTOR')")
    @GetMapping("/mentor/{mentorId}")
    public ResponseEntity<List<SessionDTO>> getSessionsByMentor(
            @PathVariable @Min(value = 1, message = "Mentor ID must be positive") Long mentorId
    ) {
        return sendOkResponse(sessionService.getSessionsByMentor(mentorId));
    }
}
