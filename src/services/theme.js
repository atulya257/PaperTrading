import { STORAGE_KEYS } from '../config/constants.js'
import { read, write } from './storage.js'

export const THEMES = ['light', 'dark']

const listeners = new Set()

let theme = readTheme()

function readTheme() {
  const prefs = read(STORAGE_KEYS.prefs, { fallback: {} })
  return THEMES.includes(prefs?.theme) ? prefs.theme : 'light'
}

function apply() {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0e1116' : '#f3f4f0')
}

export function getTheme() {
  return theme
}

export function setTheme(value) {
  if (!THEMES.includes(value) || value === theme) return
  theme = value
  const prefs = read(STORAGE_KEYS.prefs, { fallback: {} }) ?? {}
  write(STORAGE_KEYS.prefs, { ...prefs, theme: value })
  apply()
  listeners.forEach((listener) => listener())
}

export function subscribeTheme(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function startTheme() {
  apply()
}
