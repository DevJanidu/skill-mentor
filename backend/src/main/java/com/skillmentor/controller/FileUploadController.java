package com.skillmentor.controller;

import com.skillmentor.exception.SkillMentorException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
@PreAuthorize("isAuthenticated()")
public class FileUploadController extends AbstractController {

    private static final long MAX_SIZE = 10L * 1024 * 1024; // 10 MB
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"
    );

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    @PostMapping("/receipt")
    public ResponseEntity<Map<String, String>> uploadReceipt(
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        if (file.isEmpty()) {
            throw new SkillMentorException("No file provided", HttpStatus.BAD_REQUEST);
        }
        if (file.getSize() > MAX_SIZE) {
            throw new SkillMentorException("File too large (max 10 MB)", HttpStatus.BAD_REQUEST);
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new SkillMentorException("Unsupported file type: " + contentType, HttpStatus.BAD_REQUEST);
        }

        String ext = resolveExtension(file.getOriginalFilename(), contentType);
        String filename = UUID.randomUUID() + "." + ext;

        Path dir = Path.of("uploads/receipts");
        Files.createDirectories(dir);
        file.transferTo(dir.resolve(filename));

        String url = baseUrl + "/uploads/receipts/" + filename;
        return sendOkResponse(Map.of("url", url));
    }

    private String resolveExtension(String originalFilename, String contentType) {
        if (originalFilename != null && originalFilename.contains(".")) {
            return originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase();
        }
        return switch (contentType) {
            case "image/png"       -> "png";
            case "image/webp"      -> "webp";
            case "image/gif"       -> "gif";
            case "application/pdf" -> "pdf";
            default                -> "jpg";
        };
    }
}
