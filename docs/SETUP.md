# Local setup

This guide starts the full app: MySQL, the Stock Service, the User Service and the React app. Commands are shown for Windows PowerShell, with macOS/Linux equivalents where they differ.

## 1. Prerequisites

| Tool | Version | Check with |
|---|---|---|
| Node.js | 20.19+ or 22.12+ (required by Vite 8) | `node --version` |
| JDK | 25 (set in each `pom.xml`) | `java --version` |
| MySQL Server | 8.x, on `localhost:3306` | MySQL Workbench or `mysql --version` |
| Git | any recent version | `git --version` |

Maven does not need to be installed: each Spring Boot project includes the Maven Wrapper (`mvnw.cmd` / `mvnw`), which downloads Maven on first use.

## 2. Get the code

```powershell
git clone https://github.com/atulya257/PaperTrading.git
cd PaperTrading
npm install
```

On macOS/Linux, make the Maven Wrapper scripts executable once:

```bash
chmod +x services/stock-service/mvnw services/user-service/mvnw backend-monolith/mvnw
```

## 3. Prepare MySQL

The User Service connects to `jdbc:mysql://localhost:3306/tradelab_users` and creates the database and tables itself on first start. You only need:

1. MySQL 8 running on port 3306 (on Windows, the `MySQL80` service).
2. A MySQL user that can create a database. By default the service uses `root`.

To use a dedicated user instead of `root`, run this once in MySQL Workbench or the `mysql` client, replacing the password:

```sql
CREATE USER 'tradelab'@'localhost' IDENTIFIED BY '<choose a password>';
GRANT ALL PRIVILEGES ON tradelab_users.* TO 'tradelab'@'localhost';
```

## 4. Environment variables

The User Service reads its MySQL login from environment variables in the terminal that starts it. They are never stored in the repository.

| Variable | Default | Example |
|---|---|---|
| `MYSQL_PASSWORD` | empty | `$env:MYSQL_PASSWORD = "<your MySQL password>"` |
| `MYSQL_USER` | `root` | `$env:MYSQL_USER = "tradelab"` |

On macOS/Linux use `export MYSQL_PASSWORD='<your MySQL password>'`.

The React app needs no configuration. It looks for the services on ports 8081 and 8082 of the computer that served the page. To point it elsewhere, copy [`.env.example`](../.env.example) to `.env.local` and uncomment the lines. `.env.local` is ignored by Git.

## 5. Start everything

Use three terminals, from the project folder.

**Terminal 1: Stock Service (port 8081)**

```powershell
cd services\stock-service
.\mvnw.cmd spring-boot:run          # macOS/Linux: ./mvnw spring-boot:run
```

Ready when the log shows `Tomcat started on port 8081`. Check http://localhost:8081/api/stocks.

**Terminal 2: User Service (port 8082)**

```powershell
cd services\user-service
$env:MYSQL_PASSWORD = "<your MySQL password>"
.\mvnw.cmd spring-boot:run          # macOS/Linux: ./mvnw spring-boot:run
```

Ready when the log shows `Tomcat started on port 8082`. Check http://localhost:8082/api/users (an empty list `[]` on a new database).

**Terminal 3: React app (port 5173)**

```powershell
npm run dev
```

Open http://localhost:5173 and create an account.

Keep all three terminals open: closing one stops that part.

## 6. Open it on a phone (optional)

1. Connect the phone to the same Wi-Fi as the computer.
2. On Windows, allow Node.js and Java through Windows Firewall when asked. If the Wi-Fi is set to **Public**, either set it to **Private** (Settings → Network & internet → Wi-Fi → your network) or allow both programs on public networks.
3. Start the React app with `npm run dev:phone` instead of `npm run dev`. It prints a `Network:` address such as `http://192.168.x.x:5173`.
4. Open that address on the phone. The app finds the services on the same computer automatically.

## 7. Run the earlier monolith (optional)

The standalone backend from Activities 4 and 5 needs only the JDK: no MySQL, and the other parts don't need to be running.

```powershell
cd backend-monolith
.\mvnw.cmd spring-boot:run
```

It runs on http://localhost:8080. See [backend-monolith/README.md](../backend-monolith/README.md) for the demo login, the H2 console and a Postman walkthrough.

## 8. Checks

```powershell
npm run lint
npm run build
cd services\stock-service; .\mvnw.cmd test
cd services\user-service;  .\mvnw.cmd test       # uses H2, so MySQL is not needed
cd backend-monolith;       .\mvnw.cmd test
```

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| "Can't reach the TradeLab User Service" on the login or sign-up page | The User Service is not running, or it stopped. Start it (step 5), then submit the form again |
| User Service log: `Access denied for user 'root'@'localhost'` | `MYSQL_PASSWORD` is missing or wrong in that terminal. Set it and start again |
| User Service log: `Communications link failure` | MySQL is not running. Start the `MySQL80` service (Windows: Services app) |
| `Port 8081 (or 8082) was already in use` | That service is already running in another terminal. Use it, or stop the other one first |
| The market loads but the Stock Service is off | Expected: the app falls back to its built-in stock list. Start the Stock Service to serve the list from the API |
| Phone shows the page but cannot log in | Windows Firewall is blocking Java on this network. See step 6 |
| `./mvnw: Permission denied` (macOS/Linux) | Run the `chmod +x` command from step 2 |
