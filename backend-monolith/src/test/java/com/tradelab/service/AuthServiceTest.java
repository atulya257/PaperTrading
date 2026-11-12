package com.tradelab.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.tradelab.dto.AuthResponse;
import com.tradelab.dto.LoginRequest;
import com.tradelab.dto.SignupRequest;
import com.tradelab.exception.BusinessRuleException;
import com.tradelab.exception.LoginFailedException;
import com.tradelab.model.AppUser;
import com.tradelab.repository.AppUserRepository;
import com.tradelab.repository.LoginAttemptRepository;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

/** Tests the signup, password and login-lockout rules in AuthService against the real database. */
@SpringBootTest
@Transactional
class AuthServiceTest {

    private static final String PASSWORD = "Secret123";

    @Autowired
    private AuthService authService;

    @Autowired
    private AppUserRepository appUserRepository;

    @Autowired
    private LoginAttemptRepository loginAttemptRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void signupCreatesUserWithHashedPasswordAndOwnAccount() {
        AuthResponse response = authService.signup(new SignupRequest("Atulya", "Atulya@Example.com", PASSWORD));

        assertThat(response.token()).isNotBlank();
        assertThat(response.user().email()).isEqualTo("atulya@example.com");
        AppUser saved = appUserRepository.findByEmail("atulya@example.com").orElseThrow();
        assertThat(saved.getPasswordHash()).isNotEqualTo(PASSWORD).startsWith("$2");
        assertThat(passwordEncoder.matches(PASSWORD, saved.getPasswordHash())).isTrue();
        assertThat(saved.getAccount().getCash()).isEqualByComparingTo(new BigDecimal("1000000.00"));
    }

    @Test
    void sameEmailCannotSignUpTwice() {
        authService.signup(new SignupRequest("Atulya", "twice@example.com", PASSWORD));

        assertThatThrownBy(() -> authService.signup(new SignupRequest("Other", "TWICE@example.com", PASSWORD)))
                .isInstanceOf(BusinessRuleException.class)
                .extracting("code").isEqualTo("EMAIL_TAKEN");
    }

    @Test
    void weakPasswordsAreRejected() {
        for (String weak : new String[] {"short1", "onlyletters", "12345678"}) {
            assertThatThrownBy(() -> authService.signup(new SignupRequest("Atulya", "weak@example.com", weak)))
                    .isInstanceOf(BusinessRuleException.class)
                    .extracting("code").isEqualTo("WEAK_PASSWORD");
        }
    }

    @Test
    void correctPasswordLogsInAndWrongPasswordIsRejected() {
        authService.signup(new SignupRequest("Atulya", "login@example.com", PASSWORD));

        assertThat(authService.login(new LoginRequest("login@example.com", PASSWORD)).token()).isNotBlank();
        assertThatThrownBy(() -> authService.login(new LoginRequest("login@example.com", "Wrong1234")))
                .isInstanceOf(LoginFailedException.class)
                .extracting("code").isEqualTo("INVALID_CREDENTIALS");
        assertThat(loginAttemptRepository.findByEmailOrderByAttemptedAtDesc("login@example.com"))
                .extracting("successful").containsExactly(false, true);
    }

    @Test
    void fiveWrongPasswordsLockTheAccountEvenForTheRightPassword() {
        authService.signup(new SignupRequest("Atulya", "lock@example.com", PASSWORD));

        for (int i = 1; i <= 4; i++) {
            assertThatThrownBy(() -> authService.login(new LoginRequest("lock@example.com", "Wrong1234")))
                    .extracting("code").isEqualTo("INVALID_CREDENTIALS");
        }
        assertThatThrownBy(() -> authService.login(new LoginRequest("lock@example.com", "Wrong1234")))
                .isInstanceOf(LoginFailedException.class)
                .extracting("code", "status").containsExactly("ACCOUNT_LOCKED", HttpStatus.LOCKED);

        assertThatThrownBy(() -> authService.login(new LoginRequest("lock@example.com", PASSWORD)))
                .extracting("code").isEqualTo("ACCOUNT_LOCKED");
        assertThat(appUserRepository.findByEmail("lock@example.com").orElseThrow().getLockedUntil()).isNotNull();
    }
}
