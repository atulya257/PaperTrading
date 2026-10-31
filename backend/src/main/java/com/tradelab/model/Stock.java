package com.tradelab.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import java.math.BigDecimal;

/** A tradable stock in the simulated market. */
@Entity
public class Stock {

    @Id
    private String symbol;
    private String name;
    private String sector;
    private BigDecimal price;

    protected Stock() {
    }

    public Stock(String symbol, String name, String sector, BigDecimal price) {
        this.symbol = symbol;
        this.name = name;
        this.sector = sector;
        this.price = price;
    }

    public String getSymbol() { return symbol; }
    public String getName() { return name; }
    public String getSector() { return sector; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
}
