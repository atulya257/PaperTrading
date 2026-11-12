import { STORAGE_KEYS } from '../config/constants.js'
import { USER_SERVICE_URL } from '../config/services.js'
import * as storage from './storage.js'

const API = `${USER_SERVICE_URL}/api/users`

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
  'Can’t reach the TradeLab User Service. Make sure it is running on port 8082.',
)

// The User Service's response, shaped the way the rest of the app expects. The id is the email, so each
// person's portfolio in this browser stays theirs.
function toUser(serverUser) {
  return {
    id: serverUser.email,
    serverId: serverUser.id,
    name: serverUser.name,
    email: serverUser.email,
    isGuest: false,
    createdAt: Date.parse(serverUser.createdAt) || Date.now(),
  }
}

const readSession = () => {
  const session = storage.read(STORAGE_KEYS.session, { fallback: null })
  return session && session.user && typeof session.user.id === 'string' ? session : null
}

function signedIn(user) {
  storage.write(STORAGE_KEYS.session, { user })
  return { ok: true, user }
}

async function request(path, { method = 'GET', body } = {}) {
  try {
    const response = await fetch(`${API}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await response.json().catch(() => null)
    return { status: response.status, ok: response.ok, data }
  } catch {
    return { networkError: true }
  }
}

function fromServerError(res, fallbackField) {
  if (res.networkError || res.status >= 500 || !res.data?.code) return SERVER_DOWN
  return fail(res.data.code, res.data.field ?? fallbackField, res.data.message)
}

export async function getSession() {
  const session = readSession()
  if (!session) return null
  // Guest sessions from older versions are no longer valid: everyone needs an account.
  if (session.user.isGuest || !session.user.serverId) {
    storage.remove(STORAGE_KEYS.session)
    return null
  }
  const res = await request(`/${session.user.serverId}`)
  if (res.networkError || res.status >= 500) return session.user // service restarting: keep the user
  if (!res.ok || normalizeEmail(res.data?.email) !== session.user.email) {
    if (readSession()?.user.id === session.user.id) storage.remove(STORAGE_KEYS.session)
    return null
  }
  return session.user
}

export async function signup({ name, email, password }) {
  const cleanName = String(name ?? '').trim().replace(/\s+/g, ' ')
  const cleanEmail = normalizeEmail(email)

  // Quick checks for instant feedback; the User Service checks the same rules again.
  if (!cleanName) return fail(AUTH_ERRORS.INVALID_NAME, 'name', 'Enter your name.')
  if (cleanName.length < NAME_MIN || cleanName.length > NAME_MAX) {
    return fail(AUTH_ERRORS.INVALID_NAME, 'name', `Enter a name between ${NAME_MIN} and ${NAME_MAX} characters.`)
  }
  if (!cleanEmail) return fail(AUTH_ERRORS.INVALID_EMAIL, 'email', 'Enter your email address.')
  if (!EMAIL_PATTERN.test(cleanEmail)) {
    return fail(AUTH_ERRORS.INVALID_EMAIL, 'email', 'Enter a valid email address, like you@example.com.')
  }
  if (!password) return fail(AUTH_ERRORS.WEAK_PASSWORD, 'password', 'Choose a password.')

  const res = await request('', { method: 'POST', body: { name: cleanName, email: cleanEmail, password } })
  return res.ok ? signedIn(toUser(res.data)) : fromServerError(res, 'email')
}

export async function login({ email, password }) {
  const cleanEmail = normalizeEmail(email)
  if (!cleanEmail) return fail(AUTH_ERRORS.INVALID_EMAIL, 'email', 'Enter your email address.')
  if (!EMAIL_PATTERN.test(cleanEmail)) {
    return fail(AUTH_ERRORS.INVALID_EMAIL, 'email', 'Enter a valid email address, like you@example.com.')
  }
  if (!password) return fail(AUTH_ERRORS.INVALID_CREDENTIALS, 'password', 'Enter your password.')

  const res = await request('/login', { method: 'POST', body: { email: cleanEmail, password } })
  if (res.ok) return signedIn(toUser(res.data))
  // A wrong password belongs under the password box; a locked account is a general message.
  return fromServerError(res, res.data?.code === AUTH_ERRORS.INVALID_CREDENTIALS ? 'password' : null)
}

export async function logout() {
  storage.remove(STORAGE_KEYS.session)
}
