import { API_BASE_URL } from '../../api/client.js'
import { normalizeTraceCell } from './BoardDetail.utils.js'

const POSTIT_COLOR_BY_HEX = {
  '#fff8dc': 'cream',
  '#ffe4e1': 'pink',
  '#f3d98e': 'yellow',
  '#eeb7c6': 'pink',
  '#d2d4a2': 'green',
  '#f0ead6': 'cream',
  '#f8f6f0': 'white',
  // 에디터 POSTIT_COLORS
  '#f7e58a': 'yellow',
  '#f6abbe': 'pink',
  '#a8d8f0': 'sky',
  '#b8e0a0': 'green',
  '#fff0cc': 'cream',
  '#d4b8f0': 'purple',
}

function parseStyleJson(styleJson) {
  if (!styleJson) return {}
  if (typeof styleJson === 'object') return styleJson

  try {
    return JSON.parse(styleJson)
  } catch {
    return {}
  }
}

function resolveImageUrl(imageUrl) {
  if (!imageUrl) return ''
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl
  if (/^[a-zA-Z]:[\\/]/.test(imageUrl)) return ''
  if (imageUrl.startsWith('/')) return `${API_BASE_URL}${imageUrl}`

  return imageUrl
}

function resolvePaperColor(style) {
  if (style.paperColor) return style.paperColor

  const backgroundColor = style.backgroundColor?.toLowerCase()
  return POSTIT_COLOR_BY_HEX[backgroundColor] ?? 'yellow'
}

function formatDateLabel(dateText) {
  if (!dateText) return ''

  const date = new Date(dateText)
  if (Number.isNaN(date.getTime())) return ''

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')}`
}

export function traceToPost(trace) {
  const element = trace.elements?.[0] ?? {}
  const style = parseStyleJson(element.styleJson)
  const isPolaroid = element.contentType === 'POLAROID'
  const boardPosition = style.boardPosition ?? {}
  const imageUrl = resolveImageUrl(element.imageUrl)
  const isRenderedPolaroidImage = isPolaroid && style.imageKind === 'rendered-polaroid'

  return {
    id: trace.traceId ?? element.elementId,
    traceId: trace.traceId ?? element.elementId,
    boardId: trace.boardId,
    boardPageId: style.boardPageId ?? trace.boardPageId ?? 'page-1',
    type: isPolaroid ? 'polaroid' : 'postit',
    x: boardPosition.x,
    y: boardPosition.y,
    width: boardPosition.width,
    height: boardPosition.height,
    rotation: boardPosition.rotation,
    scale: boardPosition.scale,
    zIndex: boardPosition.zIndex,
    content: element.textContent ?? '',
    capturedImage: isPolaroid && !isRenderedPolaroidImage ? '' : imageUrl,
    media: isPolaroid
      ? {
          image: imageUrl,
          dateLabel: formatDateLabel(trace.createdAt),
        }
      : undefined,
    style: isPolaroid
      ? {
          ...style,
          color: style.textColor ?? '#2E231B',
          backgroundColor: style.backgroundColor ?? style.paperColor ?? '#FFFFFF',
        }
      : {
          ...style,
          paperColor: resolvePaperColor(style),
        },
    cell: normalizeTraceCell(trace),
    createdAt: trace.createdAt,
    likes: trace.likeCount ?? 0,
    liked: trace.liked === true,
    nickname: trace.nickname,
    userId: trace.userId,
  }
}
