package com.tradelab.exception;

import org.springframework.http.HttpStatus;

/** A failed login: wrong email/password (401) or a temporarily locked account (423). */
public class LoginFailedException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    public LoginFailedException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }
}
