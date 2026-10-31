package com.tradelab.userservice;

import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {

    long countByEmailAndSuccessfulFalseAndAttemptedAtAfter(String email, Instant after);

    Optional<LoginAttempt> findTopByEmailAndSuccessfulTrueOrderByAttemptedAtDesc(String email);
}
