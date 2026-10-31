package com.tradelab.userservice;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * A request that breaks a rule of the User Service. The handler below turns it into JSON:
 * {"code": "...", "field": "...", "message": "..."} so the React forms can show it under the right input.
 */
public class UserException extends RuntimeException {

    private final HttpStatus status;
    private final String code;
    private final String field;

    public UserException(HttpStatus status, String code, String field, String message) {
        super(message);
        this.status = status;
        this.code = code;
        this.field = field;
    }

    public HttpStatus getStatus() { return status; }
    public String getCode() { return code; }
    public String getField() { return field; }

    @RestControllerAdvice
    static class Handler {

        @ExceptionHandler(UserException.class)
        ResponseEntity<Map<String, String>> handle(UserException e) {
            Map<String, String> body = new LinkedHashMap<>();
            body.put("code", e.getCode());
            if (e.getField() != null) {
                body.put("field", e.getField());
            }
            body.put("message", e.getMessage());
            return ResponseEntity.status(e.getStatus()).body(body);
        }
    }
}
