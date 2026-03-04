package com.skillmentor.config;

import com.skillmentor.security.ClerkValidator;
import com.skillmentor.security.SkillMentorJwtValidator;
import com.skillmentor.security.TokenValidator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration to switch between different token validators.
 * Controlled by 'auth.validator.type' property in application.properties
 */
@Configuration
@Slf4j
public class ValidatorConfiguration {

    /**
     * Custom JWT validator (when auth.validator.type=stem-link)
     */
    @Bean
    @ConditionalOnProperty(name = "auth.validator.type", havingValue = "stem-link")
    public TokenValidator jwtTokenValidator(
            @Value("${jwt.secret}") String jwtSecret) {

        log.info("✅ JWT validator configured as primary TokenValidator");
        return new SkillMentorJwtValidator(jwtSecret);
    }

    /**
     * Clerk validator (when auth.validator.type=clerk or not specified)
     */
    @Bean
    @ConditionalOnProperty(name = "auth.validator.type", havingValue = "clerk", matchIfMissing = true)
    public TokenValidator clerkTokenValidator(
            @Value("${clerk.jwks.url}") String clerkJwksUrl,
            @Value("${clerk.issuer:}") String clerkIssuer,
            @Value("${clerk.audience:}") String clerkAudience) {

        log.info("✅ Clerk validator configured as primary TokenValidator");
        return new ClerkValidator(clerkJwksUrl, clerkIssuer, clerkAudience);
    }
}