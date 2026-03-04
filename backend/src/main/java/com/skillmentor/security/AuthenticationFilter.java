package com.skillmentor.security;

import jakarta.annotation.Nonnull;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Filter that intercepts every request to validate JWT tokens.
 * Runs once per request before Spring Security's authorization checks.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AuthenticationFilter extends OncePerRequestFilter {

    private final TokenValidator tokenValidator;

    @Override
    protected void doFilterInternal(
            @Nonnull HttpServletRequest request,
            @Nonnull HttpServletResponse response,
            @Nonnull FilterChain filterChain) throws ServletException, IOException {

        try {
            // Extract token from Authorization header
            String token = extractToken(request);

            if (token != null && tokenValidator.validateToken(token)) {
                // Extract user information from token
                String userId = tokenValidator.extractUserId(token);
                String email = tokenValidator.extractEmail(token);
                String firstName = tokenValidator.extractFirstName(token);
                String lastName = tokenValidator.extractLastName(token);
                String fullName = tokenValidator.extractFullName(token);
                String imgUrl = tokenValidator.extractImageUrl(token);

                // Create UserPrincipal object
                UserPrincipal userPrincipal = UserPrincipal.builder()
                        .id(userId)
                        .email(email)
                        .firstName(firstName)
                        .lastName(lastName)
                        .fullName(fullName)
                        .imgUrl(imgUrl)
                        .build();

                // Extract roles from the token
                List<String> roles = tokenValidator.extractRoles(token);

                List<GrantedAuthority> authorities = roles != null
                        ? roles.stream()
                        .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                        .collect(Collectors.toList())
                        : new ArrayList<>();

                // Create authentication object
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userPrincipal,
                                null,
                                authorities
                        );

                authentication.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                // Set authentication in SecurityContext
                SecurityContextHolder.getContext().setAuthentication(authentication);

                log.debug("User authenticated: {} with roles: {}", userId, roles);
            }
        } catch (Exception e) {
            log.error("Cannot set user authentication: {}", e.getMessage());
        }

        // Continue filter chain
        filterChain.doFilter(request, response);
    }

    /**
     * Extracts JWT token from Authorization header
     */
    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}