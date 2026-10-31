package com.tradelab.userservice;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Business layer of the User Service. Rules:
 * <ol>
 *   <li>Name 2-40 characters, a valid email that isn't registered yet.</li>
 *   <li>Password 8-72 characters with a letter and a number; only its BCrypt hash is saved.</li>
 *   <li>Login checks the password with BCrypt. Every attempt is recorded; after too many wrong passwords
 *       the account is locked for a while, even for the right password.</li>
 * </ol>
 */
@Service
public class UserService {

    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final UserRepository userRepository;
    private final LoginAttemptRepository loginAttemptRepository;
    private final PasswordEncoder passwordEncoder;
    private final int maxFailedLogins;
    private final Duration lockDuration;

    public UserService(UserRepository userRepository, LoginAttemptRepository loginAttemptRepository,
                       PasswordEncoder passwordEncoder,
                       @Value("${tradelab.security.max-failed-logins:5}") int maxFailedLogins,
                       @Value("${tradelab.security.lock-minutes:15}") long lockMinutes) {
        this.userRepository = userRepository;
        this.loginAttemptRepository = loginAttemptRepository;
        this.passwordEncoder = passwordEncoder;
        this.maxFailedLogins = maxFailedLogins;
        this.lockDuration = Duration.ofMinutes(lockMinutes);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UserException(HttpStatus.NOT_FOUND, "NOT_FOUND", null, "No user with id " + id + "."));
    }

    public User registerUser(RegisterRequest request) {
        String name = request.name() == null ? "" : request.name().trim().replaceAll("\\s+", " ");
        String email = normalize(request.email());
        String password = request.password() == null ? "" : request.password();

        if (name.length() < 2 || name.length() > 40) {
            throw new UserException(HttpStatus.BAD_REQUEST, "INVALID_NAME", "name", "Enter a name between 2 and 40 characters.");
        }
        if (!EMAIL.matcher(email).matches()) {
            throw new UserException(HttpStatus.BAD_REQUEST, "INVALID_EMAIL", "email", "Enter a valid email address, like you@example.com.");
        }
        if (password.length() < 8 || password.length() > 72 || !password.matches(".*[A-Za-z].*") || !password.matches(".*[0-9].*")) {
            throw new UserException(HttpStatus.BAD_REQUEST, "WEAK_PASSWORD", "password",
                    "Use 8 to 72 characters with at least one letter and one number.");
        }
        if (userRepository.existsByEmail(email)) {
            throw new UserException(HttpStatus.CONFLICT, "EMAIL_TAKEN", "email", "An account with this email already exists. Log in instead.");
        }
        return userRepository.save(new User(name, email, passwordEncoder.encode(password)));
    }

    public User loginUser(LoginRequest request) {
        String email = normalize(request.email());
        String password = request.password() == null ? "" : request.password();
        if (email.isEmpty() || password.isEmpty()) {
            throw new UserException(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", email.isEmpty() ? "email" : "password",
                    "Email and password are required.");
        }

        User user = userRepository.findByEmail(email).orElse(null);
        Instant now = Instant.now();
        if (user != null && user.isLockedAt(now)) {
            loginAttemptRepository.save(new LoginAttempt(email, false));
            throw locked(user.getLockedUntil(), now);
        }
        if (user == null || !passwordEncoder.matches(password, user.getPassword())) {
            loginAttemptRepository.save(new LoginAttempt(email, false));
            if (user != null && failuresSinceLastReset(user, now) >= maxFailedLogins) {
                user.setLockedUntil(now.plus(lockDuration));
                userRepository.save(user);
                throw locked(user.getLockedUntil(), now);
            }
            // The same answer whether the email exists or not, so nobody can find out who has an account.
            throw new UserException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", null, "Invalid email or password.");
        }

        loginAttemptRepository.save(new LoginAttempt(email, true));
        if (user.getLockedUntil() != null) {
            user.setLockedUntil(null);
            userRepository.save(user);
        }
        return user;
    }

    private long failuresSinceLastReset(User user, Instant now) {
        Instant since = now.minus(lockDuration);
        Instant lastSuccess = loginAttemptRepository.findTopByEmailAndSuccessfulTrueOrderByAttemptedAtDesc(user.getEmail())
                .map(LoginAttempt::getAttemptedAt).orElse(null);
        if (lastSuccess != null && lastSuccess.isAfter(since)) {
            since = lastSuccess;
        }
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(since)) {
            since = user.getLockedUntil();
        }
        return loginAttemptRepository.countByEmailAndSuccessfulFalseAndAttemptedAtAfter(user.getEmail(), since);
    }

    private UserException locked(Instant until, Instant now) {
        long minutes = Math.max(1, (long) Math.ceil(Duration.between(now, until).toSeconds() / 60.0));
        return new UserException(HttpStatus.LOCKED, "ACCOUNT_LOCKED", null,
                "Too many failed logins. This account is locked for " + minutes + " more minute" + (minutes == 1 ? "" : "s") + ".");
    }

    private static String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
