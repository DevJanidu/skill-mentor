package com.skillmentor.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.RSASSAVerifier;
import com.nimbusds.jose.jwk.JWK;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.extern.slf4j.Slf4j;

import java.net.URL;
import java.util.Date;
import java.util.List;



@Slf4j
public class ClerkValidator implements TokenValidator {

    private final String jwksUrl;
    private final String issuer;   // e.g. https://gentle-lamb-93.clerk.accounts.dev
    private final String audience; // e.g. skill-mentor
    private JWKSet jwkSet;
    private long lastFetchTime = 0;
    private static final long CACHE_DURATION = 3600000;
    private static final ObjectMapper mapper = new ObjectMapper();

    public ClerkValidator(String jwksUrl, String issuer, String audience) {
        this.jwksUrl = jwksUrl;
        this.issuer = issuer;
        this.audience = audience;
        log.info("Clerk Validator initialized with JWKS URL: {}, issuer: {}, audience: {}",
                jwksUrl, issuer, audience);
    }

    private JWKSet getJWKSet() {
        try {
            long currentTime = System.currentTimeMillis();

            // Refresh cache if expired or not yet loaded
            if (jwkSet == null || (currentTime - lastFetchTime) > CACHE_DURATION) {
                log.info("Fetching JWKS from Clerk: {}", jwksUrl);
                jwkSet = JWKSet.load(new URL(jwksUrl));
                lastFetchTime = currentTime;
                log.info("JWKS successfully fetched and cached");
            }

            return jwkSet;
        } catch (Exception e) {
            log.error("Failed to fetch JWKS from Clerk: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch JWKS", e);
        }
    }


    @Override
    public boolean validateToken(String token) {
        try {
            // Parse the JWT
            SignedJWT signedJWT = SignedJWT.parse(token);

            // Get the key ID from the token header
            String kid = signedJWT.getHeader().getKeyID();

            if (kid == null) {
                log.error("Token does not contain a key ID (kid)");
                return false;
            }

            // Get the JWK Set and find the matching key
            JWKSet jwkSet = getJWKSet();
            JWK jwk = jwkSet.getKeyByKeyId(kid);

            if (jwk == null) {
                log.error("No matching key found for kid: {}", kid);
                return false;
            }

            // Create a verifier using the RSA public key
            RSAKey rsaKey = jwk.toRSAKey();
            JWSVerifier verifier = new RSASSAVerifier(rsaKey);

            // Verify the signature
            if (!signedJWT.verify(verifier)) {
                log.error("JWT signature verification failed");
                return false;
            }

            JWTClaimsSet claims = signedJWT.getJWTClaimsSet();

            // Check expiration
            Date expirationTime = claims.getExpirationTime();
            if (expirationTime != null && expirationTime.before(new Date())) {
                log.error("JWT token has expired");
                return false;
            }

            // Validate issuer
            if (issuer != null && !issuer.isBlank()) {
                String tokenIssuer = claims.getIssuer();
                if (tokenIssuer == null || !tokenIssuer.equals(issuer)) {
                    log.error("JWT issuer mismatch. Expected: {}, Got: {}", issuer, tokenIssuer);
                    return false;
                }
            }

            // Validate audience
            if (audience != null && !audience.isBlank()) {
                List<String> tokenAudience = claims.getAudience();
                if (tokenAudience == null || !tokenAudience.contains(audience)) {
                    log.error("JWT audience mismatch. Expected: {}, Got: {}", audience, tokenAudience);
                    return false;
                }
            }

            log.debug("Token validated successfully for user: {}", claims.getSubject());
            return true;

        } catch (Exception e) {
            log.error("Token validation failed: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public String extractUserId(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            return signedJWT.getJWTClaimsSet().getSubject();
        } catch (Exception e) {
            log.error("Failed to extract user ID: {}", e.getMessage());
            return null;
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<String> extractRoles(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);

            Object rolesObj = signedJWT.getJWTClaimsSet().getClaim("roles");
            log.debug("Raw roles claim: {} (type: {})", rolesObj,
                    rolesObj != null ? rolesObj.getClass().getName() : "null");

            // Case 1: roles is already a List (e.g. ["USER", "ADMIN"])
            if (rolesObj instanceof List) {
                List<String> roles = (List<String>) rolesObj;
                log.debug("Extracted roles (list): {}", roles);
                return !roles.isEmpty() ? roles : List.of("USER");
            }

            // Case 2: roles is a String — Clerk JWT templates render arrays as
            // a JSON-encoded string like "[\"USER\"]" or a comma-separated string "USER,ADMIN"
            if (rolesObj instanceof String) {
                String rolesStr = ((String) rolesObj).trim();
                log.debug("Roles claim is a string: {}", rolesStr);

                // Try JSON array first
                if (rolesStr.startsWith("[")) {
                    try {
                        List<String> parsed = mapper.readValue(rolesStr, new TypeReference<List<String>>() {});
                        if (!parsed.isEmpty()) {
                            log.debug("Parsed roles from JSON string: {}", parsed);
                            return parsed;
                        }
                    } catch (Exception ex) {
                        log.warn("Failed to parse roles JSON string: {}", rolesStr);
                    }
                }

                // Fallback: comma-separated
                if (!rolesStr.isEmpty() && !rolesStr.equals("[]")) {
                    List<String> split = List.of(rolesStr.replace("[", "")
                            .replace("]", "").replace("\"", "").split(","));
                    List<String> trimmed = split.stream()
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .toList();
                    if (!trimmed.isEmpty()) {
                        log.debug("Parsed roles from comma string: {}", trimmed);
                        return trimmed;
                    }
                }
            }

            log.warn("No roles found in token, returning default USER role");
            return List.of("USER");

        } catch (Exception e) {
            log.error("Failed to extract roles: {}", e.getMessage(), e);
            return List.of("USER");
        }
    }

    @Override
    public String extractFullName(String token) {

        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            Object fullName = signedJWT.getJWTClaimsSet().getClaim("full_name");
            return fullName != null ? fullName.toString() : null;
        } catch (Exception e) {
            log.error("Failed to extract Full name: {}", e.getMessage());
            return null;
        }
    }

    @Override
    public String extractFirstName(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            Object firstName = signedJWT.getJWTClaimsSet().getClaim("first_name");
            return firstName != null ? firstName.toString() : null;
        } catch (Exception e) {
            log.error("Failed to extract first name: {}", e.getMessage());
            return null;
        }
    }

    @Override
    public String extractLastName(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            Object lastName = signedJWT.getJWTClaimsSet().getClaim("last_name");
            return lastName != null ? lastName.toString() : null;
        } catch (Exception e) {
            log.error("Failed to extract last name: {}", e.getMessage());
            return null;
        }
    }

    @Override
    public String extractImageUrl(String token) {
        try{
            SignedJWT signedJWT = SignedJWT.parse(token);
            Object imgUrl = signedJWT.getJWTClaimsSet().getClaim("image_url");
            log.debug("Extracted img {}",imgUrl);;
            return imgUrl != null ? imgUrl.toString() : null;
        }catch (Exception e){
            log.error("failed to extract the image url {} ",e.getMessage());
            return null;
        }

    }

    @Override
    public String extractEmail(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            Object email = signedJWT.getJWTClaimsSet().getClaim("email");
            return email != null ? email.toString() : null;
        } catch (Exception e) {
            log.error("Failed to extract email: {}", e.getMessage());
            return null;
        }
    }
}
