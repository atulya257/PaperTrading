import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/layout/AuthLayout.jsx'
import Button from '../components/ui/Button.jsx'
import TextField from '../components/ui/TextField.jsx'
import { AUTH_ERRORS } from '../services/authService.js'
import { useAuth } from '../context/AuthContext.jsx'
import { usePageTitle } from '../hooks/usePageTitle.js'

export default function Login() {
  usePageTitle('Log in')
  const { login, guestLogin } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const emailRef = useRef(null)

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const result = await login({ email })
    if (!result.ok) {
      setError(result.error)
      setBusy(false)
      emailRef.current?.focus()
    }
  }

  return (
    <AuthLayout
      title="Log in"
      subtitle="Welcome back. Pick up where you left off."
      footer={
        <>
          New to TradeLab? <Link to="/signup">Create a demo account</Link>
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
          error={error?.message}
          autoFocus
          ref={emailRef}
        />
        {error?.code === AUTH_ERRORS.NOT_FOUND && (
          <p className="auth-alert">
            Accounts only exist in the browser they were created in.{' '}
            <Link to="/signup" state={{ email }} className="auth-link">
              Create one with this email
            </Link>
            .
          </p>
        )}
        <Button type="submit" size="lg" block loading={busy}>
          Log in
        </Button>
      </form>

      <div className="auth-divider">or</div>
      <Button variant="secondary" size="lg" block onClick={() => guestLogin()}>
        Try demo instantly
      </Button>
    </AuthLayout>
  )
}
