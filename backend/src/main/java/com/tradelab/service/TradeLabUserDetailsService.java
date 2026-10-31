package com.tradelab.service;

import com.tradelab.model.AppUser;
import com.tradelab.repository.AppUserRepository;
import java.time.Instant;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Tells Spring Security how to load a user: from the app_users table through AppUserRepository.
 * Spring Boot sees this bean plus the PasswordEncoder and builds the login AuthenticationManager from them.
 */
@Service
public class TradeLabUserDetailsService implements UserDetailsService {

    private final AppUserRepository appUserRepository;

    public TradeLabUserDetailsService(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) {
        AppUser user = appUserRepository.findByEmail(AuthService.normalizeEmail(email))
                .orElseThrow(() -> new UsernameNotFoundException("No user with email " + email));
        return User.withUsername(user.getEmail())
                .password(user.getPasswordHash())
                .roles("USER")
                .accountLocked(user.isLockedAt(Instant.now()))
                .build();
    }
}
