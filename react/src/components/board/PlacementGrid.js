export const CANVAS_W = 520
export const COL_X = [135, 385]
export const CARD_W = 230
export const ROW_H = 310
export const COL_STAGGER = 60

export function cellToCenter(row, col) {
  const stagger = col === 1 ? COL_STAGGER : 0
  return {
    x: COL_X[col],
    y: row * ROW_H + stagger + 60 + CARD_W / 2,
  }
}
