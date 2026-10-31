package com.tradelab.exception;

/** Thrown by the Service layer when a request breaks a business rule. Mapped to HTTP 400. */
public class BusinessRuleException extends RuntimeException {

    private final String code;
    /** The request field the error is about (e.g. "password"), so a form can highlight it. May be null. */
    private final String field;

    public BusinessRuleException(String code, String message) {
        this(code, null, message);
    }

    public BusinessRuleException(String code, String field, String message) {
        super(message);
        this.code = code;
        this.field = field;
    }

    public String getCode() {
        return code;
    }

    public String getField() {
        return field;
    }
}
