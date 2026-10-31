package com.tradelab.stockservice;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockRepository extends JpaRepository<Stock, Long> {

    Optional<Stock> findBySymbol(String symbol);

    boolean existsBySymbol(String symbol);

    List<Stock> findBySectorIgnoreCaseOrderBySymbol(String sector);
}
