package com.tradelab.dto;

import com.tradelab.model.AppUser;
import java.time.Instant;

/** What the API shows about a user. Never includes the password hash. */
public record UserView(Long id, String name, String email, boolean guest, Long accountId, Instant createdAt) {

    public static UserView of(AppUser user) {
        return new UserView(user.getId(), user.getName(), user.getEmail(), user.isGuest(),
                user.getAccount().getId(), user.getCreatedAt());
    }
}
