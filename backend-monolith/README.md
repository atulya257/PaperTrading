# TradeLab Backend Monolith (Activities 4 and 5)

This is the **earlier, standalone version** of the TradeLab backend: a single Spring Boot application that stores users, accounts, stocks, holdings and orders in one H2 database, applies the trading rules, and handles sign-up and login with Spring Security and JWT tokens.

**The current React app does not use it.** The React app talks to the two microservices in `services/`:

| Part | Port | Used by the React app |
|---|---|---|
| Stock Service (`services/stock-service`) | 8081 | Yes |
| User Service (`services/user-service`) | 8082 | Yes |
| This backend monolith (`backend-monolith`) | 8080 | No. Kept to show the earlier implementation and the Spring Boot concepts below |

It runs on its own and is tested with Postman, the H2 console or its own JUnit tests.

**What it shows that the microservices do not:**
- entity relationships (`@OneToOne`, `@ManyToOne`)
- `@Transactional` trading logic on the server
- Spring Security with JWT tokens, protected URLs and per-account access checks (`@PreAuthorize`)
- Bean Validation (`@Valid`)
- a global exception handler (`@RestControllerAdvice`)
- the Activity 5 repository demo, and MockMvc tests

**Stack:** Java 25, Spring Boot 3.5, Maven (wrapper included), Spring Web, Spring Data JPA, H2, Spring Security (BCrypt + JWT via OAuth2 Resource Server), Bean Validation, JUnit 5, Mockito, MockMvc.

## Running it

It needs only JDK 25. No MySQL is required, and the React app and microservices do not need to be running.

```powershell
cd backend-monolith
.\mvnw.cmd spring-boot:run
```

It starts on **http://localhost:8080**. At startup it:
1. Creates the tables in an in-memory H2 database.
2. Adds 10 stocks and a demo user (`DataSeeder`).
3. Prints the Activity 5 repository demo to the console (`RepositoryDemo`).

| Demo login | Password | Owns |
|---|---|---|
| `demo@tradelab.com` | `Demo@1234` | account 1, with ₹10,00,000 of virtual cash |

The database is in memory, so every restart starts fresh. Users you signed up and orders you placed are gone after a restart.

Stop it with `Ctrl+C`.

**H2 console:**
1. Open http://localhost:8080/h2-console.
2. Enter JDBC URL `jdbc:h2:mem:tradelabdb`, user `sa` and an empty password, then click Connect.
3. Try `SELECT * FROM STOCK;`, `SELECT * FROM ACCOUNT;`, `SELECT * FROM HOLDING;`, `SELECT * FROM TRADE_ORDER;`, `SELECT * FROM APP_USERS;` and `SELECT * FROM LOGIN_ATTEMPTS;`.

## Testing the endpoints with Postman

Public endpoints work straight away. Account and order endpoints need a token from login.

**1. Get the stocks (no login)**

`GET http://localhost:8080/api/stocks`, or `GET http://localhost:8080/api/stocks/RELIANCE` for one stock. Both return `200 OK`.

**2. Log in and copy the token**

`POST http://localhost:8080/api/auth/login`. Body: raw, JSON.

```json
{ "email": "demo@tradelab.com", "password": "Demo@1234" }
```

Response `200 OK`:

```json
{ "token": "eyJhbGciOi...", "expiresAt": "...", "user": { "id": 1, "name": "Demo Trader", "email": "demo@tradelab.com", "guest": false, "accountId": 1, "createdAt": "..." } }
```

To avoid copying the token by hand, add this to the login request's **Scripts** tab, under Post-response:

```js
pm.collectionVariables.set('token', pm.response.json().token)
```

**3. Send the token with the protected requests**

In each protected request (or once on the collection), open **Authorization**, choose **Bearer Token** and enter `{{token}}`. This sends the header `Authorization: Bearer <token>`.

**4. Use the account**

| Request | Body | Expected |
|---|---|---|
| `GET /api/auth/me` | | `200` and the logged-in user |
| `GET /api/accounts/1` | | `200` with cash, initial capital and realised P&L |
| `POST /api/accounts/1/orders` | `{ "symbol": "TCS", "side": "BUY", "quantity": 5 }` | `201` and the saved order |
| `GET /api/accounts/1/holdings` | | `200` and the shares now held |
| `POST /api/accounts/1/orders` | `{ "symbol": "TCS", "side": "SELL", "quantity": 2 }` | `201`, with `realizedPnl` filled in |
| `GET /api/accounts/1/orders` | | `200` with the newest order first |
| `GET /api/auth/me/login-attempts` | | `200` and this user's login history |

