package com.skillmentor.service.impl;

import com.skillmentor.dto.admin.AdminStatsDTO;
import com.skillmentor.dto.session.SessionStatus;
import com.skillmentor.mapper.SessionMapper;
import com.skillmentor.repository.*;
import com.skillmentor.service.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final MentorRepository mentorRepository;
    private final StudentRepository studentRepository;
    private final SubjectRepository subjectRepository;
    private final SessionRepository sessionRepository;

    @Cacheable("dashboardStats")
    @Override
    @Transactional(readOnly = true)
    public AdminStatsDTO getStats() {
        log.debug("Fetching admin dashboard stats [cache miss]");

        long pending   = sessionRepository.countBySessionStatus(SessionStatus.PENDING);
        long scheduled = sessionRepository.countBySessionStatus(SessionStatus.SCHEDULED);
        long started   = sessionRepository.countBySessionStatus(SessionStatus.STARTED);
        long completed = sessionRepository.countBySessionStatus(SessionStatus.COMPLETED);
        long cancelled = sessionRepository.countBySessionStatus(SessionStatus.CANCELED);

        return AdminStatsDTO.builder()
                // User totals
                .totalUsers(userRepository.count())
                .totalMentors(mentorRepository.count())
                .totalStudents(studentRepository.count())
                .newUsersLast7Days(userRepository.countByCreatedAtAfter(LocalDateTime.now().minusDays(7)))
                .newUsersLast30Days(userRepository.countByCreatedAtAfter(LocalDateTime.now().minusDays(30)))
                // Subject / session totals
                .totalSubjects(subjectRepository.count())
                .totalSessions(sessionRepository.count())
                // Individual counts
                .pendingSessions(pending)
                .scheduledSessions(scheduled)
                .startedSessions(started)
                .completedSessions(completed)
                .cancelledSessions(cancelled)
                // Convenience map for charting
                .sessionsByStatus(Map.of(
                        "PENDING",   pending,
                        "SCHEDULED", scheduled,
                        "STARTED",   started,
                        "COMPLETED", completed,
                        "CANCELED",  cancelled
                ))
                // 10 most recent sessions
                .recentSessions(
                        sessionRepository.findTop10ByOrderByCreatedAtDesc()
                                .stream()
                                .map(SessionMapper::toDTO)
                                .collect(Collectors.toList())
                )
                .build();
    }
}
