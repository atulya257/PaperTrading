package com.tradelab;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point. @SpringBootApplication = @Configuration + @ComponentScan + @EnableAutoConfiguration,
 * so controllers, services and repositories in sub-packages are discovered and the web server,
 * database and JPA are configured automatically.
 */
@SpringBootApplication
public class TradeLabApplication {

    public static void main(String[] args) {
        SpringApplication.run(TradeLabApplication.class, args);
    }
}
