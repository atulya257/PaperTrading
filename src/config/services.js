// The services run on the same computer as this page, so a phone on the same Wi-Fi reaches them too.
// Override with a .env file, e.g. VITE_STOCK_SERVICE_URL=http://localhost:9091
const host = window.location.hostname

export const STOCK_SERVICE_URL = import.meta.env.VITE_STOCK_SERVICE_URL ?? `http://${host}:8081`
export const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL ?? `http://${host}:8082`
