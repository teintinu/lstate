import { create, act } from 'react-test-renderer'
import React from 'react'
import { sleep } from 'pjobs'

export function renderHook<T> (fn: () => T) {
  let state: T = undefined as T
  const el = React.createElement(Comp)
  const renderer = create(el)
  return {
    async act (fn: () => void | Promise<void>) {
      await act(async () => {
        renderer.update(el)
        await Promise.resolve(fn())
        await sleep(10)
      })
    },
    expect (v: T) {
      expect(state).toEqual(v)
    }
  }
  function Comp () {
    const val = fn()
    state = val
    return React.createElement('pre', {})
  }
}
