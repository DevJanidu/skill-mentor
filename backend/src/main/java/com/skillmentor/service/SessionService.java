package com.skillmentor.service;

import com.skillmentor.dto.session.*;

import java.util.List;

public interface SessionService {

    // sessions crud related
    List<SessionDTO> getAllSessions();
    SessionDTO getSessionById(Long id);
    SessionDTO createSession(CreateSessionDTO dto);
    SessionDTO updateSessionDto(Long id, UpdateSessionDTO dto);
    void deleteSession(Long id);

    // sessions for student
    List<SessionDTO> getSessionsByStudent(Long studentId);
    // sessions for mentor
    List<SessionDTO> getSessionsByMentor(Long mentorId);

    /** Student self-booking – the student is determined from the JWT clerkId */
    SessionDTO bookSession(BookSessionDTO dto, String callerClerkId);

    // ── P0: Receipt + Approve / Reject ───────────────────────────────────
    SessionDTO submitReceipt(Long sessionId, SubmitReceiptDTO dto, String callerClerkId);
    SessionDTO approveSession(Long sessionId, ApproveSessionDTO dto, String callerClerkId);
    SessionDTO rejectSession(Long sessionId, RejectSessionDTO dto, String callerClerkId);

    // ── P1: Lifecycle ────────────────────────────────────────────────────
    SessionDTO startSession(Long sessionId, String callerClerkId);
    SessionDTO completeSession(Long sessionId, CompleteSessionDTO dto, String callerClerkId);
    SessionDTO cancelSession(Long sessionId, String callerClerkId);

    // ── P1: Group join / leave ───────────────────────────────────────────
    List<SessionDTO> getOpenGroupSessions();
    SessionDTO joinSession(Long sessionId, String callerClerkId);
    SessionDTO leaveSession(Long sessionId, String callerClerkId);

    // ── P2: Reviews ──────────────────────────────────────────────────────
    SessionDTO submitReview(Long sessionId, ReviewSessionDTO dto, String callerClerkId);
    SessionDTO deleteReview(Long sessionId);

    // ── P3: Post-session resources (mentor) ──────────────────────────────
    SessionDTO updateSessionResources(Long sessionId, UpdateSessionResourcesDTO dto, String callerClerkId);
}