**5. Show the error handling**

| Try this | Expected |
|---|---|
| `GET /api/accounts/1` with no token | `401` `UNAUTHORIZED` |
| Sign up a second user, then use their token on `/api/accounts/1` | `403` `FORBIDDEN` (you can only use your own account) |
| Buy `{ "symbol": "TCS", "side": "BUY", "quantity": 0 }` | `400` `INVALID_QUANTITY` |
| Sell more shares than you hold | `400` with a business-rule code |
| Order with `"side": "HOLD"` | `400` `INVALID_REQUEST` |
| Log in with a wrong password | `401`; after 5 wrong passwords, `423` (locked for 15 minutes) |
| `GET /api/stocks/NOPE` | `404` `NOT_FOUND` |

Errors always come back as JSON: `{ "code": "...", "message": "..." }`, plus `"field"` when one input is at fault.

**Signing up a new user:** `POST /api/auth/signup` with `{ "name": "Asha", "email": "asha@example.com", "password": "Trade1234" }` returns `201` with a token. The response's `user.accountId` is the new account to use in the account URLs.

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

## Architecture

```
Postman / browser ──HTTP──> Controller ──> Service ──> Repository ──> H2 database
                         (@RestController) (@Service)  (JpaRepository)
```

| Layer | Classes |
|---|---|
| Presentation | `StockController`, `AccountController`, `OrderController`, `AuthController` |
| Business | `StockService`, `TradingService`, `AuthService`, `AccountAccess`, `TokenService`, `TradeLabUserDetailsService` |
| Data access | `StockRepository`, `AccountRepository`, `HoldingRepository`, `OrderRepository`, `AppUserRepository`, `LoginAttemptRepository` |
| Domain | `Stock`, `Account`, `Holding`, `TradeOrder`, `OrderSide`, `AppUser` (table `app_users`), `LoginAttempt` (table `login_attempts`) |
| Config | `SecurityConfig`, `DataSeeder` (10 stocks + demo user), `RepositoryDemo` (prints each repository operation at startup) |
| Errors | `GlobalExceptionHandler`, `BusinessRuleException`, `LoginFailedException`, `NotFoundException` |

**Relationships:** each `AppUser` owns one `Account` (`@OneToOne`). An `Account` has many `Holding` rows and many `TradeOrder` rows (each `@ManyToOne` to `Account`).

## Business rules

**Trading** (`TradingService`):
1. Quantity must be 1 to 100,000.
2. A buy needs enough cash.
3. You can't sell more shares than you hold.
4. A sell books realised P&L against the average cost.

**Users** (`AuthService`):
1. Name is 2 to 40 characters, and the email must be valid and not already registered.
2. Password is 8 to 72 characters with a letter and a number. It is stored only as a BCrypt hash.
3. Every login attempt is recorded. After **5 wrong passwords in 15 minutes**, the account is locked for **15 minutes** (`423 Locked`).
4. A wrong email or password always gives the same `401` message.

**Access** (`AccountAccess` + `@PreAuthorize`): a user can only use their own account.

Lockout and token settings are in `src/main/resources/application.properties` (`tradelab.security.*`, `tradelab.jwt.*`).

## Tests

```powershell
cd backend-monolith
.\mvnw.cmd test     # 22 tests
```

| Test class | Type | Covers |
|---|---|---|
| `TradingServiceTest` | `@SpringBootTest` | Trading rules |
| `AuthServiceTest` | `@SpringBootTest` | Signup rules, hashing, wrong password, lockout |
| `SecurityFlowTest` | `@SpringBootTest` + MockMvc | Public vs protected URLs, sign up and trade, 403 on other accounts, bad tokens |
| `OrderControllerTest` | `@WebMvcTest` + `jwt()` | Web layer with real security rules |
| `RepositoryTest` | `@DataJpaTest` | CRUD, derived queries, user and login-attempt queries |
