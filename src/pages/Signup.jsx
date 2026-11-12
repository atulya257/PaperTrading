import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/layout/AuthLayout.jsx'
import Button from '../components/ui/Button.jsx'
import TextField from '../components/ui/TextField.jsx'
import { AUTH_ERRORS, PASSWORD_MIN } from '../services/authService.js'
import { useAuth } from '../context/AuthContext.jsx'
import { safeRedirectPath } from '../components/routing/Guards.jsx'
import { usePageTitle } from '../hooks/usePageTitle.js'

export default function Signup() {
  usePageTitle('Create account')
  const { signup } = useAuth()
  const location = useLocation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState(location.state?.email ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const nameRef = useRef(null)
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
    const refs = { name: nameRef, email: emailRef, password: passwordRef }
    refs[result.error.field]?.current?.focus()
  }

  function onSubmit(e) {
    e.preventDefault()
    finish(() => signup({ name, email, password }), safeRedirectPath(location.state?.from))
  }

  const fieldError = (field) => (error?.field === field ? error.message : undefined)
  const generalError = error && !['name', 'email', 'password'].includes(error.field) ? error.message : null

  return (
    <AuthLayout
      title="Create your account"
      subtitle="You will start with ₹10,00,000 of virtual cash."
      footer={
        <>
          Already have an account? <Link to="/login" state={{ allowAuthenticated: true }}>Log in</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <TextField
          label="Name"
          name="name"
          autoComplete="name"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldError('name')}
          autoFocus
          ref={nameRef}
        />
        <TextField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          hint="You will log in with this email."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldError('email')}
          ref={emailRef}
        />
        <TextField
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          hint={`At least ${PASSWORD_MIN} characters, with a letter and a number.`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldError('password')}
          ref={passwordRef}
        />
        {error?.code === AUTH_ERRORS.EMAIL_TAKEN && (
          <p className="auth-alert">
            <Link to="/login" state={{ email, allowAuthenticated: true }} className="auth-link">
              Log in with this email
            </Link>{' '}
            to continue with that account.
          </p>
        )}
        {generalError && (
          <p className="auth-alert" role="alert">
            {generalError}
          </p>
        )}
        <Button type="submit" size="lg" block loading={busy}>
          Create account
        </Button>
      </form>

    </AuthLayout>
  )
}
