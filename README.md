# TradeLab

TradeLab is a **paper trading simulator for Indian stocks** built using React, with a Spring Boot backend (in `backend/`) for user accounts and the trading API.

It allows users to practice buying and selling stocks using virtual money without using real money or connecting to a real stock market.

## Features

- Virtual starting balance of ₹10,00,000
- Simulated stock prices that change over time
- Buy and sell stocks
- Portfolio and holdings tracking
- Profit and Loss tracking
- Watchlist
- Order history
- Stock search
- Stock details and price charts
- Market overview
- Simulated news
- Sign up and log in with a password (stored as a BCrypt hash on the server)
- Account locks for 15 minutes after 5 wrong passwords
- Responsive design for desktop and mobile
- Portfolio data saved per user using localStorage

## Technologies Used

- React
- JavaScript
- React Router
- CSS
- Recharts
- Vite
- localStorage
- Spring Boot, Spring Data JPA, Spring Security and H2 (backend)

## How to Run

Start the backend first, because login and signup need it:

```bash
cd backend
./mvnw spring-boot:run      # Windows: .\mvnw.cmd spring-boot:run
```

Then start the React app:

1. Install Node.js
2. Open the project folder in a terminal
3. Install the required packages:

```bash
npm install
```

4. Start the app and open http://localhost:5173:

```bash
npm run dev
```

Demo login: `demo@tradelab.com` / `Demo@1234`. See `backend/README.md` for the API, the H2 console and the tests.
