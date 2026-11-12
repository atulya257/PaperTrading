package com.tradelab.stockservice;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class StockServiceTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void listsTheSeededStocks() throws Exception {
        mockMvc.perform(get("/api/stocks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(27))
                .andExpect(jsonPath("$[0].symbol").value("ADANIENT"));
    }

    @Test
    void findsOneStockAndFiltersBySector() throws Exception {
        mockMvc.perform(get("/api/stocks/reliance"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Reliance Industries"));
        mockMvc.perform(get("/api/stocks").param("sector", "banking"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(5));
        mockMvc.perform(get("/api/stocks/XYZ")).andExpect(status().isNotFound());
    }

    @Test
    void postAddsANewStock() throws Exception {
        mockMvc.perform(post("/api/stocks").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"symbol\":\"zomato\",\"name\":\"Zomato\",\"sector\":\"Consumer\",\"price\":215.50}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.symbol").value("ZOMATO"))
                .andExpect(jsonPath("$.exchange").value("NSE"));
        mockMvc.perform(get("/api/stocks")).andExpect(jsonPath("$.length()").value(28));
    }

    @Test
    void rejectsDuplicateOrInvalidStocks() throws Exception {
        mockMvc.perform(post("/api/stocks").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"symbol\":\"TCS\",\"name\":\"Copy\",\"sector\":\"IT\",\"price\":10}"))
                .andExpect(status().isConflict());
        mockMvc.perform(post("/api/stocks").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"symbol\":\"NEW\",\"name\":\"New Co\",\"sector\":\"IT\",\"price\":0}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void reactDevServerIsAllowedByCors() throws Exception {
        mockMvc.perform(options("/api/stocks")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }
}
