package com.skillmentor.repository;

import com.skillmentor.entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface SessionRepository extends JpaRepository<Session,Long> {

    @Query("""
    SELECT s FROM Session s
    JOIN s.students st
    WHERE st.id = :studentId
""")
    List<Session> findByStudentId(Long studentId);


    List<Session> findByMentorId(Long id);

    Long id(Long id);
}
