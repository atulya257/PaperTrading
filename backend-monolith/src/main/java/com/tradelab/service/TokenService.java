package com.tradelab.service;

import com.tradelab.dto.AuthResponse;
import com.tradelab.dto.UserView;
import com.tradelab.model.AppUser;
import java.time.Duration;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

/** Creates the signed token (JWT) a user gets after logging in. The token's subject is the user's email. */
@Service
public class TokenService {

    private final JwtEncoder jwtEncoder;
    private final Duration lifetime;

    public TokenService(JwtEncoder jwtEncoder, @Value("${tradelab.jwt.expiry-minutes:120}") long expiryMinutes) {
        this.jwtEncoder = jwtEncoder;
        this.lifetime = Duration.ofMinutes(expiryMinutes);
    }

    public AuthResponse issue(AppUser user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(lifetime);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("tradelab")
                .subject(user.getEmail())
                .issuedAt(now)
                .expiresAt(expiresAt)
                .claim("name", user.getName())
                .claim("accountId", user.getAccount().getId())
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new AuthResponse(token, expiresAt, UserView.of(user));
    }
}
