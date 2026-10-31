package com.tradelab.repository;

import com.tradelab.model.AppUser;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByEmail(String email);

    boolean existsByEmail(String email);

    /** True when the user with this email owns the account with this id. */
    boolean existsByEmailAndAccountId(String email, Long accountId);
}
