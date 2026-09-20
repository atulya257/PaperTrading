import { STORAGE_VERSION } from '../config/constants.js'

const memory = new Map()

function backend() {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function isPersistent() {
  try {
    const store = backend()
    if (!store) return false
    const probe = '__tradelab_probe__'
    store.setItem(probe, '1')
    store.removeItem(probe)
    return true
  } catch {
    return false
  }
}

function getRaw(key) {
  try {
    const store = backend()
    return store ? store.getItem(key) : memory.get(key) ?? null
  } catch {
    return memory.get(key) ?? null
  }
}

export function read(key, { validate, fallback = null } = {}) {
  try {
    const raw = getRaw(key)
    if (raw == null) return fallback
    const envelope = JSON.parse(raw)
    if (!envelope || envelope.version !== STORAGE_VERSION || !('data' in envelope)) return fallback
    if (validate && !validate(envelope.data)) return fallback
    return envelope.data
  } catch {
    return fallback
  }
}

export function isCorrupt(key, validate) {
  const raw = getRaw(key)
  if (raw == null) return false
  const MISSING = Symbol('rejected')
  return read(key, { validate, fallback: MISSING }) === MISSING
}

export function write(key, data) {
  const raw = JSON.stringify({ version: STORAGE_VERSION, savedAt: Date.now(), data })
  try {
    const store = backend()
    if (store) {
      store.setItem(key, raw)
      return true
    }
  } catch {
  }
  memory.set(key, raw)
  return false
}

export function remove(key) {
  memory.delete(key)
  try {
    backend()?.removeItem(key)
  } catch {
  }
}

export function quarantine(key) {
  const raw = getRaw(key)
  if (raw != null) {
    try {
      const store = backend()
      if (store) store.setItem(`${key}:corrupt`, raw)
      else memory.set(`${key}:corrupt`, raw)
    } catch {
    }
  }
  remove(key)
}

const APP_PREFIX = 'tradelab:'

export function clearAllAppData() {
  memory.clear()
  try {
    const store = backend()
    if (!store) return
    const keys = []
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i)
      if (key && key.startsWith(APP_PREFIX)) keys.push(key)
    }
    keys.forEach((key) => store.removeItem(key))
  } catch {
  }
}
