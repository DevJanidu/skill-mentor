package com.skillmentor.repository;

import com.skillmentor.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User,Long> {
    Optional<User> findByClerkId(String clerkId);
    Optional<User> findUserByMentorId(Long mentorId);
    Optional<User> findUserByStudentId(Long studentId);
    boolean existsByClerkId(String clerkId);

    /** Count users registered after the given point in time */
    long countByCreatedAtAfter(LocalDateTime dateTime);
}
