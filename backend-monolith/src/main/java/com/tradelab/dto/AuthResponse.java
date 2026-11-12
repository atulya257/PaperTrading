package com.tradelab.dto;

import java.time.Instant;

/** Returned after signup or login: the token to send as "Authorization: Bearer ..." and who it belongs to. */
public record AuthResponse(String token, Instant expiresAt, UserView user) {
}
