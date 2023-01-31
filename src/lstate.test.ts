/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react-hooks'
import { createLState, useLState } from './lstate'
import { sleep } from 'pjobs'

describe('useLState', () => {
  const sample = createLState({
    initial: { count: 0 },
    reducers: (setter) => ({
      reset () {
        setter(() => ({ count: 0 }))
      },
      inc () {
        setter((old) => ({ count: old.count + 1 }))
      }
    })
  })
  beforeEach(() => sample.reset())
  it('useLState', async () => {
    const { result } = renderHook(() => useLState(sample))
    expect(result.current).toEqual({ count: 0 })
  })
  it('invoke actions', async () => {
    const { result } = renderHook(() => useLState(sample))
    act(() => {
      sample.inc()
    })
    expect(result.current).toEqual({ count: 0 })
    await act(async () => {
      await sleep(100)
    })
    expect(result.current).toEqual({ count: 1 })
  })
  it('invoke computed', async () => {
    const computed = createLState({
      default: { value: -1 },
      dependencies: [sample],
      compute: (setter, a) => {
        setter(() => ({ value: a.count * 2 }))
      }
    })
    const { result } = renderHook(() => {
      const res = useLState(computed)
      const val: {
        readonly value: number;
      } = res[0]
      const pending: boolean = res[1]
      expect(typeof val).toBe('object')
      expect(typeof val?.value).toBe('number')
      expect(typeof val?.value).toBe('number')
      expect(typeof pending).toBe('boolean')
      return res
    })
    await act(async () => {
      await sleep(150)
    })
    expect(result.current).toEqual([{ value: 0 }, false])
    act(() => {
      sample.inc()
    })
    await act(async () => {
      await sleep(10)
    })
    expect(result.current).toEqual([{ value: 0 }, true])
    await act(async () => {
      await sleep(150)
    })
    expect(result.current).toEqual([{ value: 2 }, false])
  })
})
