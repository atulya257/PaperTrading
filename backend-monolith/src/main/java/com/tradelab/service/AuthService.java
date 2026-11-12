package com.tradelab.service;

import com.tradelab.config.DataSeeder;
import com.tradelab.dto.AuthResponse;
import com.tradelab.dto.LoginRequest;
import com.tradelab.dto.SignupRequest;
import com.tradelab.dto.UserView;
import com.tradelab.exception.BusinessRuleException;
import com.tradelab.exception.LoginFailedException;
import com.tradelab.exception.NotFoundException;
import com.tradelab.model.Account;
import com.tradelab.model.AppUser;
import com.tradelab.model.LoginAttempt;
import com.tradelab.repository.AccountRepository;
import com.tradelab.repository.AppUserRepository;
import com.tradelab.repository.LoginAttemptRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Business layer for users. Rules:
 * <ol>
 *   <li>Name 2-40 characters, a valid email, and an email can only be registered once.</li>
 *   <li>Password at least 8 characters with at least one letter and one digit (stored only as a BCrypt hash).</li>
 *   <li>Every login attempt is recorded. After {@code maxFailedLogins} wrong passwords within the lock window,
 *       the account is locked for {@code lockDuration}, even if the right password is then used.</li>
 *   <li>Each new user gets their own trading account with the starting capital.</li>
 * </ol>
 */
@Service
public class AuthService {

    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern HAS_LETTER = Pattern.compile("[A-Za-z]");
    private static final Pattern HAS_DIGIT = Pattern.compile("[0-9]");
    static final int NAME_MIN = 2;
    static final int NAME_MAX = 40;
    static final int PASSWORD_MIN = 8;
    static final int PASSWORD_MAX = 72; // BCrypt only uses the first 72 bytes

    private final AppUserRepository appUserRepository;
    private final AccountRepository accountRepository;
    private final LoginAttemptRepository loginAttemptRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;
    private final int maxFailedLogins;
    private final Duration lockDuration;

    public AuthService(AppUserRepository appUserRepository, AccountRepository accountRepository,
                       LoginAttemptRepository loginAttemptRepository, PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager, TokenService tokenService,
                       @Value("${tradelab.security.max-failed-logins:5}") int maxFailedLogins,
                       @Value("${tradelab.security.lock-minutes:15}") long lockMinutes) {
        this.appUserRepository = appUserRepository;
        this.accountRepository = accountRepository;
        this.loginAttemptRepository = loginAttemptRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenService = tokenService;
        this.maxFailedLogins = maxFailedLogins;
        this.lockDuration = Duration.ofMinutes(lockMinutes);
    }

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        String name = request.name() == null ? "" : request.name().trim().replaceAll("\\s+", " ");
        String email = normalizeEmail(request.email());
        String password = request.password() == null ? "" : request.password();

        if (name.length() < NAME_MIN || name.length() > NAME_MAX) {
            throw new BusinessRuleException("INVALID_NAME", "name",
                    "Enter a name between " + NAME_MIN + " and " + NAME_MAX + " characters.");
        }
        if (!EMAIL.matcher(email).matches()) {
            throw new BusinessRuleException("INVALID_EMAIL", "email", "Enter a valid email address, like you@example.com.");
        }
        checkPasswordStrength(password);
        if (appUserRepository.existsByEmail(email)) {
            throw new BusinessRuleException("EMAIL_TAKEN", "email", "An account with this email already exists. Log in instead.");
        }

