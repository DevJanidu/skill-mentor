package com.skillmentor.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/public/health")
@RequiredArgsConstructor
@Tag(name = "Health", description = "Application health check endpoints")
public class HealthController extends AbstractController {

    private final DataSource dataSource;
    private final RedisConnectionFactory redisConnectionFactory;

    /**
     * Quick ping — used by Railway/Docker to verify the container is running.
     * GET /api/public/health
     */
    @GetMapping
    @Operation(summary = "Basic liveness check")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "UP");
        result.put("timestamp", Instant.now().toString());
        return sendOkResponse(result);
    }

    /**
     * Deep health check — verifies Database and Redis connectivity.
     * GET /api/public/health/full
     */
    @GetMapping("/full")
    @Operation(summary = "Deep health check (DB + Redis)")
    public ResponseEntity<Map<String, Object>> fullHealth() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("timestamp", Instant.now().toString());

        // --- Database ping ---
        String dbStatus;
        try (Connection conn = dataSource.getConnection()) {
            boolean valid = conn.isValid(2);
            dbStatus = valid ? "UP" : "DOWN";
        } catch (Exception ex) {
            log.warn("Health check: database unreachable — {}", ex.getMessage());
            dbStatus = "DOWN";
        }
        result.put("database", dbStatus);

        // --- Redis ping ---
        String redisStatus;
        try {
            var conn = redisConnectionFactory.getConnection();
            conn.ping();
            conn.close();
            redisStatus = "UP";
        } catch (Exception ex) {
            log.warn("Health check: Redis unreachable — {}", ex.getMessage());
            redisStatus = "DOWN";
        }
        result.put("redis", redisStatus);

        // Overall status
        boolean allUp = "UP".equals(dbStatus) && "UP".equals(redisStatus);
        result.put("status", allUp ? "UP" : "DEGRADED");

        // Return 200 even when degraded so Railway doesn't restart the container
        // purely because Redis is temporarily unavailable.
        return sendOkResponse(result);
    }
}
