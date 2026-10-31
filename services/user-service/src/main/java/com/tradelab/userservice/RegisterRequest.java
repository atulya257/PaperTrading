package com.tradelab.userservice;

/** Body of POST /api/users. The rules are checked in UserService. */
public record RegisterRequest(String name, String email, String password) {
}
