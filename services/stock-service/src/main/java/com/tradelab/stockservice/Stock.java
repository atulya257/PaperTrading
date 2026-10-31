package com.tradelab.stockservice;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.math.BigDecimal;

/**
 * A stock listed on TradeLab. The last three fields tune how the React app's market simulator moves its price;
 * they are optional and the frontend uses sensible defaults when they are missing.
 */
@Entity
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String symbol;

    private String name;
    private String sector;
    private String exchange;

    /** Reference price in rupees. */
    private BigDecimal price;

    private Long marketCapCr;
    private Double pe;

    @Column(length = 500)
    private String description;

    private Double beta;
    private Double sectorLoad;
    private Double dailyVol;

    protected Stock() {
    }

    public Stock(String symbol, String name, String sector, BigDecimal price, Long marketCapCr, Double pe,
                 String description, Double beta, Double sectorLoad, Double dailyVol) {
        this.symbol = symbol;
        this.name = name;
        this.sector = sector;
        this.exchange = "NSE";
        this.price = price;
        this.marketCapCr = marketCapCr;
        this.pe = pe;
        this.description = description;
        this.beta = beta;
        this.sectorLoad = sectorLoad;
        this.dailyVol = dailyVol;
    }

    public Long getId() { return id; }
    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }
    public String getName() { return name; }
    public String getSector() { return sector; }
    public String getExchange() { return exchange; }
    public void setExchange(String exchange) { this.exchange = exchange; }
    public BigDecimal getPrice() { return price; }
    public Long getMarketCapCr() { return marketCapCr; }
    public Double getPe() { return pe; }
    public String getDescription() { return description; }
    public Double getBeta() { return beta; }
    public Double getSectorLoad() { return sectorLoad; }
    public Double getDailyVol() { return dailyVol; }
}
