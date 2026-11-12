package com.tradelab.service;

import com.tradelab.dto.OrderRequest;
import com.tradelab.exception.BusinessRuleException;
import com.tradelab.exception.NotFoundException;
import com.tradelab.model.Account;
import com.tradelab.model.Holding;
import com.tradelab.model.OrderSide;
import com.tradelab.model.Stock;
import com.tradelab.model.TradeOrder;
import com.tradelab.repository.AccountRepository;
import com.tradelab.repository.HoldingRepository;
import com.tradelab.repository.OrderRepository;
import com.tradelab.repository.StockRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Business layer for trading. All order rules live here (ported from the React app's src/engine/trading.js):
 * <ol>
 *   <li>Quantity must be a whole number from 1 to {@value #MAX_ORDER_QUANTITY}.</li>
 *   <li>A BUY needs enough cash to pay quantity x price.</li>
 *   <li>A SELL cannot sell more shares than the account holds.</li>
 *   <li>A SELL books realized P&amp;L against the holding's average cost; selling everything closes the holding.</li>
 * </ol>
 */
@Service
public class TradingService {

    public static final int MAX_ORDER_QUANTITY = 100_000;

    private final AccountRepository accountRepository;
    private final StockRepository stockRepository;
    private final HoldingRepository holdingRepository;
    private final OrderRepository orderRepository;

    public TradingService(AccountRepository accountRepository, StockRepository stockRepository,
                          HoldingRepository holdingRepository, OrderRepository orderRepository) {
        this.accountRepository = accountRepository;
        this.stockRepository = stockRepository;
        this.holdingRepository = holdingRepository;
        this.orderRepository = orderRepository;
    }

    public Account getAccount(Long accountId) {
        return accountRepository.findById(accountId)
                .orElseThrow(() -> new NotFoundException("No account found with id " + accountId + "."));
    }

    public List<Holding> getHoldings(Long accountId) {
        getAccount(accountId);
        return holdingRepository.findByAccountIdOrderBySymbol(accountId);
    }

    public List<TradeOrder> getOrders(Long accountId) {
        getAccount(accountId);
        return orderRepository.findByAccountIdOrderByCreatedAtDescIdDesc(accountId);
    }

    @Transactional
    public TradeOrder placeOrder(Long accountId, OrderRequest request) {
        int quantity = request.quantity();
        if (quantity < 1 || quantity > MAX_ORDER_QUANTITY) {
            throw new BusinessRuleException("INVALID_QUANTITY",
                    "Quantity must be between 1 and " + MAX_ORDER_QUANTITY + " shares.");
        }

        Account account = getAccount(accountId);
        String symbol = StockService.normalize(request.symbol());
        Stock stock = stockRepository.findById(symbol)
                .orElseThrow(() -> new BusinessRuleException("UNKNOWN_SYMBOL", "No stock found with symbol " + symbol + "."));

        BigDecimal price = stock.getPrice();
        BigDecimal total = price.multiply(BigDecimal.valueOf(quantity));

        TradeOrder order = request.side() == OrderSide.BUY
                ? buy(account, symbol, quantity, price, total)
                : sell(account, symbol, quantity, price, total);
        accountRepository.save(account);
        return orderRepository.save(order);
    }

    private TradeOrder buy(Account account, String symbol, int quantity, BigDecimal price, BigDecimal total) {
        if (account.getCash().compareTo(total) < 0) {
            throw new BusinessRuleException("INSUFFICIENT_FUNDS",
                    "Insufficient funds: this order costs ₹" + total + " but you have ₹" + account.getCash() + " available.");
        }

        Holding holding = holdingRepository.findByAccountIdAndSymbol(account.getId(), symbol)
                .orElseGet(() -> new Holding(account, symbol, 0, BigDecimal.ZERO));
        holding.setQuantity(holding.getQuantity() + quantity);
        holding.setInvestedAmount(holding.getInvestedAmount().add(total));
        holdingRepository.save(holding);

        account.setCash(account.getCash().subtract(total));
        return new TradeOrder(account, symbol, OrderSide.BUY, quantity, price, total, null);
    }

    private TradeOrder sell(Account account, String symbol, int quantity, BigDecimal price, BigDecimal total) {
        Holding holding = holdingRepository.findByAccountIdAndSymbol(account.getId(), symbol).orElse(null);
        int held = holding == null ? 0 : holding.getQuantity();
        if (quantity > held) {
            throw new BusinessRuleException("INSUFFICIENT_SHARES", held == 0
                    ? "You do not own any shares of " + symbol + "."
                    : "Insufficient shares: you are selling " + quantity + " but only hold " + held + " of " + symbol + ".");
        }

        boolean fullSale = quantity == held;
        BigDecimal costOfSharesSold = fullSale
                ? holding.getInvestedAmount()
                : holding.getInvestedAmount().multiply(BigDecimal.valueOf(quantity))
                        .divide(BigDecimal.valueOf(held), 2, RoundingMode.HALF_UP);
        BigDecimal realizedPnl = total.subtract(costOfSharesSold);

        if (fullSale) {
            holdingRepository.delete(holding);
        } else {
            holding.setQuantity(held - quantity);
            holding.setInvestedAmount(holding.getInvestedAmount().subtract(costOfSharesSold));
            holdingRepository.save(holding);
        }

        account.setCash(account.getCash().add(total));
        account.setRealizedPnl(account.getRealizedPnl().add(realizedPnl));
        return new TradeOrder(account, symbol, OrderSide.SELL, quantity, price, total, realizedPnl);
    }
}
