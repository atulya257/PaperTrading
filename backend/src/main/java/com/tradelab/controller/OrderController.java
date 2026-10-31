package com.tradelab.controller;

import com.tradelab.dto.OrderRequest;
import com.tradelab.model.TradeOrder;
import com.tradelab.service.TradingService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Presentation layer only: receives the HTTP request and hands it to TradingService. No business logic here. */
@RestController
@RequestMapping("/api/accounts/{accountId}/orders")
public class OrderController {

    private final TradingService tradingService;

    public OrderController(TradingService tradingService) {
        this.tradingService = tradingService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TradeOrder placeOrder(@PathVariable Long accountId, @Valid @RequestBody OrderRequest request) {
        return tradingService.placeOrder(accountId, request);
    }

    @GetMapping
    public List<TradeOrder> getOrders(@PathVariable Long accountId) {
        return tradingService.getOrders(accountId);
    }
}
