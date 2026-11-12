package com.tradelab.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.math.BigDecimal;

/** A user's paper-trading account holding virtual cash. */
@Entity
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private BigDecimal initialCapital;
    private BigDecimal cash;
    private BigDecimal realizedPnl = BigDecimal.ZERO;

    protected Account() {
    }

    public Account(String name, BigDecimal initialCapital) {
        this.name = name;
        this.initialCapital = initialCapital;
        this.cash = initialCapital;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BigDecimal getInitialCapital() { return initialCapital; }
    public BigDecimal getCash() { return cash; }
    public void setCash(BigDecimal cash) { this.cash = cash; }
    public BigDecimal getRealizedPnl() { return realizedPnl; }
    public void setRealizedPnl(BigDecimal realizedPnl) { this.realizedPnl = realizedPnl; }
}