        Account account = accountRepository.save(new Account(name, DataSeeder.INITIAL_CAPITAL));
        AppUser user = appUserRepository.save(new AppUser(email, name, passwordEncoder.encode(password), false, account));
        return tokenService.issue(user);
    }

    /** "Try demo instantly": a throwaway user with its own account and a random password nobody knows. */
    @Transactional
    public AuthResponse guest() {
        String email = "guest-" + UUID.randomUUID().toString().substring(0, 8) + "@guest.tradelab";
        Account account = accountRepository.save(new Account("Guest", DataSeeder.INITIAL_CAPITAL));
        String randomPassword = UUID.randomUUID().toString();
        AppUser user = appUserRepository.save(new AppUser(email, "Guest", passwordEncoder.encode(randomPassword), true, account));
        return tokenService.issue(user);
    }

    /**
     * Not @Transactional on purpose: each attempt must stay saved even when the login fails with an exception.
     */
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        String password = request.password() == null ? "" : request.password();
        if (email.isEmpty() || password.isEmpty()) {
            throw new BusinessRuleException("INVALID_REQUEST", email.isEmpty() ? "email" : "password",
                    "Enter your email and password.");
        }

        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, password));
        } catch (LockedException e) {
            loginAttemptRepository.save(new LoginAttempt(email, false));
            throw locked(appUserRepository.findByEmail(email).map(AppUser::getLockedUntil).orElse(null));
        } catch (BadCredentialsException e) {
            loginAttemptRepository.save(new LoginAttempt(email, false));
            AppUser user = appUserRepository.findByEmail(email).orElse(null);
            if (user != null && failedAttemptsSinceLastReset(user) >= maxFailedLogins) {
                user.setLockedUntil(Instant.now().plus(lockDuration));
                appUserRepository.save(user);
                throw locked(user.getLockedUntil());
            }
            // Same message whether the email exists or not, so the API doesn't reveal who has an account.
            throw new LoginFailedException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Email or password is incorrect.");
        }

        loginAttemptRepository.save(new LoginAttempt(email, true));
        AppUser user = appUserRepository.findByEmail(email).orElseThrow();
        if (user.getLockedUntil() != null) {
            user.setLockedUntil(null);
            appUserRepository.save(user);
        }
        return tokenService.issue(user);
    }

    public UserView me(String email) {
        return UserView.of(findUser(email));
    }

    /** The logged-in user's own login history, newest first (the TradeLab version of "find attempts by user"). */
    public List<LoginAttempt> loginHistory(String email) {
        return loginAttemptRepository.findByEmailOrderByAttemptedAtDesc(findUser(email).getEmail());
    }

    public static String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private AppUser findUser(String email) {
        return appUserRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new NotFoundException("No user found with email " + email + "."));
    }

    private void checkPasswordStrength(String password) {
        if (password.length() < PASSWORD_MIN || password.length() > PASSWORD_MAX
                || !HAS_LETTER.matcher(password).find() || !HAS_DIGIT.matcher(password).find()) {
            throw new BusinessRuleException("WEAK_PASSWORD", "password",
                    "Use " + PASSWORD_MIN + " to " + PASSWORD_MAX + " characters with at least one letter and one number.");
        }
    }

    /**
     * Wrong passwords counted since the latest of: the start of the lock window, the last successful login,
     * or the end of the previous lock. So an old failure never adds to a new lock.
     */
    private long failedAttemptsSinceLastReset(AppUser user) {
        Instant now = Instant.now();
        Instant since = now.minus(lockDuration);
        Instant lastSuccess = loginAttemptRepository.findTopByEmailAndSuccessfulTrueOrderByAttemptedAtDesc(user.getEmail())
                .map(LoginAttempt::getAttemptedAt).orElse(null);
        if (lastSuccess != null && lastSuccess.isAfter(since)) {
            since = lastSuccess;
        }
        Instant previousLockEnd = user.getLockedUntil();
        if (previousLockEnd != null && previousLockEnd.isAfter(since) && !previousLockEnd.isAfter(now)) {
            since = previousLockEnd;
        }
        return loginAttemptRepository.countByEmailAndSuccessfulFalseAndAttemptedAtAfter(user.getEmail(), since);
    }

    private LoginFailedException locked(Instant until) {
        long minutes = until == null ? lockDuration.toMinutes()
                : Math.max(1, (long) Math.ceil(Duration.between(Instant.now(), until).toSeconds() / 60.0));
        return new LoginFailedException(HttpStatus.LOCKED, "ACCOUNT_LOCKED",
                "Too many failed logins. This account is locked for " + minutes + " more minute" + (minutes == 1 ? "" : "s") + ".");
    }
}
