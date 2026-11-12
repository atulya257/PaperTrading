package com.tradelab.stockservice;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

// The React dev server, on this computer or opened from a phone on the same network
@CrossOrigin(originPatterns = {"http://localhost:5173", "http://*:5173"})
@RestController
@RequestMapping("/api/stocks")
public class StockController {

    private final StockService stockService;

    public StockController(StockService stockService) {
        this.stockService = stockService;
    }

    @GetMapping
    public List<Stock> getStocks(@RequestParam(required = false) String sector) {
        return stockService.getAllStocks(sector);
    }

    @GetMapping("/{symbol}")
    public Stock getStock(@PathVariable String symbol) {
        return stockService.getStock(symbol);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Stock createStock(@RequestBody Stock stock) {
        return stockService.saveStock(stock);
    }
}
