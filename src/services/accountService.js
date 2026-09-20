import { STORAGE_KEYS } from '../config/constants.js'
import { createAccount, sanitizeAccount } from '../engine/account.js'
import * as storage from './storage.js'

export async function loadAccount(userId, { sessionDate }) {
  const key = STORAGE_KEYS.account(userId)
  const NOTHING = Symbol('nothing')
  const stored = storage.read(key, { fallback: NOTHING })

  let damaged
  if (stored === NOTHING) {
    damaged = storage.isCorrupt(key, () => true)
  } else {
    const account = sanitizeAccount(stored)
    if (account && account.userId === userId) return { account, isNew: false, recovered: false }
    damaged = true
  }

  if (damaged) storage.quarantine(key)
  const fresh = createAccount({ userId, now: Date.now(), sessionDate })
  storage.write(key, fresh)
  return { account: fresh, isNew: !damaged, recovered: damaged }
}

export async function saveAccount(userId, account) {
  return storage.write(STORAGE_KEYS.account(userId), account)
}

export async function resetAccount(userId, { sessionDate }) {
  const fresh = createAccount({ userId, now: Date.now(), sessionDate })
  storage.write(STORAGE_KEYS.account(userId), fresh)
  return fresh
}

export async function deleteAccount(userId) {
  storage.remove(STORAGE_KEYS.account(userId))
}
