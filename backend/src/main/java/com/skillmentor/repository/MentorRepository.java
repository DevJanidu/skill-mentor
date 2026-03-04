package com.skillmentor.repository;


import com.skillmentor.entity.Mentor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MentorRepository extends JpaRepository<Mentor,Long> {
    Optional<Mentor> findByUserClerkId(String clerkId);
}
