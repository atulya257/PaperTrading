package com.tradelab.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.tradelab.model.Account;
import com.tradelab.model.OrderSide;
import com.tradelab.model.TradeOrder;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

/** Tests the data layer only: @DataJpaTest starts JPA + H2 and the repositories, nothing else. */
@DataJpaTest
class RepositoryTest {

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Test
    void saveFindUpdateAndDeleteAccount() {
        Account saved = accountRepository.save(new Account("Atulya", new BigDecimal("1000.00")));
        assertThat(saved.getId()).isNotNull();

        saved.setName("Atulya Srikrishna Vangala");
        accountRepository.save(saved);
        assertThat(accountRepository.findById(saved.getId())).get()
                .extracting(Account::getName).isEqualTo("Atulya Srikrishna Vangala");

        accountRepository.delete(saved);
        assertThat(accountRepository.existsById(saved.getId())).isFalse();
    }

    @Test
    void derivedQueriesFindByNameAndByAccountId() {
        Account account = accountRepository.save(new Account("Atulya", new BigDecimal("50000.00")));
        Account other = accountRepository.save(new Account("Atulya Vangala", new BigDecimal("50000.00")));
        orderRepository.save(new TradeOrder(account, "TCS", OrderSide.BUY, 2,
                new BigDecimal("3950.00"), new BigDecimal("7900.00"), null));
        orderRepository.save(new TradeOrder(account, "ITC", OrderSide.BUY, 10,
                new BigDecimal("465.00"), new BigDecimal("4650.00"), null));
        orderRepository.save(new TradeOrder(other, "SBIN", OrderSide.BUY, 1,
                new BigDecimal("815.00"), new BigDecimal("815.00"), null));

        assertThat(accountRepository.findByName("Atulya")).isPresent();
        assertThat(orderRepository.findByAccountId(account.getId()))
                .extracting(TradeOrder::getSymbol).containsExactlyInAnyOrder("TCS", "ITC");
        assertThat(orderRepository.findByAccountId(other.getId())).hasSize(1);
    }
}
