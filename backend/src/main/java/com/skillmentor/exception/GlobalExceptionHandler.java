package com.skillmentor.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.method.MethodValidationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {


    // Business / Domain Exceptions (Your custom errors)
    @ExceptionHandler(SkillMentorException.class)
    public ResponseEntity<ApiErrorResponse> handleSkillMentorException(
            SkillMentorException ex,
            HttpServletRequest request
    ) {

        log.warn(
                "Business exception at {} | status={} | message={}",
                request.getRequestURI(),
                ex.getHttpStatus(),
                ex.getMessage()
        );

        ApiErrorResponse response = ApiErrorResponse.builder()
                .success(false)
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .timestamp(Instant.now())
                .build();

        return ResponseEntity
                .status(ex.getHttpStatus())
                .body(response);
    }


    //  DTO Validation Errors (@Valid @RequestBody)

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleDtoValidationErrors(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {

        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error ->
                        fieldErrors.put(
                                error.getField(),
                                error.getDefaultMessage()
                        )
                );

        log.warn(
                "DTO validation failed at {} | errors={}",
                request.getRequestURI(),
                fieldErrors
        );

        ApiErrorResponse response = ApiErrorResponse.builder()
                .success(false)
                .message("Validation failed")
                .errors(fieldErrors)
                .path(request.getRequestURI())
                .timestamp(Instant.now())
                .build();

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }


    //       Method-level validation (@Validated on params)

    @ExceptionHandler(MethodValidationException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodValidationErrors(
            MethodValidationException ex,
            HttpServletRequest request
    ) {

        log.warn(
                "Method validation failed at {} | message={}",
                request.getRequestURI(),
                ex.getMessage()
        );

        ApiErrorResponse response = ApiErrorResponse.builder()
                .success(false)
                .message("Invalid request parameters")
                .errors(Map.of("error", ex.getMessage()))
                .path(request.getRequestURI())
                .timestamp(Instant.now())
                .build();

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleConstraintViolation(
            ConstraintViolationException ex,
            HttpServletRequest request
    ) {
        Map<String, String> errors = new HashMap<>();

        ex.getConstraintViolations().forEach(violation ->
                errors.put(
                        violation.getPropertyPath().toString(),
                        violation.getMessage()
                )
        );

        log.warn(
                "Constraint validation failed at {} | errors={}",
                request.getRequestURI(),
                errors
        );

        ApiErrorResponse response = ApiErrorResponse.builder()
                .success(false)
                .message("Invalid request parameters")
                .errors(errors)
                .path(request.getRequestURI())
                .timestamp(Instant.now())
                .build();

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }


    //    Database constraint / unique key violations

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleDataIntegrityViolation(
            DataIntegrityViolationException ex,
            HttpServletRequest request
    ) {

        log.warn(
                "Data integrity violation at {}",
                request.getRequestURI(),
                ex
        );

        ApiErrorResponse response = ApiErrorResponse.builder()
                .success(false)
                .message("Invalid request data (constraint violation)")
                .path(request.getRequestURI())
                .timestamp(Instant.now())
                .build();

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }


        // Fallback — REAL server bugs only

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnhandledException(
            Exception ex,
            HttpServletRequest request
    ) {

        log.error(
                "Unhandled exception at {}",
                request.getRequestURI(),
                ex
        );

        ApiErrorResponse response = ApiErrorResponse.builder()
                .success(false)
                .message("Internal server error")
                .path(request.getRequestURI())
                .timestamp(Instant.now())
                .build();

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(response);
    }
}
