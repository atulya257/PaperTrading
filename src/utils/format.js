import { PAISE_PER_RUPEE } from '../config/constants.js'

const inrNumber = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const inrWhole = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

const MINUS = '−'

export function paiseToRupees(paise) {
  return paise / PAISE_PER_RUPEE
}

export function formatINR(paise) {
  if (!Number.isFinite(paise)) return '—'
  const text = `₹${inrNumber.format(Math.abs(paiseToRupees(paise)))}`
  return paise < 0 ? `${MINUS}${text}` : text
}

export function formatSignedINR(paise) {
  if (!Number.isFinite(paise)) return '—'
  if (Math.round(paise) === 0) return formatINR(0)
  return `${paise > 0 ? '+' : MINUS}₹${inrNumber.format(Math.abs(paiseToRupees(paise)))}`
}

export function formatINRWhole(paise) {
  if (!Number.isFinite(paise)) return '—'
  const text = `₹${inrWhole.format(Math.abs(paiseToRupees(paise)))}`
  return paise < 0 ? `${MINUS}${text}` : text
}

export function formatPercent(value, { signed = true, digits = 2 } = {}) {
  if (!Number.isFinite(value)) return '—'
  const text = `${Math.abs(value).toFixed(digits)}%`
  if (value === 0) return text
  if (!signed) return value < 0 ? `${MINUS}${text}` : text
  return `${value > 0 ? '+' : MINUS}${text}`
}

export function formatQuantity(n) {
  return Number.isFinite(n) ? inrWhole.format(n) : '—'
}

export function formatCompactINR(rupees) {
  if (!Number.isFinite(rupees)) return '—'
  const crore = rupees / 1e7
  if (crore >= 1e5) return `₹${(crore / 1e5).toFixed(2)} L Cr`
  if (crore >= 1) return `₹${inrWhole.format(Math.round(crore))} Cr`
  return `₹${inrWhole.format(rupees)}`
}

export function trendOf(value) {
  if (!Number.isFinite(value) || value === 0) return 'flat'
  return value > 0 ? 'gain' : 'loss'
}

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
const timeFmt = new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })

export function formatRelativeTime(ms, now = Date.now()) {
  const minutes = Math.round((now - ms) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  return `${Math.round(hours / 24)} d ago`
}

const shortDateTimeFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })

export const formatDate = (ms) => dateFmt.format(new Date(ms))
export const formatShortDateTime = (ms) => shortDateTimeFmt.format(new Date(ms))
export const formatTime = (ms) => timeFmt.format(new Date(ms))
export const formatDateTime = (ms) => `${formatDate(ms)}, ${formatTime(ms)}`
