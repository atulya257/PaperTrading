export function mulDivRound(a, b, c) {
  const numerator = BigInt(a) * BigInt(b)
  const divisor = BigInt(c)
  return Number((numerator * 2n + divisor) / (divisor * 2n))
}

export function safePercent(numerator, denominator) {
  return denominator ? (numerator / denominator) * 100 : 0
}

export const isInteger = (x) => Number.isSafeInteger(x)
