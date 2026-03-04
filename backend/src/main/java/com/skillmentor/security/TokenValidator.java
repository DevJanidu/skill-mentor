package com.skillmentor.security;

import java.util.List;


public interface TokenValidator {
    boolean validateToken(String token);
    String extractUserId(String token);
    List<String> extractRoles(String token);
    String extractFullName(String token);
    String extractFirstName(String token);
    String extractLastName(String token);
    String extractImageUrl(String token);
    String extractEmail(String token);
}
