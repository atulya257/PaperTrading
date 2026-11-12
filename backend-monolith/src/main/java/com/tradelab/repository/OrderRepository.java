package com.tradelab.repository;

import com.tradelab.model.TradeOrder;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<TradeOrder, Long> {

    List<TradeOrder> findByAccountId(Long accountId);

    List<TradeOrder> findByAccountIdOrderByCreatedAtDescIdDesc(Long accountId);
}
