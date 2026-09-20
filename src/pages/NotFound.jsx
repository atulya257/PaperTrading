import { Link } from 'react-router-dom'
import Logo from '../components/layout/Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { usePageTitle } from '../hooks/usePageTitle.js'
import './NotFound.css'

export default function NotFound() {
  const { isAuthenticated } = useAuth()
  usePageTitle('Page not found')
  return (
    <main className="notfound" id="main">
      <Logo />
      <p className="notfound-code num">404</p>
      <h1>This page does not exist</h1>
      <p className="notfound-text">
        The link may be broken or the page may have moved. Head back and keep practising.
      </p>
      <div className="notfound-actions">
        <Link to={isAuthenticated ? '/dashboard' : '/login'} className="notfound-btn primary">
          {isAuthenticated ? 'Go to dashboard' : 'Log in'}
        </Link>
        <Link to="/" className="notfound-btn">
          Home
        </Link>
      </div>
    </main>
  )
}
