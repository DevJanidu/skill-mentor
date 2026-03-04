package com.skillmentor.service;

import com.skillmentor.dto.session.BookSessionDTO;
import com.skillmentor.dto.session.CreateSessionDTO;
import com.skillmentor.dto.session.SessionDTO;
import com.skillmentor.dto.session.UpdateSessionDTO;

import java.util.List;

public interface SessionService {

    //sessions crud related
    List<SessionDTO> getAllSessions();
    SessionDTO getSessionById(Long id);
    SessionDTO createSession(CreateSessionDTO dto);
    SessionDTO updateSessionDto(Long id, UpdateSessionDTO dto);
    void deleteSession(Long id);

    //sessions for student
    List<SessionDTO> getSessionsByStudent(Long studentId);
    // sessions for mentor
    List<SessionDTO> getSessionsByMentor(Long mentorId);

    /** Student self-booking – the student is determined from the JWT clerkId */
    SessionDTO bookSession(BookSessionDTO dto, String callerClerkId);
}
