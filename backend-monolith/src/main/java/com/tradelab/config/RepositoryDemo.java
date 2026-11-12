package com.tradelab.config;

import com.tradelab.model.Account;
import com.tradelab.model.OrderSide;
import com.tradelab.model.TradeOrder;
import com.tradelab.repository.AccountRepository;
import com.tradelab.repository.OrderRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Activity 5 demo: runs each Spring Data JPA repository operation once at startup and prints the result.
 * It works on its own "Test User" account and deletes everything it creates, so the seeded demo data is untouched.
 */
@Component
@Order(2)
public class RepositoryDemo implements CommandLineRunner {

    private final AccountRepository accountRepository;
    private final OrderRepository orderRepository;

    public RepositoryDemo(AccountRepository accountRepository, OrderRepository orderRepository) {
        this.accountRepository = accountRepository;
        this.orderRepository = orderRepository;
    }

    @Override
    public void run(String... args) {
        System.out.println("===== Repository demo (Activity 5) =====");

        // Save and read
        Account account = accountRepository.save(new Account("Test User", new BigDecimal("50000.00")));
        System.out.println("Saved account: " + account.getId() + " - " + account.getName());
        System.out.println("All accounts:");
        accountRepository.findAll().forEach(a -> System.out.println("  " + a.getId() + " - " + a.getName()));

        // Update
        System.out.println("Name before update: " + account.getName());
        account.setName("Test User Updated");
        accountRepository.save(account);
        System.out.println("Name after update: " + accountRepository.findById(account.getId()).orElseThrow().getName());

        // Find by id and by a derived query
        accountRepository.findById(account.getId()).ifPresent(found ->
                System.out.println("Found by id: " + found.getId() + " - " + found.getName()));
        accountRepository.findByName("Test User Updated").ifPresent(found ->
                System.out.println("Found by name: " + found.getId() + " - " + found.getName()));

        // Save and retrieve an order for this account (the activity's "attempt")
        TradeOrder order = orderRepository.save(new TradeOrder(account, "INFY", OrderSide.BUY, 5,
                new BigDecimal("1620.00"), new BigDecimal("8100.00"), null));
        System.out.println("Saved order id: " + order.getId());
        List<TradeOrder> orders = orderRepository.findByAccountId(account.getId());
        System.out.println("Orders found for account " + account.getId() + ": " + orders.size());
        orders.forEach(o -> System.out.println("  Order " + o.getId() + ": " + o.getSide() + " "
                + o.getQuantity() + " " + o.getSymbol() + " @ " + o.getPrice() + ", total " + o.getTotal()));

        // Delete (the order first, because it references the account)
        orderRepository.deleteAll(orders);
        accountRepository.delete(account);
        System.out.println("Deleted test account. Remaining accounts: " + accountRepository.count());
        System.out.println("Account exists after delete? " + accountRepository.existsById(account.getId()));
        System.out.println("===== End of repository demo =====");
    }
}
