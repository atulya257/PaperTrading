package com.tradelab.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import java.math.BigDecimal;
import java.math.RoundingMode;

/** Shares of one stock owned by an account, tracked at average cost. */
@Entity
public class Holding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Account account;

    private String symbol;
    private int quantity;
    private BigDecimal investedAmount;

    protected Holding() {
    }

    public Holding(Account account, String symbol, int quantity, BigDecimal investedAmount) {
        this.account = account;
        this.symbol = symbol;
        this.quantity = quantity;
        this.investedAmount = investedAmount;
    }

    @JsonProperty
    public BigDecimal getAveragePrice() {
        return investedAmount.divide(BigDecimal.valueOf(quantity), 2, RoundingMode.HALF_UP);
    }

    public Long getId() { return id; }
    public Account getAccount() { return account; }
    public String getSymbol() { return symbol; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public BigDecimal getInvestedAmount() { return investedAmount; }
    public void setInvestedAmount(BigDecimal investedAmount) { this.investedAmount = investedAmount; }
}
