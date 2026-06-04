export const CANVAS_W = 480
export const COL_X = [125, 355]
export const CARD_W = 210
export const ROW_H = 280
export const COL_STAGGER = 80

export function cellToCenter(row, col) {
  const stagger = col === 1 ? COL_STAGGER : 0
  return {
    x: COL_X[col],
    y: row * ROW_H + stagger + 60 + CARD_W / 2,
  }
}
