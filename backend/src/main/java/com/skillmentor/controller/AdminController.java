package com.skillmentor.controller;

import com.skillmentor.dto.admin.AdminStatsDTO;
import com.skillmentor.service.AdminService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Controller")
public class AdminController extends AbstractController {

    private final AdminService adminService;

    /**
     * GET /api/admin/stats — aggregated dashboard statistics (admin only).
     */
    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDTO> getStats() {
        return sendOkResponse(adminService.getStats());
    }
}
