/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react-hooks'
import { createLState, useLState } from './lstate'
import { sleep } from 'pjobs'

describe('useLState - value', () => {
  const sample = createLState({
    initial: { value: 0 },
    reducers: (setter) => ({
      reset () {
        setter({ value: 0 })
      },
      set (value: number) {
        setter({ value })
      }
    })
  })
  beforeEach(() => sample.reset())
  it('initial value', async () => {
    const { result } = renderHook(() => useLState(sample))
    expect(result.current).toEqual({ value: 0 })
  })
  it('invoke actions', async () => {
    const { result } = renderHook(() => useLState(sample))
    act(() => {
      sample.set(1)
    })
    expect(result.current).toEqual({ value: 0 })
    await act(async () => {
      await sleep(100)
    })
    expect(result.current).toEqual({ value: 1 })
  })
  it('invoke computed', async () => {
    const computed = createLState({
      default: { double: -1 },
      dependencies: [sample],
      compute: (setter) => {
        setter((_, a) => ({ double: a.value * 2 }))
      }
    })
    const { result } = renderHook(() => {
      const res = useLState(computed)
      const val: {
        readonly double: number;
      } = res[0]
      const pending: boolean = res[1]
      expect(typeof val).toBe('object')
      expect(typeof val?.double).toBe('number')
      expect(typeof pending).toBe('boolean')
      return res
    })
    expect(result.current).toEqual([{ double: -1 }, true])
    await act(async () => {
      await sleep(150)
    })
    expect(result.current).toEqual([{ double: 0 }, false])
    act(() => {
      sample.set(1)
    })
    await act(async () => {
      await sleep(10)
    })
    expect(result.current).toEqual([{ double: 0 }, true])
    await act(async () => {
      await sleep(150)
    })
    expect(result.current).toEqual([{ double: 2 }, false])
  })
})

describe('useLState - fn', () => {
  const sample = createLState({
    initial: { value: 0 },
    reducers: (setter) => ({
      reset () {
        setter(() => ({ value: 0 }))
      },
      inc () {
        setter((old) => ({ value: old.value + 1 }))
      }
    })
  })
  beforeEach(() => sample.reset())
  it('initial value', async () => {
    const { result } = renderHook(() => useLState(sample))
    expect(result.current).toEqual({ value: 0 })
  })
  it('invoke actions', async () => {
    const { result } = renderHook(() => useLState(sample))
    act(() => {
      sample.inc()
    })
    expect(result.current).toEqual({ value: 0 })
    await act(async () => {
      await sleep(100)
    })
    expect(result.current).toEqual({ value: 1 })
  })
  it('invoke computed', async () => {
    const computed = createLState({
      default: { double: -1 },
      dependencies: [sample],
      compute: (setter) => {
        setter((_, a) => ({ double: a.value * 2 }))
      }
    })
    const { result } = renderHook(() => {
      const res = useLState(computed)
      const val: {
        readonly double: number;
      } = res[0]
      const pending: boolean = res[1]
      expect(typeof val).toBe('object')
      expect(typeof val?.double).toBe('number')
      expect(typeof pending).toBe('boolean')
      return res
    })
    expect(result.current).toEqual([{ double: -1 }, true])
    await act(async () => {
      await sleep(150)
    })
    expect(result.current).toEqual([{ double: 0 }, false])
    act(() => {
      sample.inc()
    })
    await act(async () => {
      await sleep(10)
    })
    expect(result.current).toEqual([{ double: 0 }, true])
    await act(async () => {
      await sleep(150)
    })
    expect(result.current).toEqual([{ double: 2 }, false])
  })
})

describe('useLState - with Promise', () => {
  const sample = createLState({
    initial: { value: 0 },
    reducers: (setter) => ({
      async reset () {
        await Promise.resolve()
        setter({ value: 0 })
      },
      async inc () {
        await Promise.resolve()
        setter((old) => ({ value: old.value + 1 }))
      }
    })
  })
  beforeEach(() => sample.reset())
  it('initial value', async () => {
    const { result } = renderHook(() => useLState(sample))
    expect(result.current).toEqual({ value: 0 })
  })
  it('invoke actions', async () => {
    const { result } = renderHook(() => useLState(sample))
    act(() => {
      sample.inc()
    })
    expect(result.current).toEqual({ value: 0 })
    await act(async () => {
      await sleep(100)
    })
    expect(result.current).toEqual({ value: 1 })
  })
  it('invoke computed', async () => {
    const computed = createLState({
      default: { double: -1 },
      dependencies: [sample],
      async compute (setter) {
        await Promise.resolve()
        setter((_, a) => ({ double: a.value * 2 }))
      }
    })
    const { result } = renderHook(() => {
      const res = useLState(computed)
      const val: {
        readonly double: number;
      } = res[0]
      const pending: boolean = res[1]
      expect(typeof val).toBe('object')
      expect(typeof val?.double).toBe('number')
      expect(typeof pending).toBe('boolean')
      return res
    })
    expect(result.current).toEqual([{ double: -1 }, true])
    await act(async () => {
      await sleep(150)
    })
    expect(result.current).toEqual([{ double: 0 }, false])
    act(() => {
      sample.inc()
    })
    await act(async () => {
      await sleep(10)
    })
    expect(result.current).toEqual([{ double: 0 }, true])
    await act(async () => {
      await sleep(150)
    })
    expect(result.current).toEqual([{ double: 2 }, false])
  })
})
