/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react-hooks'
import { createLState, useLState } from './lstate'
import { sleep } from 'pjobs'

describe('useLState', () => {
  const sample = createLState({
    initial: { count: 0 },
    actions: (setter) => ({
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
  it('inkove actions', async () => {
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
  it.skip('inkove computed', async () => {
    // await sleep(100)
    // const { result } = renderHook(() => useLState(computed))
    // act(() => {
    //   sample.inc()
    // })
    // expect(result.current).toEqual({ count: 0 })
    // await act(async () => {
    //   await sleep(100)
    // })
    // expect(result.current).toEqual({ count: 1 })
  })
})
