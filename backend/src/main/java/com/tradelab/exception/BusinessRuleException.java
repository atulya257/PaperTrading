package com.tradelab.exception;

/** Thrown by the Service layer when a request breaks a business rule. Mapped to HTTP 400. */
public class BusinessRuleException extends RuntimeException {

    private final String code;

    public BusinessRuleException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
