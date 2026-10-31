package com.tradelab.repository;

import com.tradelab.model.Holding;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/** Query methods are derived from their names, e.g. findByAccountIdAndSymbol → WHERE account_id = ? AND symbol = ?. */
public interface HoldingRepository extends JpaRepository<Holding, Long> {

    List<Holding> findByAccountIdOrderBySymbol(Long accountId);

    Optional<Holding> findByAccountIdAndSymbol(Long accountId, String symbol);
}
