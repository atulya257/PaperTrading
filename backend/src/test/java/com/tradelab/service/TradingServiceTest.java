package com.tradelab.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.tradelab.dto.OrderRequest;
import com.tradelab.exception.BusinessRuleException;
import com.tradelab.model.Account;
import com.tradelab.model.Holding;
import com.tradelab.model.OrderSide;
import com.tradelab.model.TradeOrder;
import com.tradelab.repository.AccountRepository;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

/**
 * Tests the business rules in TradingService against the real Spring context and H2 database.
 * Each test runs in a transaction that is rolled back afterwards, so tests do not affect each other.
 * Seeded price used below: RELIANCE = ₹2890.00.
 */
@SpringBootTest
@Transactional
class TradingServiceTest {

    @Autowired
    private TradingService tradingService;

    @Autowired
    private AccountRepository accountRepository;

    private Long accountId;

    @BeforeEach
    void createAccount() {
        accountId = accountRepository.save(new Account("Test Trader", new BigDecimal("100000.00"))).getId();
    }

    @Test
    void buyReducesCashAndCreatesHolding() {
        TradeOrder order = tradingService.placeOrder(accountId, new OrderRequest("RELIANCE", OrderSide.BUY, 10));

        assertThat(order.getTotal()).isEqualByComparingTo("28900.00");
        assertThat(tradingService.getAccount(accountId).getCash()).isEqualByComparingTo("71100.00");
        List<Holding> holdings = tradingService.getHoldings(accountId);
        assertThat(holdings).hasSize(1);
        assertThat(holdings.getFirst().getQuantity()).isEqualTo(10);
    }

    @Test
    void buyCostingMoreThanCashIsRejected() {
        // 35 x 2890 = 101,150 > 100,000 cash
        assertThatThrownBy(() -> tradingService.placeOrder(accountId, new OrderRequest("RELIANCE", OrderSide.BUY, 35)))
                .isInstanceOf(BusinessRuleException.class)
                .extracting("code").isEqualTo("INSUFFICIENT_FUNDS");
        assertThat(tradingService.getAccount(accountId).getCash()).isEqualByComparingTo("100000.00");
    }

    @Test
    void sellingMoreSharesThanHeldIsRejected() {
        tradingService.placeOrder(accountId, new OrderRequest("RELIANCE", OrderSide.BUY, 5));

        assertThatThrownBy(() -> tradingService.placeOrder(accountId, new OrderRequest("RELIANCE", OrderSide.SELL, 6)))
                .isInstanceOf(BusinessRuleException.class)
                .extracting("code").isEqualTo("INSUFFICIENT_SHARES");
    }

    @Test
    void quantityOutsideAllowedRangeIsRejected() {
        assertThatThrownBy(() -> tradingService.placeOrder(accountId, new OrderRequest("RELIANCE", OrderSide.BUY, 0)))
                .isInstanceOf(BusinessRuleException.class)
                .extracting("code").isEqualTo("INVALID_QUANTITY");
        assertThatThrownBy(() -> tradingService.placeOrder(accountId,
                new OrderRequest("RELIANCE", OrderSide.BUY, TradingService.MAX_ORDER_QUANTITY + 1)))
                .isInstanceOf(BusinessRuleException.class)
                .extracting("code").isEqualTo("INVALID_QUANTITY");
    }

    @Test
    void partialSellBooksPnlAgainstAverageCost() {
        tradingService.placeOrder(accountId, new OrderRequest("RELIANCE", OrderSide.BUY, 10));

        TradeOrder sell = tradingService.placeOrder(accountId, new OrderRequest("RELIANCE", OrderSide.SELL, 4));

        // Same price both sides, so cost of 4 shares = proceeds and P&L is 0; 6 shares remain.
        assertThat(sell.getRealizedPnl()).isEqualByComparingTo("0.00");
        assertThat(tradingService.getHoldings(accountId).getFirst().getQuantity()).isEqualTo(6);
        assertThat(tradingService.getAccount(accountId).getCash()).isEqualByComparingTo("82660.00");
    }

    @Test
    void sellingAllSharesClosesTheHolding() {
        tradingService.placeOrder(accountId, new OrderRequest("RELIANCE", OrderSide.BUY, 3));
        tradingService.placeOrder(accountId, new OrderRequest("RELIANCE", OrderSide.SELL, 3));

        assertThat(tradingService.getHoldings(accountId)).isEmpty();
        assertThat(tradingService.getAccount(accountId).getCash()).isEqualByComparingTo("100000.00");
    }
}
