package com.skillmentor.repository;

import com.skillmentor.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubjectRepository extends JpaRepository<Subject,Long> {
    List<Subject> findByMentorId(Long mentorId);
}
