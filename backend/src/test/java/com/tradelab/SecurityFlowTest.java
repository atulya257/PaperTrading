package com.tradelab;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/** The whole app over HTTP: sign up, use the token, and check what is public, protected and forbidden. */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SecurityFlowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void stocksArePublicButAccountsNeedALogin() throws Exception {
        mockMvc.perform(get("/api/stocks")).andExpect(status().isOk());
        mockMvc.perform(get("/api/accounts/1")).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void signedUpUserCanTradeOnOwnAccountOnly() throws Exception {
        JsonNode auth = json(mockMvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Atulya\",\"email\":\"flow@example.com\",\"password\":\"Secret123\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString());
        String bearer = "Bearer " + auth.get("token").asText();
        long accountId = auth.get("user").get("accountId").asLong();

        mockMvc.perform(get("/api/auth/me").header("Authorization", bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("flow@example.com"));

        mockMvc.perform(post("/api/accounts/" + accountId + "/orders").header("Authorization", bearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"symbol\":\"ITC\",\"side\":\"BUY\",\"quantity\":10}"))
                .andExpect(status().isCreated());
        mockMvc.perform(get("/api/accounts/" + accountId).header("Authorization", bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cash").value(995350.00));

        // Account 1 belongs to the demo user, not to this user.
        mockMvc.perform(get("/api/accounts/1").header("Authorization", bearer))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void wrongPasswordGives401AndNeverReturnsTheHash() throws Exception {
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"demo@tradelab.com\",\"password\":\"Wrong1234\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));

        String body = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"demo@tradelab.com\",\"password\":\"Demo@1234\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.accountId").value(1))
                .andReturn().getResponse().getContentAsString();
        assertThat(body).doesNotContain("passwordHash").doesNotContain("$2a$");
    }

    @Test
    void badTokenIsRejected() throws Exception {
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer not-a-real-token"))
                .andExpect(status().isUnauthorized());
    }

    private JsonNode json(String body) throws Exception {
        return objectMapper.readTree(body);
    }
}
