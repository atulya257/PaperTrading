// Where the TradeLab microservices run. Each one is a separate Spring Boot application on its own port.
// They can be changed without editing code via a .env file, e.g. VITE_STOCK_SERVICE_URL=http://localhost:9091
export const STOCK_SERVICE_URL = import.meta.env.VITE_STOCK_SERVICE_URL ?? 'http://localhost:8081'
export const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL ?? 'http://localhost:8082'
