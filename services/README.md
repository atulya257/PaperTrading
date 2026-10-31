# TradeLab microservices

Two independent Spring Boot applications that the React app (port 5173) calls directly:

| Service | Port | Database | Endpoints |
|---|---|---|---|
| `stock-service` | 8081 | H2 in memory (`jdbc:h2:mem:stockdb`) | `GET /api/stocks[?sector=]`, `GET /api/stocks/{symbol}`, `POST /api/stocks` |
| `user-service` | 8082 | MySQL `tradelab_users` | `GET /api/users`, `GET /api/users/{id}`, `POST /api/users`, `POST /api/users/login` |

## Running everything

Use three PowerShell windows.

```powershell
# 1. Stock Service
cd C:\paperTradingReactFSW\services\stock-service
.\mvnw.cmd spring-boot:run

# 2. User Service (MySQL must be running; type your own MySQL password)
cd C:\paperTradingReactFSW\services\user-service
$env:MYSQL_PASSWORD = "your-mysql-root-password"
.\mvnw.cmd spring-boot:run

# 3. React app
cd C:\paperTradingReactFSW
npm run dev
```

Then open http://localhost:5173.

- The Markets page footer says whether its stocks came from the Stock Service.
- Log in and Sign up use the User Service.
- If a service is down, the app still opens: Markets uses its built-in stock list, and "Try demo instantly" works without an account.

The MySQL password is read from the `MYSQL_PASSWORD` environment variable and is never stored in a file. If your MySQL user isn't `root`, also set `$env:MYSQL_USER`. The `tradelab_users` database is created automatically on the first start.

## Tests

```powershell
cd services\stock-service; .\mvnw.cmd test   # 5 tests
cd services\user-service;  .\mvnw.cmd test   # 5 tests, uses H2 in MySQL mode, no password needed
```

## Report

- `TradeLab_Microservices_Report.docx` is the report for this unit.
- `report-src/` holds the scripts and images that generate it:
  - `node build6.js out\Microservices.docx` builds the report.
  - `python arch.py images\architecture.png` draws the architecture diagram.
