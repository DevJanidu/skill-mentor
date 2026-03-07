package com.skillmentor.config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.net.URI;
import java.net.URISyntaxException;

/**
 * Configures the Cloudinary SDK bean.
 *
 * Priority:
 *   1. cloudinary.url  (from CLOUDINARY_URL env var)  — format: cloudinary://api_key:api_secret@cloud_name
 *   2. Individual properties: cloudinary.cloud-name / cloudinary.api-key / cloudinary.api-secret
 *
 * Safe startup validation:
 *   - cloud_name must match [a-z0-9_-]+
 *   - api_key must be numeric
 *   - api_secret must be non-empty
 *   - Secrets are NEVER logged
 */
@Slf4j
@Configuration
public class CloudinaryConfig {

    @Value("${cloudinary.url:}")
    private String cloudinaryUrl;

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-key:}")
    private String apiKey;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

    @Bean
    public Cloudinary cloudinary() {
        String url = trim(cloudinaryUrl);

        if (!url.isBlank()) {
            return buildFromUrl(url);
        }

        return buildFromIndividualVars(
                trim(cloudName),
                trim(apiKey),
                trim(apiSecret)
        );
    }

    // ── Builders ────────────────────────────────────────────────────────

    private Cloudinary buildFromUrl(String url) {
        log.info("[Cloudinary] Configuring from CLOUDINARY_URL");
        try {
            URI uri = new URI(url);
            String cn = uri.getHost() != null ? uri.getHost().trim() : "";
            String userInfo = uri.getUserInfo() != null ? uri.getUserInfo() : "";
            String ak = userInfo.contains(":") ? userInfo.split(":", 2)[0].trim() : userInfo.trim();
            boolean hasSecret = userInfo.contains(":") && userInfo.split(":", 2).length > 1
                    && !userInfo.split(":", 2)[1].isBlank();

            validate(cn, ak, hasSecret);
            log.info("[Cloudinary] cloud_name='{}' | api_key_present={} | api_secret_present={}",
                    cn, !ak.isBlank(), hasSecret);

            // Use SDK's built-in URL parser
            return new Cloudinary(url);
        } catch (URISyntaxException e) {
            throw new IllegalStateException(
                    "[Cloudinary] CLOUDINARY_URL is malformed — " + e.getMessage(), e);
        }
    }

    private Cloudinary buildFromIndividualVars(String cn, String ak, String as) {
        log.info("[Cloudinary] Configuring from individual properties (cloud_name='{}', " +
                "api_key_present={}, api_secret_present={})", cn, !ak.isBlank(), !as.isBlank());

        validate(cn, ak, !as.isBlank());

        return new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cn,
                "api_key",    ak,
                "api_secret", as,
                "secure",     true
        ));
    }

    // ── Validation ──────────────────────────────────────────────────────

    private void validate(String cloudName, String apiKey, boolean hasSecret) {
        if (cloudName.isBlank()) {
            throw new IllegalStateException(
                    "[Cloudinary] Config error: cloud_name is blank. " +
                    "Set CLOUDINARY_CLOUD_NAME or CLOUDINARY_URL env var.");
        }
        if (!cloudName.matches("[a-z0-9_-]+")) {
            throw new IllegalStateException(
                    "[Cloudinary] Config error: cloud_name '" + cloudName +
                    "' contains invalid characters (must match [a-z0-9_-]+). " +
                    "Check for hidden whitespace or uppercase letters.");
        }
        if (apiKey.isBlank()) {
            throw new IllegalStateException(
                    "[Cloudinary] Config error: api_key is blank.");
        }
        if (!apiKey.matches("\\d+")) {
            throw new IllegalStateException(
                    "[Cloudinary] Config error: api_key '" + apiKey +
                    "' is not numeric — check for trailing whitespace or wrong value.");
        }
        if (!hasSecret) {
            throw new IllegalStateException(
                    "[Cloudinary] Config error: api_secret is missing or blank.");
        }
    }

    // ── Helpers ─────────────────────────────────────────────────────────

    private String trim(String value) {
        return value == null ? "" : value.strip(); // strip() removes unicode whitespace too
    }
}
