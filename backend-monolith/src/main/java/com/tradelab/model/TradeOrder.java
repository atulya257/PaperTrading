package com.tradelab.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import java.math.BigDecimal;
import java.time.Instant;

/** An executed buy or sell. ("Order" is a reserved SQL word, hence TradeOrder.) */
@Entity
public class TradeOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Account account;

    private String symbol;

    @Enumerated(EnumType.STRING)
    private OrderSide side;

    private int quantity;
    private BigDecimal price;
    private BigDecimal total;
    /** Profit or loss booked by a SELL; null for a BUY. */
    private BigDecimal realizedPnl;
    private Instant createdAt;

    protected TradeOrder() {
    }

    public TradeOrder(Account account, String symbol, OrderSide side, int quantity,
                      BigDecimal price, BigDecimal total, BigDecimal realizedPnl) {
        this.account = account;
        this.symbol = symbol;
        this.side = side;
        this.quantity = quantity;
        this.price = price;
        this.total = total;
        this.realizedPnl = realizedPnl;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public Account getAccount() { return account; }
    public String getSymbol() { return symbol; }
    public OrderSide getSide() { return side; }
    public int getQuantity() { return quantity; }
    public BigDecimal getPrice() { return price; }
    public BigDecimal getTotal() { return total; }
    public BigDecimal getRealizedPnl() { return realizedPnl; }
    public Instant getCreatedAt() { return createdAt; }
}
