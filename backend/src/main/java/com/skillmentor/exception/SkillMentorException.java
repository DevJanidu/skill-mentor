package com.skillmentor.exception;


import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class SkillMentorException extends RuntimeException {
    private final HttpStatus httpStatus;

    // constructor with message only
    public SkillMentorException(String message) {

        super(message);
        this.httpStatus = HttpStatus.BAD_REQUEST;
    }

    // constructor with message and status
    public SkillMentorException(String message, HttpStatus httpStatus)
    {
        super(message);
        this.httpStatus = httpStatus;

    }
}
