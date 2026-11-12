import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/layout/AuthLayout.jsx'
import Button from '../components/ui/Button.jsx'
import TextField from '../components/ui/TextField.jsx'
import { AUTH_ERRORS } from '../services/authService.js'
import { useAuth } from '../context/AuthContext.jsx'
import { safeRedirectPath } from '../components/routing/Guards.jsx'
import { usePageTitle } from '../hooks/usePageTitle.js'

export default function Login() {
  usePageTitle('Log in')
  const { login } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState(location.state?.email ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const emailRef = useRef(null)
  const passwordRef = useRef(null)
  const submitting = useRef(false)
  const navigate = useNavigate()

  async function finish(action, destination) {
    if (submitting.current) return
    submitting.current = true
    setBusy(true)
    setError(null)
    const result = await action()
    if (result.ok) {
      navigate(destination, { replace: true })
      return
    }
    setError(result.error)
    submitting.current = false
    setBusy(false)
    if (result.error.field === 'email') emailRef.current?.focus()
    else if (result.error.field === 'password') {
      setPassword('')
      passwordRef.current?.focus()
    }
  }

  function onSubmit(e) {
    e.preventDefault()
    finish(() => login({ email, password }), safeRedirectPath(location.state?.from))
  }

  const fieldError = (field) => (error?.field === field ? error.message : undefined)
  const generalError = error && error.field !== 'email' && error.field !== 'password' ? error.message : null

  return (
    <AuthLayout
      title="Log in"
      subtitle="Welcome back. Pick up where you left off."
      footer={
        <>
          Don't have an account? <Link to="/signup" state={{ allowAuthenticated: true }}>Sign up</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <TextField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldError('email')}
          autoFocus
          ref={emailRef}
        />
        <TextField
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldError('password')}
          ref={passwordRef}
        />
        {error?.code === AUTH_ERRORS.INVALID_CREDENTIALS && (
          <p className="auth-alert">
            After 5 wrong passwords in a row the account is locked for 15 minutes.{' '}
            <Link to="/signup" state={{ email, allowAuthenticated: true }} className="auth-link">
              New here? Create an account
            </Link>
            .
          </p>
        )}
        {generalError && (
          <p className="auth-alert" role="alert">
            {generalError}
          </p>
        )}
        <Button type="submit" size="lg" block loading={busy}>
          Log in
        </Button>
      </form>

    </AuthLayout>
  )
}
