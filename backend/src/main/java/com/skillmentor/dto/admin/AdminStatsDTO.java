package com.skillmentor.dto.admin;

import com.skillmentor.dto.session.SessionDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Aggregated dashboard statistics returned by GET /api/admin/stats.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AdminStatsDTO {
    // User counts
    private long totalUsers;
    private long totalMentors;
    private long totalStudents;
    private long newUsersLast7Days;
    private long newUsersLast30Days;

    // Subject / session totals
    private long totalSubjects;
    private long totalSessions;

    // Individual session-status counts (kept for backwards compat)
    private long pendingSessions;
    private long scheduledSessions;
    private long startedSessions;
    private long completedSessions;
    private long cancelledSessions;

    /** sessionStatus (string) → count — convenient for charting */
    private Map<String, Long> sessionsByStatus;

    /** 10 most recently created sessions for quick inspection */
    private List<SessionDTO> recentSessions;
}
