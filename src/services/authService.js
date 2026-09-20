import { STORAGE_KEYS } from '../config/constants.js'
import { newId } from '../utils/id.js'
import * as storage from './storage.js'

export const AUTH_ERRORS = {
  INVALID_NAME: 'INVALID_NAME',
  INVALID_EMAIL: 'INVALID_EMAIL',
  EMAIL_TAKEN: 'EMAIL_TAKEN',
  NOT_FOUND: 'NOT_FOUND',
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NAME_MIN = 2
const NAME_MAX = 40

const fail = (code, field, message) => ({ ok: false, error: { code, field, message } })
const normalizeEmail = (email) => String(email ?? '').trim().toLowerCase()

const isUser = (u) =>
  u !== null &&
  typeof u === 'object' &&
  typeof u.id === 'string' &&
  u.id.length > 0 &&
  typeof u.name === 'string' &&
  (u.email === null || typeof u.email === 'string') &&
  typeof u.isGuest === 'boolean' &&
  Number.isFinite(u.createdAt)

function readUsers() {
  const list = storage.read(STORAGE_KEYS.users, { fallback: [] })
  return Array.isArray(list) ? list.filter(isUser) : []
}

const writeUsers = (users) => storage.write(STORAGE_KEYS.users, users)
const setSession = (userId) => storage.write(STORAGE_KEYS.session, { userId })

export async function getSession() {
  const session = storage.read(STORAGE_KEYS.session, { fallback: null })
  if (!session || typeof session.userId !== 'string') return null
  return readUsers().find((u) => u.id === session.userId) ?? null
}

export async function signup({ name, email }) {
  const cleanName = String(name ?? '').trim().replace(/\s+/g, ' ')
  const cleanEmail = normalizeEmail(email)

  if (cleanName.length < NAME_MIN || cleanName.length > NAME_MAX) {
    return fail(AUTH_ERRORS.INVALID_NAME, 'name', `Enter a name between ${NAME_MIN} and ${NAME_MAX} characters.`)
  }
  if (!EMAIL_PATTERN.test(cleanEmail)) {
    return fail(AUTH_ERRORS.INVALID_EMAIL, 'email', 'Enter a valid email address, like you@example.com.')
  }
  const users = readUsers()
  if (users.some((u) => u.email === cleanEmail)) {
    return fail(AUTH_ERRORS.EMAIL_TAKEN, 'email', 'A demo account with this email already exists in this browser. Log in instead.')
  }

  const user = { id: newId(), name: cleanName, email: cleanEmail, isGuest: false, createdAt: Date.now() }
  writeUsers([...users, user])
  setSession(user.id)
  return { ok: true, user }
}

export async function login({ email }) {
  const cleanEmail = normalizeEmail(email)
  if (!EMAIL_PATTERN.test(cleanEmail)) {
    return fail(AUTH_ERRORS.INVALID_EMAIL, 'email', 'Enter a valid email address, like you@example.com.')
  }
  const user = readUsers().find((u) => u.email === cleanEmail)
  if (!user) {
    return fail(AUTH_ERRORS.NOT_FOUND, 'email', 'No demo account with this email exists in this browser yet.')
  }
  setSession(user.id)
  return { ok: true, user }
}

export async function guest() {
  const users = readUsers()
  let user = users.find((u) => u.isGuest)
  if (!user) {
    user = { id: newId(), name: 'Guest', email: null, isGuest: true, createdAt: Date.now() }
    writeUsers([...users, user])
  }
  setSession(user.id)
  return { ok: true, user }
}

export async function logout() {
  storage.remove(STORAGE_KEYS.session)
}
