package com.tradelab.service;

import com.tradelab.exception.NotFoundException;
import com.tradelab.model.Stock;
import com.tradelab.repository.StockRepository;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class StockService {

    private final StockRepository stockRepository;

    public StockService(StockRepository stockRepository) {
        this.stockRepository = stockRepository;
    }

    public List<Stock> getAllStocks() {
        return stockRepository.findAll(Sort.by("symbol"));
    }

    public Stock getStock(String symbol) {
        return stockRepository.findById(normalize(symbol))
                .orElseThrow(() -> new NotFoundException("No stock found with symbol " + symbol + "."));
    }

    static String normalize(String symbol) {
        return symbol == null ? "" : symbol.trim().toUpperCase();
    }
}
