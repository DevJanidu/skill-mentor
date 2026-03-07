package com.skillmentor.repository;

import com.skillmentor.dto.session.SessionStatus;
import com.skillmentor.dto.session.SessionType;
import com.skillmentor.entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;


@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {

    @Query("""
    SELECT s FROM Session s
    JOIN s.students st
    WHERE st.id = :studentId
""")
    List<Session> findByStudentId(Long studentId);


    List<Session> findByMentorId(Long id);

    /** Mentor sessions filtered to only ACTIVE statuses (for overlap checks) */
    @Query("""
        SELECT s FROM Session s
        WHERE s.mentor.id = :mentorId
          AND s.sessionStatus IN :statuses
    """)
    List<Session> findActiveSessionsByMentorId(
            @Param("mentorId") Long mentorId,
            @Param("statuses") List<SessionStatus> statuses
    );

    /** Student sessions filtered to only ACTIVE statuses (for overlap checks) */
    @Query("""
        SELECT s FROM Session s
        JOIN s.students st
        WHERE st.id = :studentId
          AND s.sessionStatus IN :statuses
    """)
    List<Session> findActiveSessionsByStudentId(
            @Param("studentId") Long studentId,
            @Param("statuses") List<SessionStatus> statuses
    );

    /** Open GROUP sessions that still have seats available AND are in the future */
    @Query("""
        SELECT s FROM Session s
        WHERE s.sessionType = :sessionType
          AND s.sessionStatus IN :statuses
          AND SIZE(s.students) < s.maxParticipants
          AND s.sessionAt > :now
    """)
    List<Session> findOpenGroupSessions(
            @Param("sessionType") SessionType sessionType,
            @Param("statuses") List<SessionStatus> statuses,
            @Param("now") LocalDateTime now
    );

    /** 10 most recently created sessions — used by admin dashboard */
    List<Session> findTop10ByOrderByCreatedAtDesc();

    /** Count sessions by status */
    long countBySessionStatus(SessionStatus status);

    /** Sessions with reviews for a given mentor (for recalculating avg rating) */
    @Query("""
        SELECT s FROM Session s
        WHERE s.mentor.id = :mentorId
          AND s.studentRating IS NOT NULL
    """)
    List<Session> findReviewedSessionsByMentorId(@Param("mentorId") Long mentorId);
}
