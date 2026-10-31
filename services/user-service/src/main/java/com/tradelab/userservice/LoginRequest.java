package com.tradelab.userservice;

/** Body of POST /api/users/login. */
public record LoginRequest(String email, String password) {
}
