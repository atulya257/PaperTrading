import { STORAGE_KEYS } from '../config/constants.js'
import * as storage from './storage.js'

// Accounts live on the TradeLab Spring Boot server. In development Vite forwards /api to it (see vite.config.js).
const API = '/api/auth'

export const AUTH_ERRORS = {
  INVALID_NAME: 'INVALID_NAME',
  INVALID_EMAIL: 'INVALID_EMAIL',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  EMAIL_TAKEN: 'EMAIL_TAKEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  INVALID_REQUEST: 'INVALID_REQUEST',
  SERVER_UNAVAILABLE: 'SERVER_UNAVAILABLE',
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NAME_MIN = 2
const NAME_MAX = 40
export const PASSWORD_MIN = 8

const fail = (code, field, message) => ({ ok: false, error: { code, field, message } })
const normalizeEmail = (email) => String(email ?? '').trim().toLowerCase()

const SERVER_DOWN = fail(
  AUTH_ERRORS.SERVER_UNAVAILABLE,
  null,
  'Can’t reach the TradeLab server. Make sure the Spring Boot backend is running on port 8080.',
)

// The server's user, shaped the way the rest of the app expects. The id is the email, so each
// person's portfolio in this browser stays theirs even though the server's numeric ids restart.
function toUser(serverUser) {
  return {
    id: serverUser.email,
    name: serverUser.name,
    email: serverUser.guest ? null : serverUser.email,
    isGuest: serverUser.guest,
    accountId: serverUser.accountId,
    createdAt: Date.parse(serverUser.createdAt) || Date.now(),
  }
}

const readSession = () => {
  const session = storage.read(STORAGE_KEYS.session, { fallback: null })
  return session && typeof session.token === 'string' ? session : null
}

async function request(path, { method = 'GET', body, token } = {}) {
  let response
  try {
    response = await fetch(`${API}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    return { networkError: true }
  }
  const data = await response.json().catch(() => null)
  return { status: response.status, ok: response.ok, data }
}

function signedIn({ token, user }) {
  const appUser = toUser(user)
  storage.write(STORAGE_KEYS.session, { token, user: appUser })
  return { ok: true, user: appUser }
}

function fromServerError(res, fallbackField) {
  if (res.networkError || res.status >= 500 || !res.data?.code) return SERVER_DOWN
  return fail(res.data.code, res.data.field ?? fallbackField, res.data.message)
}

/** Restores the saved login if the server still accepts its token. */
export async function getSession() {
  const session = readSession()
  if (!session) return null
  const res = await request('/me', { token: session.token })
  if (res.networkError) return session.user ?? null // server restarting: keep the user until it answers
  if (!res.ok) {
    if (readSession()?.token === session.token) storage.remove(STORAGE_KEYS.session)
    return null
  }
  // Only refresh the saved copy if nobody logged out or in while the check was running.
  if (readSession()?.token !== session.token) return null
  const user = toUser(res.data)
  storage.write(STORAGE_KEYS.session, { token: session.token, user })
  return user
}

export async function signup({ name, email, password }) {
  const cleanName = String(name ?? '').trim().replace(/\s+/g, ' ')
  const cleanEmail = normalizeEmail(email)

  // Quick checks for instant feedback; the server checks the same rules again.
  if (!cleanName) return fail(AUTH_ERRORS.INVALID_NAME, 'name', 'Enter your name.')
  if (cleanName.length < NAME_MIN || cleanName.length > NAME_MAX) {
    return fail(AUTH_ERRORS.INVALID_NAME, 'name', `Enter a name between ${NAME_MIN} and ${NAME_MAX} characters.`)
  }
  if (!cleanEmail) return fail(AUTH_ERRORS.INVALID_EMAIL, 'email', 'Enter your email address.')
  if (!EMAIL_PATTERN.test(cleanEmail)) {
    return fail(AUTH_ERRORS.INVALID_EMAIL, 'email', 'Enter a valid email address, like you@example.com.')
  }
  if (!password) return fail(AUTH_ERRORS.WEAK_PASSWORD, 'password', 'Choose a password.')

  const res = await request('/signup', { method: 'POST', body: { name: cleanName, email: cleanEmail, password } })
  return res.ok ? signedIn(res.data) : fromServerError(res, 'email')
}

export async function login({ email, password }) {
  const cleanEmail = normalizeEmail(email)
  if (!cleanEmail) return fail(AUTH_ERRORS.INVALID_EMAIL, 'email', 'Enter your email address.')
  if (!EMAIL_PATTERN.test(cleanEmail)) {
    return fail(AUTH_ERRORS.INVALID_EMAIL, 'email', 'Enter a valid email address, like you@example.com.')
  }
  if (!password) return fail(AUTH_ERRORS.INVALID_CREDENTIALS, 'password', 'Enter your password.')

  const res = await request('/login', { method: 'POST', body: { email: cleanEmail, password } })
  if (res.ok) return signedIn(res.data)
  // A locked account isn't about what was typed in the password box, so show it as a general message.
  return fromServerError(res, res.data?.code === AUTH_ERRORS.ACCOUNT_LOCKED ? null : 'password')
}

export async function guest() {
  const res = await request('/guest', { method: 'POST' })
  return res.ok ? signedIn(res.data) : fromServerError(res, null)
}

/** The token is only kept in this browser, so logging out means forgetting it. */
export async function logout() {
  storage.remove(STORAGE_KEYS.session)
}
