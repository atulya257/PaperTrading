package com.tradelab.config;

import com.tradelab.model.Account;
import com.tradelab.model.AppUser;
import com.tradelab.model.Stock;
import com.tradelab.repository.AccountRepository;
import com.tradelab.repository.AppUserRepository;
import com.tradelab.repository.StockRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Loads demo data into the in-memory database at startup (prices from the React app's demo market),
 * plus a demo login that owns account 1: demo@tradelab.com / Demo@1234.
 */
@Component
@Order(1)
public class DataSeeder implements CommandLineRunner {

    public static final BigDecimal INITIAL_CAPITAL = new BigDecimal("1000000.00");
    public static final String DEMO_EMAIL = "demo@tradelab.com";
    public static final String DEMO_PASSWORD = "Demo@1234";

    private final StockRepository stockRepository;
    private final AccountRepository accountRepository;
    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(StockRepository stockRepository, AccountRepository accountRepository,
                      AppUserRepository appUserRepository, PasswordEncoder passwordEncoder) {
        this.stockRepository = stockRepository;
        this.accountRepository = accountRepository;
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
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
            Account demoAccount = accountRepository.save(new Account("Demo Trader", INITIAL_CAPITAL));
            appUserRepository.save(new AppUser(DEMO_EMAIL, "Demo Trader", passwordEncoder.encode(DEMO_PASSWORD), false, demoAccount));
        }
    }

    private static Stock stock(String symbol, String name, String sector, String price) {
        return new Stock(symbol, name, sector, new BigDecimal(price));
    }
}
