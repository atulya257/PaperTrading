package com.tradelab.repository;

import com.tradelab.model.Stock;
import org.springframework.data.jpa.repository.JpaRepository;

/** Spring Data generates the implementation at startup; no SQL or DAO code is written. */
public interface StockRepository extends JpaRepository<Stock, String> {
}
