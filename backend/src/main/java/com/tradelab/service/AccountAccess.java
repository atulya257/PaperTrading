package com.tradelab.service;

import com.tradelab.repository.AppUserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

/**
 * Business rule: a user may only see and trade on their own account.
 * Used by @PreAuthorize on the account and order controllers.
 */
@Service("accountAccess")
public class AccountAccess {

    private final AppUserRepository appUserRepository;

    public AccountAccess(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    public boolean isOwner(Long accountId, Authentication authentication) {
        return authentication != null
                && authentication.isAuthenticated()
                && accountId != null
                && appUserRepository.existsByEmailAndAccountId(authentication.getName(), accountId);
    }
}
