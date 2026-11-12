package com.tradelab.userservice;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "login_attempts")
public class LoginAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String email;
    private boolean successful;
    private Instant attemptedAt;

    protected LoginAttempt() {
    }

    public LoginAttempt(String email, boolean successful) {
        this.email = email;
        this.successful = successful;
        this.attemptedAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public boolean isSuccessful() { return successful; }
    public Instant getAttemptedAt() { return attemptedAt; }
}
