package com.skillmentor.repository;

import com.skillmentor.entity.Subject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, Long> {
    List<Subject> findByMentorId(Long mentorId);

    /** Paginated search by name and/or category (both optional, case-insensitive). */
    @Query("""
        SELECT s FROM Subject s
        WHERE (:name IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', :name, '%')))
          AND (:category IS NULL OR LOWER(s.category) LIKE LOWER(CONCAT('%', :category, '%')))
    """)
    Page<Subject> searchSubjects(
            @Param("name") String name,
            @Param("category") String category,
            Pageable pageable
    );
}
