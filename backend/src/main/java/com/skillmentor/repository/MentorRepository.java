package com.skillmentor.repository;

import com.skillmentor.entity.Mentor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MentorRepository extends JpaRepository<Mentor, Long> {
    Optional<Mentor> findByUserClerkId(String clerkId);

    /** Paginated search by name and/or profession (both optional, case-insensitive). */
    @Query("""
        SELECT m FROM Mentor m JOIN m.user u
        WHERE (:name IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :name, '%')))
          AND (:profession IS NULL OR LOWER(m.profession) LIKE LOWER(CONCAT('%', :profession, '%')))
    """)
    Page<Mentor> searchMentors(
            @Param("name") String name,
            @Param("profession") String profession,
            Pageable pageable
    );
}
