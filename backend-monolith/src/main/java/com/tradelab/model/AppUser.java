package com.tradelab.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.Instant;

/**
 * A person who can log in. The table is named app_users because USER is a reserved SQL word.
 * Only a BCrypt hash of the password is stored, never the password itself.
 */
@Entity
@Table(name = "app_users")
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String passwordHash;

    private boolean guest;

    /** Set when too many logins fail; the user can't log in until this time passes. */
    private Instant lockedUntil;

    private Instant createdAt;

    @OneToOne(optional = false)
    @JoinColumn(name = "account_id", unique = true)
    private Account account;

    protected AppUser() {
    }

    public AppUser(String email, String name, String passwordHash, boolean guest, Account account) {
        this.email = email;
        this.name = name;
        this.passwordHash = passwordHash;
        this.guest = guest;
        this.account = account;
        this.createdAt = Instant.now();
    }

    public boolean isLockedAt(Instant now) {
        return lockedUntil != null && lockedUntil.isAfter(now);
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getName() { return name; }
    public String getPasswordHash() { return passwordHash; }
    public boolean isGuest() { return guest; }
    public Instant getLockedUntil() { return lockedUntil; }
    public void setLockedUntil(Instant lockedUntil) { this.lockedUntil = lockedUntil; }
    public Instant getCreatedAt() { return createdAt; }
    public Account getAccount() { return account; }
}
