package com.skillmentor.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.skillmentor.exception.SkillMentorException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

/**
 * Uploads files to Cloudinary using the official Java SDK.
 * SDK is configured via CloudinaryConfig at startup — credentials are validated before first use.
 *
 * Folder conventions:
 *   subjects  → skillmentor/subjects
 *   receipts  → skillmentor/receipts
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private static final long   MAX_BYTES      = 5L * 1024 * 1024; // 5 MB
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"
    );

    private final Cloudinary cloudinary;

    /**
     * Upload a file to Cloudinary.
     *
     * @param file   multipart file from the HTTP request
     * @param folder logical folder name, e.g. "subjects" or "receipts"
     * @return the {@code secure_url} of the uploaded asset
     */
    public String uploadUnsigned(MultipartFile file, String folder) {
        validateFile(file);

        String targetFolder = "skillmentor/" + folder;
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder",          targetFolder,
                            "resource_type",   "image",
                            "use_filename",    false,
                            "unique_filename", true
                    )
            );

            String secureUrl = (String) result.get("secure_url");
            if (secureUrl == null || secureUrl.isBlank()) {
                log.error("[Cloudinary] Upload succeeded but secure_url missing. Response: {}", result);
                throw new SkillMentorException("Cloudinary did not return a URL", HttpStatus.BAD_GATEWAY);
            }

            log.info("[Cloudinary] Upload OK — folder='{}', url='{}'", targetFolder, secureUrl);
            return secureUrl;

        } catch (SkillMentorException e) {
            throw e; // re-throw our own typed exceptions
        } catch (IOException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            log.error("[Cloudinary] Upload failed: {}", msg);

            if (msg.contains("Invalid API key") || msg.contains("401") || msg.contains("cloud_name")) {
                throw new SkillMentorException(
                        "Cloudinary auth failed — check cloud name and API keys",
                        HttpStatus.BAD_GATEWAY);
            }
            throw new SkillMentorException(
                    "File upload failed: " + msg,
                    HttpStatus.BAD_GATEWAY);
        }
    }

    // ── Validation ─────────────────────────────────────────────────────

    private void validateFile(MultipartFile file) {
        
        if (file == null || file.isEmpty()) {
            throw new SkillMentorException("Upload file must not be empty", HttpStatus.BAD_REQUEST);
        }

        if (file.getSize() > MAX_BYTES) {
            throw new SkillMentorException(
                    "File size exceeds the 5 MB limit (received: "
                            + (file.getSize() / 1024 / 1024) + " MB)",
                    HttpStatus.BAD_REQUEST);
        }
        
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw new SkillMentorException(
                    "Unsupported file type '" + contentType + "'. Allowed: jpeg, png, webp, gif, svg",
                    HttpStatus.UNSUPPORTED_MEDIA_TYPE);
        }
    }
}
