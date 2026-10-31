package com.tradelab.config;

import com.tradelab.model.Account;
import com.tradelab.model.Stock;
import com.tradelab.repository.AccountRepository;
import com.tradelab.repository.StockRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/** Loads demo data into the in-memory database at startup (prices from the React app's demo market). */
@Component
@Order(1)
public class DataSeeder implements CommandLineRunner {

    public static final BigDecimal INITIAL_CAPITAL = new BigDecimal("1000000.00");

    private final StockRepository stockRepository;
    private final AccountRepository accountRepository;

    public DataSeeder(StockRepository stockRepository, AccountRepository accountRepository) {
        this.stockRepository = stockRepository;
        this.accountRepository = accountRepository;
    }

    @Override
    public void run(String... args) {
        if (stockRepository.count() == 0) {
            stockRepository.saveAll(List.of(
                    stock("RELIANCE", "Reliance Industries", "Energy", "2890.00"),
                    stock("TCS", "Tata Consultancy Services", "IT", "3950.00"),
                    stock("INFY", "Infosys", "IT", "1620.00"),
                    stock("HDFCBANK", "HDFC Bank", "Banking", "1690.00"),
                    stock("ICICIBANK", "ICICI Bank", "Banking", "1210.00"),
                    stock("SBIN", "State Bank of India", "Banking", "815.00"),
                    stock("ITC", "ITC Limited", "FMCG", "465.00"),
                    stock("TATAMOTORS", "Tata Motors", "Auto", "940.00"),
                    stock("MARUTI", "Maruti Suzuki India", "Auto", "12400.00"),
                    stock("TATASTEEL", "Tata Steel", "Metals", "155.00")));
        }
        if (accountRepository.count() == 0) {
            accountRepository.save(new Account("Demo Trader", INITIAL_CAPITAL));
        }
    }

    private static Stock stock(String symbol, String name, String sector, String price) {
        return new Stock(symbol, name, sector, new BigDecimal(price));
    }
}
