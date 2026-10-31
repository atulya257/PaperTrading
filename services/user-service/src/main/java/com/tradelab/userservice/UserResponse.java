package com.tradelab.userservice;

import java.time.Instant;

/** What the API returns about a user. It never contains the password or its hash. */
public record UserResponse(Long id, String name, String email, Instant createdAt) {

    public static UserResponse of(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getCreatedAt());
    }
}
