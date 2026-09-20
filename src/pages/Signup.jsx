import { useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AuthLayout from '../components/layout/AuthLayout.jsx'
import Button from '../components/ui/Button.jsx'
import TextField from '../components/ui/TextField.jsx'
import { AUTH_ERRORS } from '../services/authService.js'
import { useAuth } from '../context/AuthContext.jsx'
import { usePageTitle } from '../hooks/usePageTitle.js'

export default function Signup() {
  usePageTitle('Create account')
  const { signup, guestLogin } = useAuth()
  const location = useLocation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState(location.state?.email ?? '')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const nameRef = useRef(null)
  const emailRef = useRef(null)

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const result = await signup({ name, email })
    if (!result.ok) {
      setError(result.error)
      setBusy(false)
      ;(result.error.field === 'name' ? nameRef : emailRef).current?.focus()
    }
  }

  const fieldError = (field) => (error?.field === field ? error.message : undefined)

  return (
    <AuthLayout
      title="Create your demo account"
      subtitle="You will start with ₹10,00,000 of virtual cash."
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
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
          hint="Used only to tell demo accounts apart in this browser."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldError('email')}
          ref={emailRef}
        />
        {error?.code === AUTH_ERRORS.EMAIL_TAKEN && (
          <p className="auth-alert">
            <Link to="/login" className="auth-link">
              Log in with this email
            </Link>{' '}
            to continue with that account.
          </p>
        )}
        <Button type="submit" size="lg" block loading={busy}>
          Create account
        </Button>
      </form>

      <div className="auth-divider">or</div>
      <Button variant="secondary" size="lg" block onClick={() => guestLogin()}>
        Try demo instantly
      </Button>
    </AuthLayout>
  )
}
