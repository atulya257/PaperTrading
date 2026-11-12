package com.tradelab.repository;

import com.tradelab.model.LoginAttempt;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {

    long countByEmailAndSuccessfulFalseAndAttemptedAtAfter(String email, Instant after);

    Optional<LoginAttempt> findTopByEmailAndSuccessfulTrueOrderByAttemptedAtDesc(String email);

    List<LoginAttempt> findByEmailOrderByAttemptedAtDesc(String email);
}
