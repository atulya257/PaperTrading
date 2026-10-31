package com.tradelab.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.tradelab.config.SecurityConfig;
import com.tradelab.dto.OrderRequest;
import com.tradelab.exception.BusinessRuleException;
import com.tradelab.service.AccountAccess;
import com.tradelab.service.TradingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.h2.H2ConsoleProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Tests only the web layer with the real security rules: the service and the ownership check are mocked,
 * and jwt() stands in for a logged-in user's token.
 */
@WebMvcTest(OrderController.class)
@Import(SecurityConfig.class)
@EnableConfigurationProperties(H2ConsoleProperties.class) // SecurityConfig uses the H2 console path
class OrderControllerTest {

    private static final String BODY = "{\"symbol\":\"TCS\",\"side\":\"SELL\",\"quantity\":5}";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TradingService tradingService;

    @MockitoBean(name = "accountAccess")
    private AccountAccess accountAccess;

    @BeforeEach
    void ownerByDefault() {
        when(accountAccess.isOwner(eq(1L), any())).thenReturn(true);
    }

    @Test
    void businessRuleViolationReturns400WithCode() throws Exception {
        when(tradingService.placeOrder(eq(1L), any(OrderRequest.class)))
                .thenThrow(new BusinessRuleException("INSUFFICIENT_SHARES", "You do not own any shares of TCS."));

        mockMvc.perform(post("/api/accounts/1/orders").with(jwt())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(BODY))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INSUFFICIENT_SHARES"));
    }

    @Test
    void missingFieldsAreRejectedBeforeReachingTheService() throws Exception {
        mockMvc.perform(post("/api/accounts/1/orders").with(jwt())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"side\":\"BUY\",\"quantity\":5}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
        verifyNoInteractions(tradingService);
    }

    @Test
    void requestWithoutTokenIsRejectedWith401() throws Exception {
        mockMvc.perform(post("/api/accounts/1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(BODY))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
        verifyNoInteractions(tradingService);
    }

    @Test
    void someoneElsesAccountIsRejectedWith403() throws Exception {
        mockMvc.perform(post("/api/accounts/2/orders").with(jwt())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(BODY))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
        verifyNoInteractions(tradingService);
    }
}
