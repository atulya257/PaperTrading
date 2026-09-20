import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext.jsx'
import { MarketProvider } from './context/MarketContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import RouteChangeHandler from './components/routing/RouteChangeHandler.jsx'
import ErrorBoundary from './components/ui/ErrorBoundary.jsx'
import AppRoutes from './routes.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary variant="page">
        <ToastProvider>
          <MarketProvider>
            <AuthProvider>
              <RouteChangeHandler />
              <AppRoutes />
            </AuthProvider>
          </MarketProvider>
        </ToastProvider>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
