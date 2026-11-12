package com.tradelab.dto;

/** Body of POST /api/auth/signup. The rules (name length, email format, password strength) are checked in AuthService. */
public record SignupRequest(String name, String email, String password) {
}
