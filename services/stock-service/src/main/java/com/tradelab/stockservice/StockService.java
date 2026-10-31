package com.tradelab.stockservice;

import java.math.BigDecimal;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Business layer of the Stock Service. Rules for adding a stock:
 * the symbol is 1-20 capital letters, digits, '&' or '-'; it must not exist yet; name and sector are required;
 * the price must be greater than zero.
 */
@Service
public class StockService {

    private static final Pattern SYMBOL = Pattern.compile("^[A-Z0-9&-]{1,20}$");

    private final StockRepository stockRepository;

    public StockService(StockRepository stockRepository) {
        this.stockRepository = stockRepository;
    }

    public List<Stock> getAllStocks(String sector) {
        if (sector != null && !sector.isBlank()) {
            return stockRepository.findBySectorIgnoreCaseOrderBySymbol(sector.trim());
        }
        return stockRepository.findAll(Sort.by("symbol"));
    }

    public Stock getStock(String symbol) {
        return stockRepository.findBySymbol(symbol.trim().toUpperCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No stock with symbol " + symbol + "."));
    }

    public Stock saveStock(Stock stock) {
        String symbol = stock.getSymbol() == null ? "" : stock.getSymbol().trim().toUpperCase();
        if (!SYMBOL.matcher(symbol).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Symbol must be 1-20 capital letters, digits, '&' or '-'.");
        }
        if (isBlank(stock.getName()) || isBlank(stock.getSector())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name and sector are required.");
        }
        if (stock.getPrice() == null || stock.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Price must be greater than zero.");
        }
        if (stockRepository.existsBySymbol(symbol)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Stock " + symbol + " is already listed.");
        }
        stock.setSymbol(symbol);
        if (isBlank(stock.getExchange())) {
            stock.setExchange("NSE");
        }
        return stockRepository.save(stock);
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
