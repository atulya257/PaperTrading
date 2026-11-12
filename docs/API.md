# API

All endpoints accept and return JSON. Both microservices allow cross-origin requests from port 5173 only. Ready-made requests for the Stock Service are in [services/stock-service/stock-test.http](../services/stock-service/stock-test.http).

## Stock Service: `http://localhost:8081`

| Method | Path | Success | Errors |
|---|---|---|---|
| GET | `/api/stocks` | `200` list of stocks | |
| GET | `/api/stocks?sector=IT` | `200` stocks in that sector | |
| GET | `/api/stocks/{symbol}` | `200` one stock (symbol is case-insensitive) | `404` unknown symbol |
| POST | `/api/stocks` | `201` the saved stock | `400` invalid input, `409` symbol already listed |

**Stock object** (`GET /api/stocks/TCS`):

```json
{
  "id": 4,
  "symbol": "TCS",
  "name": "Tata Consultancy Services",
  "sector": "IT",
  "exchange": "NSE",
  "price": 3950.00,
  "marketCapCr": 1430000,
  "pe": 30.0,
  "description": "Global IT services, consulting and business solutions provider.",
  "beta": 0.75,
  "sectorLoad": 1.1,
  "dailyVol": 0.0115
}
```

`price` is a reference price in rupees and `marketCapCr` is in crores. `beta`, `sectorLoad` and `dailyVol` tune how the React simulator moves the stock and are optional when adding one.

**Add a stock:** `symbol`, `name`, `sector` and a `price` above zero are required. The symbol is upper-cased and must be 1 to 20 letters, digits, `&` or `-`. `exchange` defaults to `NSE`.

```http
POST /api/stocks
Content-Type: application/json

{ "symbol": "ZOMATO", "name": "Zomato", "sector": "Consumer", "price": 215.50,
  "description": "Food delivery and quick-commerce platform." }
```

**Errors** use Spring Boot's standard format:

```json
{ "timestamp": "...", "status": 404, "error": "Not Found", "message": "No stock with symbol NOPE.", "path": "/api/stocks/NOPE" }
```

The database is in memory, so added stocks disappear when the service restarts.

## User Service: `http://localhost:8082`

| Method | Path | Body | Success | Errors |
|---|---|---|---|---|
| POST | `/api/users` | `{ name, email, password }` | `201` the new user | `400` `INVALID_NAME`, `INVALID_EMAIL`, `WEAK_PASSWORD`; `409` `EMAIL_TAKEN` |
| POST | `/api/users/login` | `{ email, password }` | `200` the user | `400` `INVALID_REQUEST`; `401` `INVALID_CREDENTIALS`; `423` `ACCOUNT_LOCKED` |
| GET | `/api/users` | | `200` all users | |
| GET | `/api/users/{id}` | | `200` one user | `404` `NOT_FOUND` |

**User object** (never contains the password or its hash):

```json
{ "id": 1, "name": "Asha Rao", "email": "asha@example.com", "createdAt": "2026-11-12T10:15:30Z" }
```

**Rules:**
- Name: 2 to 40 characters, with spaces collapsed.
- Email: trimmed, lower-cased and valid.
- Password: 8 to 72 characters with at least one letter and one number.
- Login: a wrong email and a wrong password give the same `401`. After 5 failures within 15 minutes, the account is locked for 15 minutes (`423`).

**Errors:**

```json
{ "code": "WEAK_PASSWORD", "field": "password", "message": "Use 8 to 72 characters with at least one letter and one number." }
```

`field` names the input the message belongs to and is left out for general errors.

**Example (PowerShell):**

```powershell
$body = @{ name = "Asha Rao"; email = "asha@example.com"; password = "Trade2026" } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:8082/api/users -Method Post -ContentType "application/json" -Body $body
```

## How the React app uses them

| When | Call |
|---|---|
| App start | `GET /api/stocks` (falls back to a built-in list if it fails) |
| Sign up | `POST /api/users` |
| Log in | `POST /api/users/login` |
| Page reload while signed in | `GET /api/users/{id}` to confirm the account still exists |

If the User Service cannot be reached or returns a server error, the forms show "Can't reach the TradeLab User Service. Make sure it is running on port 8082."

## Earlier monolith: `http://localhost:8080`

Not used by the React app. Protected endpoints need `Authorization: Bearer <token>` from sign-up or login.

| Method | Path | Login needed |
|---|---|---|
| POST | `/api/auth/signup`, `/api/auth/login`, `/api/auth/guest` | No |
| GET | `/api/auth/me`, `/api/auth/me/login-attempts` | Yes |
| GET | `/api/stocks`, `/api/stocks/{symbol}` | No |
| GET | `/api/accounts/{id}`, `/api/accounts/{id}/holdings` | Yes, and you must own the account |
| POST, GET | `/api/accounts/{id}/orders` | Yes, and you must own the account |

A step-by-step Postman walkthrough is in [backend-monolith/README.md](../backend-monolith/README.md#testing-the-endpoints-with-postman).
