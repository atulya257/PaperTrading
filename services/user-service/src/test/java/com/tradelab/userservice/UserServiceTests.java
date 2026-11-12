package com.tradelab.userservice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class UserServiceTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    private ResultActions register(String name, String email, String password) throws Exception {
        return mockMvc.perform(post("/api/users").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"" + name + "\",\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"));
    }

    private ResultActions login(String email, String password) throws Exception {
        return mockMvc.perform(post("/api/users/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"));
    }

    @Test
    void registerStoresABcryptHashAndNeverReturnsIt() throws Exception {
        register("Atulya", "Atulya@Example.com", "Trade2026")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("atulya@example.com"))
                .andExpect(jsonPath("$.password").doesNotExist());

        User saved = userRepository.findByEmail("atulya@example.com").orElseThrow();
        assertThat(saved.getPassword()).startsWith("$2a$").isNotEqualTo("Trade2026");

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].password").doesNotExist());
    }

    @Test
    void registerRejectsWeakPasswordsAndDuplicateEmails() throws Exception {
        register("Atulya", "weak@example.com", "abc").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("WEAK_PASSWORD"))
                .andExpect(jsonPath("$.field").value("password"));
        register("Atulya", "dup@example.com", "Trade2026").andExpect(status().isCreated());
        register("Someone", "DUP@example.com", "Trade2026").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("EMAIL_TAKEN"));
    }

    @Test
    void loginChecksThePasswordWithBcrypt() throws Exception {
        register("Atulya", "login@example.com", "Trade2026");

        login("login@example.com", "Trade2026").andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Atulya"))
                .andExpect(jsonPath("$.password").doesNotExist());
        login("login@example.com", "Wrong1234").andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
        login("nobody@example.com", "Trade2026").andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password."));
    }

    @Test
    void fiveWrongPasswordsLockTheAccount() throws Exception {
        register("Atulya", "lock@example.com", "Trade2026");
        for (int i = 1; i <= 4; i++) {
            login("lock@example.com", "Wrong1234").andExpect(status().isUnauthorized());
        }
        login("lock@example.com", "Wrong1234").andExpect(status().isLocked())
                .andExpect(jsonPath("$.code").value("ACCOUNT_LOCKED"));
        login("lock@example.com", "Trade2026").andExpect(status().isLocked());
    }

    @Test
    void reactDevServerIsAllowedByCors() throws Exception {
        mockMvc.perform(options("/api/users/login")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }
}
