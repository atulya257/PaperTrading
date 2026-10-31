package com.tradelab.dto;

import com.tradelab.model.OrderSide;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** Body of POST /api/accounts/{id}/orders. Quantity limits are a business rule, checked in TradingService. */
public record OrderRequest(
        @NotBlank(message = "symbol is required") String symbol,
        @NotNull(message = "side must be BUY or SELL") OrderSide side,
        @NotNull(message = "quantity is required") Integer quantity) {
}
