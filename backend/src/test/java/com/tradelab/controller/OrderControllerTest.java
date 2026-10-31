package com.tradelab.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.tradelab.dto.OrderRequest;
import com.tradelab.exception.BusinessRuleException;
import com.tradelab.service.TradingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/** Tests only the web layer: the service is mocked, so this checks request handling and error mapping. */
@WebMvcTest(OrderController.class)
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TradingService tradingService;

    @Test
    void businessRuleViolationReturns400WithCode() throws Exception {
        when(tradingService.placeOrder(eq(1L), any(OrderRequest.class)))
                .thenThrow(new BusinessRuleException("INSUFFICIENT_SHARES", "You do not own any shares of TCS."));

        mockMvc.perform(post("/api/accounts/1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"symbol\":\"TCS\",\"side\":\"SELL\",\"quantity\":5}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INSUFFICIENT_SHARES"));
    }

    @Test
    void missingFieldsAreRejectedBeforeReachingTheService() throws Exception {
        mockMvc.perform(post("/api/accounts/1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"side\":\"BUY\",\"quantity\":5}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
        verifyNoInteractions(tradingService);
    }
}
