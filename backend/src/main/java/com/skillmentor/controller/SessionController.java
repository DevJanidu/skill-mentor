package com.skillmentor.controller;

import com.skillmentor.dto.session.*;
import com.skillmentor.security.UserPrincipal;
import com.skillmentor.service.CloudinaryService;
import com.skillmentor.service.SessionService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
@Validated
@PreAuthorize("isAuthenticated()")
@Tag(name = "Session Controller")
public class SessionController extends AbstractController {

    private final SessionService sessionService;
    private final CloudinaryService cloudinaryService;

    // ── EXISTING CRUD ────────────────────────────────────────────────────

    @PreAuthorize("hasAnyRole('ADMIN','MENTOR')")
    @GetMapping
    public ResponseEntity<List<SessionDTO>> getAllSessions() {
        return sendOkResponse(sessionService.getAllSessions());
    }

    @PreAuthorize("isAuthenticated()")
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

    // ── Student self-booking ─────────────────────────────────────────────

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

    // ═════════════════════════════════════════════════════════════════════
    //  P0: RECEIPT + APPROVE / REJECT
    // ═════════════════════════════════════════════════════════════════════

    /** Student submits/re-submits a payment receipt for a session they are enrolled in. */
    @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    @PatchMapping("/{id}/submit-receipt")
    public ResponseEntity<SessionDTO> submitReceipt(
            @PathVariable @Min(1) Long id,
            @Valid @RequestBody SubmitReceiptDTO dto,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        return sendOkResponse(sessionService.submitReceipt(id, dto, userPrincipal.getId()));
    }

    /** Mentor (owner) or Admin approves a pending payment and sets a meeting link. */
    @PreAuthorize("hasAnyRole('ADMIN','MENTOR')")
    @PatchMapping("/{id}/approve")
    public ResponseEntity<SessionDTO> approveSession(
            @PathVariable @Min(1) Long id,
            @Valid @RequestBody ApproveSessionDTO dto,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        return sendOkResponse(sessionService.approveSession(id, dto, userPrincipal.getId()));
    }

    /** Mentor (owner) or Admin rejects a pending payment with a reason. */
    @PreAuthorize("hasAnyRole('ADMIN','MENTOR')")
    @PatchMapping("/{id}/reject")
    public ResponseEntity<SessionDTO> rejectSession(
            @PathVariable @Min(1) Long id,
            @Valid @RequestBody RejectSessionDTO dto,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        return sendOkResponse(sessionService.rejectSession(id, dto, userPrincipal.getId()));
    }

    // ═════════════════════════════════════════════════════════════════════
    //  P1: LIFECYCLE – START / COMPLETE / CANCEL
    // ═════════════════════════════════════════════════════════════════════

    @PreAuthorize("hasAnyRole('ADMIN','MENTOR')")
    @PatchMapping("/{id}/start")
    public ResponseEntity<SessionDTO> startSession(
            @PathVariable @Min(1) Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        return sendOkResponse(sessionService.startSession(id, userPrincipal.getId()));
    }

    @PreAuthorize("hasAnyRole('ADMIN','MENTOR')")
    @PatchMapping("/{id}/complete")
    public ResponseEntity<SessionDTO> completeSession(
            @PathVariable @Min(1) Long id,
            @RequestBody(required = false) CompleteSessionDTO dto,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        return sendOkResponse(sessionService.completeSession(id, dto, userPrincipal.getId()));
    }

    /** Any authenticated user (STUDENT/MENTOR/ADMIN) cancels a PENDING or SCHEDULED session. */
    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/{id}/cancel")
    public ResponseEntity<SessionDTO> cancelSession(
            @PathVariable @Min(1) Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        return sendOkResponse(sessionService.cancelSession(id, userPrincipal.getId()));
    }

    // ═════════════════════════════════════════════════════════════════════
    //  P1: GROUP JOIN / LEAVE / OPEN LIST
    // ═════════════════════════════════════════════════════════════════════

    /** List open GROUP sessions with available seats. */
    @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    @GetMapping("/open")
    public ResponseEntity<List<SessionDTO>> getOpenGroupSessions() {
        return sendOkResponse(sessionService.getOpenGroupSessions());
    }

    /** Student joins an existing open GROUP session. */
    @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    @PostMapping("/{id}/join")
    public ResponseEntity<SessionDTO> joinSession(
            @PathVariable @Min(1) Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        return sendOkResponse(sessionService.joinSession(id, userPrincipal.getId()));
    }

    /** Student leaves a PENDING group session. */
    @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    @DeleteMapping("/{id}/leave")
    public ResponseEntity<SessionDTO> leaveSession(
            @PathVariable @Min(1) Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        return sendOkResponse(sessionService.leaveSession(id, userPrincipal.getId()));
    }

    // ═════════════════════════════════════════════════════════════════════
    //  P2: REVIEWS
    // ═════════════════════════════════════════════════════════════════════

    /** Student submits a review for a COMPLETED session they attended. */
    @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    @PostMapping("/{id}/review")
    public ResponseEntity<SessionDTO> submitReview(
            @PathVariable @Min(1) Long id,
            @Valid @RequestBody ReviewSessionDTO dto,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        return sendOkResponse(sessionService.submitReview(id, dto, userPrincipal.getId()));
    }

    /** Admin removes a review from a session. */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}/review")
    public ResponseEntity<SessionDTO> deleteReview(
            @PathVariable @Min(1) Long id
    ) {
        return sendOkResponse(sessionService.deleteReview(id));
    }

    // ═════════════════════════════════════════════════════════════════════
    //  P0: RECEIPT FILE UPLOAD (Cloudinary → submitReceipt)
    // ═════════════════════════════════════════════════════════════════════

    /**
     * POST /api/sessions/{id}/receipt-upload
     * Student uploads a payment receipt image.  The file is stored on Cloudinary
     * and the resulting URL is automatically forwarded to submitReceipt.
     */
    @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    @PostMapping(value = "/{id}/receipt-upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SessionDTO> uploadReceipt(
            @PathVariable @Min(1) Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        String receiptUrl = cloudinaryService.uploadUnsigned(file, "receipts");
        SubmitReceiptDTO dto = SubmitReceiptDTO.builder().receiptUrl(receiptUrl).build();
        return sendOkResponse(sessionService.submitReceipt(id, dto, userPrincipal.getId()));
    }

    // ═════════════════════════════════════════════════════════════════════
    //  P3: POST-SESSION RESOURCES (MENTOR)
    // ═════════════════════════════════════════════════════════════════════

    /**
     * PATCH /api/sessions/{id}/resources
     * Mentor attaches post-session resources (recording, assessment, resource links + notes).
     * Allowed only for STARTED or COMPLETED sessions owned by the calling mentor.
     */
    @PreAuthorize("hasAnyRole('ADMIN','MENTOR')")
    @PatchMapping("/{id}/resources")
    public ResponseEntity<SessionDTO> updateSessionResources(
            @PathVariable @Min(1) Long id,
            @Valid @RequestBody UpdateSessionResourcesDTO dto,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        return sendOkResponse(sessionService.updateSessionResources(id, dto, userPrincipal.getId()));
    }
}
