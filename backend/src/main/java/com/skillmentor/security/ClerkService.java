package com.skillmentor.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillmentor.entity.UserRole;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;

/**
 * Service for interacting with Clerk Admin API
 */
@Slf4j
@Service
public class ClerkService {

    @Value("${clerk.secret-key}")
    private String clerkSecretKey;

    private static final String CLERK_API_BASE_URL = "https://api.clerk.com/v1";
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

    private final OkHttpClient httpClient = new OkHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Update user's public metadata with roles
     */
    public boolean updateUserRoles(String clerkId, List<UserRole> roles) {
        try {
            log.info("Updating roles for Clerk user: {} with roles: {}", clerkId, roles);

            // Convert enum to strings
            List<String> roleStrings = roles.stream()
                    .map(Enum::name)
                    .toList();

            // Prepare request body
            Map<String, Object> publicMetadata = new HashMap<>();
            publicMetadata.put("roles", roleStrings);
            publicMetadata.put("onboarding_completed", true);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("public_metadata", publicMetadata);

            String jsonBody = objectMapper.writeValueAsString(requestBody);

            log.debug("Clerk API request body: {}", jsonBody);

            // Build HTTP request
            Request request = new Request.Builder()
                    .url(CLERK_API_BASE_URL + "/users/" + clerkId)
                    .addHeader("Authorization", "Bearer " + clerkSecretKey)
                    .addHeader("Content-Type", "application/json")
                    .patch(RequestBody.create(jsonBody, JSON))
                    .build();

            // Execute request
            try (Response response = httpClient.newCall(request).execute()) {
                if (response.isSuccessful()) {
                    log.info(" Successfully updated roles in Clerk for user: {}", clerkId);
                    return true;
                } else {
                    String errorBody = response.body() != null ? response.body().string() : "No error details";
                    log.error("Failed to update roles in Clerk. Status: {}, Error: {}",
                            response.code(), errorBody);
                    return false;
                }
            }

        } catch (IOException e) {
            log.error(" Error updating user roles in Clerk: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Get user's current roles from Clerk
     */
    @SuppressWarnings("unchecked")
    public List<UserRole> getUserRoles(String clerkId) {
        try {
            log.info("Fetching roles from Clerk for user: {}", clerkId);

            Request request = new Request.Builder()
                    .url(CLERK_API_BASE_URL + "/users/" + clerkId)
                    .addHeader("Authorization", "Bearer " + clerkSecretKey)
                    .get()
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (response.isSuccessful() && response.body() != null) {
                    String responseBody = response.body().string();
                    Map<String, Object> userData = objectMapper.readValue(responseBody, Map.class);

                    Map<String, Object> publicMetadata =
                            (Map<String, Object>) userData.get("public_metadata");

                    if (publicMetadata != null && publicMetadata.containsKey("roles")) {
                        List<String> roleStrings = (List<String>) publicMetadata.get("roles");
                        return roleStrings.stream()
                                .map(UserRole::valueOf)
                                .toList();
                    }
                }
            }

        } catch (IOException e) {
            log.error("Error fetching user roles from Clerk: {}", e.getMessage(), e);
        }

        return List.of(UserRole.USER); // Default role
    }

    /**
     * Check if user has completed onboarding in Clerk
     */
    @SuppressWarnings("unchecked")
    public boolean hasCompletedOnboarding(String clerkId) {
        try {
            Request request = new Request.Builder()
                    .url(CLERK_API_BASE_URL + "/users/" + clerkId)
                    .addHeader("Authorization", "Bearer " + clerkSecretKey)
                    .get()
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (response.isSuccessful() && response.body() != null) {
                    String responseBody = response.body().string();
                    Map<String, Object> userData = objectMapper.readValue(responseBody, Map.class);

                    Map<String, Object> publicMetadata =
                            (Map<String, Object>) userData.get("public_metadata");

                    if (publicMetadata != null) {
                        Object onboardingCompleted = publicMetadata.get("onboarding_completed");
                        return Boolean.TRUE.equals(onboardingCompleted);
                    }
                }
            }

        } catch (IOException e) {
            log.error("Error checking onboarding status: {}", e.getMessage(), e);
        }

        return false;
    }
}