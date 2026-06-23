function toFiniteNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export function normalizeTraceCell(trace) {
  const traceX = toFiniteNumber(trace?.traceX)
  const traceY = toFiniteNumber(trace?.traceY)

  if (traceX === 0 || traceX === 1) {
    return {
      col: traceX,
      row: Math.max(0, Math.trunc(traceY)),
    }
  }

  return {
    col: traceX < 50 ? 0 : 1,
    row: Math.max(0, Math.floor(traceY / 50)),
  }
}
