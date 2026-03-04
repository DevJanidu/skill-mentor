package com.skillmentor.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;

import javax.crypto.SecretKey;
import java.util.List;

/**
 * Validates custom JWT tokens signed with HMAC secret.
 * Used when you want to issue your own tokens instead of using Clerk.
 */
@Slf4j
public class SkillMentorJwtValidator implements TokenValidator {

    private final String secretKey;

    public SkillMentorJwtValidator(String secretKey) {
        this.secretKey = secretKey;
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes());
    }

    @Override
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            log.error("Failed to validate JWT token: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public String extractUserId(String token) {
        return getClaims(token).getSubject();
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<String> extractRoles(String token) {
        return (List<String>) getClaims(token).get("roles", List.class);
    }

    @Override
    public String extractFullName(String token) {
        return getClaims(token).get("fullName",String.class);
    }

    @Override
    public String extractFirstName(String token) {
        return getClaims(token).get("firstName", String.class);
    }

    @Override
    public String extractLastName(String token) {
        return getClaims(token).get("lastName", String.class);
    }

    @Override
    public String extractImageUrl(String token) {
        return getClaims(token).get("imgUrl",String.class);
    }


    @Override
    public String extractEmail(String token) {
        return getClaims(token).get("email", String.class);
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
