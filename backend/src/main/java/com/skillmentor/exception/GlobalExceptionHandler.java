package com.skillmentor.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.LazyInitializationException;
import org.slf4j.MDC;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.validation.method.MethodValidationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final String MDC_REQUEST_ID_KEY = "requestId";

    /** Helper: build a consistent error response with requestId from MDC. */
    private ApiErrorResponse buildError(HttpStatus status, String message,
                                        Map<String, String> errors,
                                        HttpServletRequest request) {
        return ApiErrorResponse.builder()
                .success(false)
                .status(status.value())
                .message(message)
                .errors(errors)
                .path(request.getRequestURI())
                .timestamp(Instant.now())
                .requestId(MDC.get(MDC_REQUEST_ID_KEY))
                .build();
    }

    // ── Business / Domain Exceptions (custom errors) ─────────────────────

    @ExceptionHandler(SkillMentorException.class)
    public ResponseEntity<ApiErrorResponse> handleSkillMentorException(
            SkillMentorException ex,
            HttpServletRequest request) {

        log.warn("Business exception at {} | status={} | message={}",
                request.getRequestURI(), ex.getHttpStatus(), ex.getMessage());

        return ResponseEntity
                .status(ex.getHttpStatus())
                .body(buildError(ex.getHttpStatus(), ex.getMessage(), null, request));
    }

    // ── 403 Access Denied (Spring Security @PreAuthorize / method security) ──

    @ExceptionHandler({AccessDeniedException.class, AuthorizationDeniedException.class})
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(
            RuntimeException ex,
            HttpServletRequest request) {

        log.warn("Access denied at {} | message={}", request.getRequestURI(), ex.getMessage());

        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(buildError(HttpStatus.FORBIDDEN,
                        "Access denied – you do not have permission to perform this action",
                        null, request));
    }

    // ── DTO Validation Errors (@Valid @RequestBody) ──────────────────────

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleDtoValidationErrors(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {

        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error ->
                        fieldErrors.put(error.getField(), error.getDefaultMessage()));

        log.warn("DTO validation failed at {} | errors={}",
                request.getRequestURI(), fieldErrors);

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(buildError(HttpStatus.BAD_REQUEST, "Validation failed", fieldErrors, request));
    }

    // ── Method-level validation (@Validated on params) ───────────────────

    @ExceptionHandler(MethodValidationException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodValidationErrors(
            MethodValidationException ex,
            HttpServletRequest request) {

        log.warn("Method validation failed at {} | message={}",
                request.getRequestURI(), ex.getMessage());

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(buildError(HttpStatus.BAD_REQUEST, "Invalid request parameters",
                        Map.of("error", ex.getMessage()), request));
    }

    // ── Constraint violations (Jakarta Bean Validation) ──────────────────

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleConstraintViolation(
            ConstraintViolationException ex,
            HttpServletRequest request) {

        Map<String, String> errors = new HashMap<>();
        ex.getConstraintViolations().forEach(violation ->
                errors.put(violation.getPropertyPath().toString(), violation.getMessage()));

        log.warn("Constraint validation failed at {} | errors={}",
                request.getRequestURI(), errors);

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(buildError(HttpStatus.BAD_REQUEST, "Invalid request parameters", errors, request));
    }

    // ── Malformed JSON body ──────────────────────────────────────────────

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex,
            HttpServletRequest request) {

        log.warn("Malformed JSON at {} | message={}", request.getRequestURI(), ex.getMessage());

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(buildError(HttpStatus.BAD_REQUEST,
                        "Malformed JSON request body", null, request));
    }

    // ── 400 — Missing required query / form parameter ────────────────────

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiErrorResponse> handleMissingParam(
            MissingServletRequestParameterException ex,
            HttpServletRequest request) {

        log.warn("Missing parameter at {} | {}", request.getRequestURI(), ex.getMessage());

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(buildError(HttpStatus.BAD_REQUEST,
                        "Required parameter '" + ex.getParameterName() + "' is missing",
                        Map.of(ex.getParameterName(), "must not be null"), request));
    }

    // ── 400 — Path variable / query-param type mismatch (/sessions/abc) ──

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiErrorResponse> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex,
            HttpServletRequest request) {

        String expected = ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "unknown";
        String msg = "Parameter '" + ex.getName() + "' must be of type " + expected;

        log.warn("Type mismatch at {} | {}", request.getRequestURI(), msg);

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(buildError(HttpStatus.BAD_REQUEST, msg,
                        Map.of(ex.getName(), msg), request));
    }

    // ── 404 — No static resource / unmapped route ─────────────────────

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNoResource(
            NoResourceFoundException ex,
            HttpServletRequest request) {

        log.debug("Route not found: {} {}", request.getMethod(), request.getRequestURI());

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(buildError(HttpStatus.NOT_FOUND,
                        "No endpoint found for " + request.getMethod() + " " + request.getRequestURI(),
                        null, request));
    }

    // ── Database constraint / unique key violations ──────────────────────

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleDataIntegrityViolation(
            DataIntegrityViolationException ex,
            HttpServletRequest request) {

        log.warn("Data integrity violation at {}", request.getRequestURI(), ex);

        String method = request.getMethod();
        String message;
        if ("DELETE".equalsIgnoreCase(method)) {
            message = "Cannot delete this record because it is linked to other data. Please remove the related records first.";
        } else {
            message = "This action could not be completed because it conflicts with existing data. A duplicate entry may already exist.";
        }

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(buildError(HttpStatus.CONFLICT, message, null, request));
    }

    // ── 500 — LazyInitializationException safety net (should not happen) ─

    @ExceptionHandler(LazyInitializationException.class)
    public ResponseEntity<ApiErrorResponse> handleLazyInit(
            LazyInitializationException ex,
            HttpServletRequest request) {

        log.error("LazyInitializationException at {} — check @Transactional on service method",
                request.getRequestURI(), ex);

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildError(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Internal server error — please try again", null, request));
    }

    // ── Fallback — REAL server bugs only ─────────────────────────────────

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnhandledException(
            Exception ex,
            HttpServletRequest request) {

        log.error("Unhandled exception at {}", request.getRequestURI(), ex);

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildError(HttpStatus.INTERNAL_SERVER_ERROR,
                        "An unexpected error occurred. Please try again later.", null, request));
    }
}
