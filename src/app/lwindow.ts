import { deepCompare } from "../deepCompare";
import { createLState, LAnyState, LComputed, ReadOnlyObject, Unscribe } from "../state/lstate"

export interface Size {
  width: number,
  height: number
}

export interface Location {
  title: string
  url: string
}

export interface WindowHistory {
  
}

export type ExtraWindowStates = {
  [name: string]: LAnyState<any>
}

export function createLWindowState<T extends ExtraWindowStates = {}>(
  window: Window, mode: 'pushState', extraWindowStates?: () => T) {
  const size = createLState({
    initial: {
      width: window.innerWidth,
      height: window.innerHeight
    } as Size,
    compare: deepCompare,
    disconnect: $destroy,
    actions(setter) {
      return {
        refresh() {
          setter(() => ({
            width: window.innerWidth,
            height: window.innerHeight
          }))
        }
      }
    }
  })
  const location = createLState({
    initial: {
      url: window.location.pathname,
      title: window.document.head.title,
    } as Location,
    compare: deepCompare,
    disconnect: $destroy,
    actions(setter) {
      return {
        refresh() {
          setter(() => ({
            url: window.location.pathname,
            title: window.document.head.title,
          }))
        },
        goUrl(url: string, replace: boolean): void {
          if (replace) window.history.replaceState(undefined, '', url)
          else window.history.pushState(undefined, '', url)
          setTimeout(notifyUrl, 1)
        },
        goHistory(n: number): void {
          window.history.go(n)
        },
      }
    }
  })
  window.onpopstate = notifyUrl
  window.onresize = notifySize
  window.onload = notifyAll
  const extra: T = extraWindowStates ? extraWindowStates() : {} as T
  let self = {
    $destroy,
    size,
    location,
    ...extra
  }
  return self
  function notifyAll() {
    notifyUrl()
    notifySize()
  }
  function notifySize() {
    size.refresh && size.refresh()
  }
  function notifyUrl() {
    location.refresh && location.refresh()
  }
  function $destroy() {
    if (self) {
      const copy = self
      self = undefined as any
      Object.keys(copy).forEach((n) => {
        const d = copy[n]?.$destroy
        if (d) {
          delete copy[n]
          d()
        }
      })
      delete (window as any).onpopstate
      delete (window as any).onresize
      delete (window as any).onload
    }
  }
}
