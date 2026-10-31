# TradeLab Backend — Spring Boot

**TradeLab** is a paper-trading simulator: each user gets **₹10,00,000 of virtual cash** to buy and sell stocks at simulated prices. This Spring Boot application is its REST backend. It stores users, accounts, stocks, holdings and orders in an H2 database, enforces the trading rules, and handles sign-up and login with hashed passwords and failed-login lockout.

**Stack:** Java 25 · Spring Boot 3.5 · Maven (wrapper included) · Spring Web · Spring Data JPA · H2 · Spring Security (BCrypt + JWT) · Bean Validation · JUnit 5 / Mockito / MockMvc.

## Running it

```powershell
# 1. Backend (port 8080)
cd backend
.\mvnw.cmd spring-boot:run

# 2. React frontend (port 5173), in a second terminal from the project root
npm install
npm run dev
```

Open http://localhost:5173 and sign up, or log in with the seeded demo user:

| Email | Password | Owns |
|---|---|---|
| `demo@tradelab.com` | `Demo@1234` | account 1 |

The database is **in memory**, so every backend restart starts fresh: users you signed up are gone, and the React app will ask you to log in again.

**H2 console:** http://localhost:8080/h2-console with JDBC URL `jdbc:h2:mem:tradelabdb`, user `sa` and an empty password.

## Architecture

```
Client ──HTTP──> Controller ──> Service ──> Repository ──> H2 Database
               (@RestController) (@Service)  (JpaRepository)
```

| Layer | Classes |
|---|---|
| Presentation | `StockController`, `AccountController`, `OrderController`, `AuthController` |
| Business | `StockService`, `TradingService`, `AuthService`, `AccountAccess`, `TokenService`, `TradeLabUserDetailsService` |
| Data access | `StockRepository`, `AccountRepository`, `HoldingRepository`, `OrderRepository`, `AppUserRepository`, `LoginAttemptRepository` |
| Domain | `Stock`, `Account`, `Holding`, `TradeOrder`, `OrderSide`, `AppUser` (table `app_users`), `LoginAttempt` (table `login_attempts`) |
| Config | `SecurityConfig`, `DataSeeder` (10 stocks + demo user), `RepositoryDemo` (prints each repository operation at startup) |

## REST endpoints

| Method | URL | Login needed |
|---|---|---|
| POST | `/api/auth/signup` `{name, email, password}` | No |
| POST | `/api/auth/login` `{email, password}` | No |
| POST | `/api/auth/guest` | No |
| GET | `/api/auth/me` | Yes |
| GET | `/api/auth/me/login-attempts` | Yes |
| GET | `/api/stocks`, `/api/stocks/{symbol}` | No |
| GET | `/api/accounts/{id}`, `/api/accounts/{id}/holdings` | Yes, and you must own `{id}` |
| POST | `/api/accounts/{id}/orders` `{symbol, side, quantity}` | Yes, and you must own `{id}` |
| GET | `/api/accounts/{id}/orders` | Yes, and you must own `{id}` |

Signup and login return `{"token": "...", "expiresAt": "...", "user": {...}}`. Send the token on later requests as `Authorization: Bearer <token>`. Without it you get `401`; for someone else's account, `403`.

## Business rules

**Trading** (`TradingService`):
1. Quantity must be 1 to 100,000.
2. A buy needs enough cash.
3. You can't sell more shares than you hold.
4. A sell books realized P&L against the average cost.

**Users** (`AuthService`):
1. Name is 2 to 40 characters, and the email must be valid and not already registered.
2. Password is 8 to 72 characters with a letter and a number. It is stored only as a BCrypt hash.
3. Every login attempt is recorded. After **5 wrong passwords in 15 minutes**, the account is locked for **15 minutes** (`423 Locked`).
4. A wrong email or password always gives the same `401` message.

**Access** (`AccountAccess` + `@PreAuthorize`): a user can only use their own account.

Lockout and token settings are in `application.properties` (`tradelab.security.*`, `tradelab.jwt.*`).

## Tests

```powershell
.\mvnw.cmd test     # 22 tests
```

| Test class | Type | Covers |
|---|---|---|
| `TradingServiceTest` | `@SpringBootTest` | Trading rules |
| `AuthServiceTest` | `@SpringBootTest` | Signup rules, hashing, wrong password, lockout |
| `SecurityFlowTest` | `@SpringBootTest` + MockMvc | Public vs protected URLs, sign up and trade, 403 on other accounts, bad tokens |
| `OrderControllerTest` | `@WebMvcTest` + `jwt()` | Web layer with real security rules |
| `RepositoryTest` | `@DataJpaTest` | CRUD, derived queries, user and login-attempt queries |

## Reports

- `TradeLab_SpringBoot_Report.docx` covers Activity 4: the basic Spring Boot application.
- `TradeLab_Activity5_DataLayer_Report.docx` covers Activity 5: the data layer, users and login attempts.
- `report-src/` holds the scripts and images that generate the Activity 5 report:

  ```powershell
  cd report-src
  npm install
  node build5.js out\Activity5.docx
  ```

  The ER diagram is drawn by `er.py`, which needs `pip install pymupdf`.
