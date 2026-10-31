package com.tradelab.controller;

import com.tradelab.dto.AuthResponse;
import com.tradelab.dto.LoginRequest;
import com.tradelab.dto.SignupRequest;
import com.tradelab.dto.UserView;
import com.tradelab.model.LoginAttempt;
import com.tradelab.service.AuthService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Sign up, log in and "who am I". Only passes requests to AuthService. */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse signup(@RequestBody SignupRequest request) {
        return authService.signup(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/guest")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse guest() {
        return authService.guest();
    }

    /** The token's subject is the user's email. */
    @GetMapping("/me")
    public UserView me(@AuthenticationPrincipal Jwt jwt) {
        return authService.me(jwt.getSubject());
    }

    @GetMapping("/me/login-attempts")
    public List<LoginAttempt> myLoginAttempts(@AuthenticationPrincipal Jwt jwt) {
        return authService.loginHistory(jwt.getSubject());
    }
}
