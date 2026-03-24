// Properties that affect text rendering in textarea
const MIRROR_PROPERTIES = [
  'direction',
  'boxSizing',
  'width',
  'height',
  'overflowX',
  'overflowY',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderStyle',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'fontSizeAdjust',
  'lineHeight',
  'fontFamily',
  'textAlign',
  'textTransform',
  'textIndent',
  'textDecoration',
  'letterSpacing',
  'wordSpacing',
  'tabSize',
  'MozTabSize',
  'whiteSpace',
  'wordWrap',
] as const

export function getCaretCoordinates(
  element: HTMLTextAreaElement,
  position: number
): { top: number; left: number; height: number } {
  const div = document.createElement('div')
  div.id = 'caret-position-mirror'
  document.body.appendChild(div)

  const style = div.style
  const computed = window.getComputedStyle(element)

  style.whiteSpace = 'pre-wrap'
  style.wordWrap = 'break-word'
  style.position = 'absolute'
  style.visibility = 'hidden'
  style.overflow = 'hidden'

  for (const prop of MIRROR_PROPERTIES) {
    style.setProperty(prop, computed.getPropertyValue(prop))
  }

  div.textContent = element.value.substring(0, position)

  const span = document.createElement('span')
  span.textContent = element.value.substring(position) || '.'
  div.appendChild(span)

  const coordinates = {
    top: span.offsetTop + parseInt(computed.borderTopWidth) - element.scrollTop,
    left:
      span.offsetLeft + parseInt(computed.borderLeftWidth) - element.scrollLeft,
    height: parseInt(computed.lineHeight) || parseInt(computed.fontSize) * 1.2,
  }

  document.body.removeChild(div)
  return coordinates
}
