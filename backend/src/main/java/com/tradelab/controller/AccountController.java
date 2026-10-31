package com.tradelab.controller;

import com.tradelab.model.Account;
import com.tradelab.model.Holding;
import com.tradelab.service.TradingService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/accounts/{accountId}")
public class AccountController {

    private final TradingService tradingService;

    public AccountController(TradingService tradingService) {
        this.tradingService = tradingService;
    }

    @GetMapping
    public Account getAccount(@PathVariable Long accountId) {
        return tradingService.getAccount(accountId);
    }

    @GetMapping("/holdings")
    public List<Holding> getHoldings(@PathVariable Long accountId) {
        return tradingService.getHoldings(accountId);
    }
}
