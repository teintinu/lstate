export function deepCompare (a: unknown, b: unknown, allProperties?: boolean): number {
  if (a === b) return 0
  const ta = a === null ? 'null' : typeof a
  const tb = b === null ? 'null' : typeof b
  let r
  if (a instanceof Date) {
    if (b instanceof Date) {
      return a.getTime() - b.getTime()
    }
    if (tb === 'string') {
      return a.getTime() - new Date(b as string).getTime()
    }
    return -1
  } else if (b instanceof Date) {
    if (ta === 'string') {
      return new Date(a as string).getTime() - b.getTime()
    }
    return 1
  }
  if (ta !== tb) {
    if (ta === 'undefined') { return -1 }
    if (tb === 'undefined') { return 1 }
    return (ta < tb) ? -1 : 1
  } else if (Array.isArray(a)) {
    r = a.length - (b as unknown[]).length
    if (!r) {
      a.some((va, idx) => {
        r = deepCompare(va, (b as unknown[])[idx], allProperties)
        return !!r
      })
    }
    return r
  } else if (ta === 'object') {
    const keysA = Object.getOwnPropertyNames(a)
    keysA.sort()
    r = 0
    keysA.some((prop) => {
      r = deepCompare((a as any)[prop], (b as any)[prop], allProperties)
      return !!r
    })
    if (r === 0 && allProperties) { r = keysA.length - Object.getOwnPropertyNames(b).length }
    return r
  } else if (ta === 'function') {
    return 0
  } else {
    return ((a as any) < (b as any)) ? -1 : 1
  }
}
