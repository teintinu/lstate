import { createLState, LState, LComputed } from './lstate'
import { defer, sleep } from 'pjobs'

describe('count on stateB is double of count on stateA', () => {
  let connected: number = 0
  let stateA: LState<{ count: number }> & { inc(count: number): void, setSame(): void }
  let stateB: LComputed<{ count: number }>
  beforeEach(() => {
    connected++
    stateA = createLState({
      initial: { count: 1 },
      reducers: (setter) => ({
        setSame () {
          setter((old) => old)
        },
        inc (v) {
          setter((old) => ({ count: old.count + v }))
        }
      }),
      disconnect () {
        connected--
      }
    })
    stateB = createLState({
      default: { count: -1 },
      dependencies: [stateA],
      compute: (setter, a) => {
        setter(() => ({ count: a.count * 2 }))
      },
      debounce: 50
    })
  })
  afterEach(async () => {
    stateB.$.destroy()
    stateA.$.destroy()
    await sleep(10)
    expect(connected).toBe(0)
  })
  it('should support initial value', async () => {
    expect(stateA.$.get()).toEqual({ count: 1 })
    expect(stateB.$.get()).toEqual({ count: 2 })
  })
  it('should subscribe to changes', async () => {
    const d = defer<void>()
    stateB.$.subscribe((v) => {
      expect(v).toEqual({ count: 4 })
      d.resolve()
    })
    stateA.$.subscribe((v) => {
      expect(v).toEqual({ count: 2 })
      d.resolve()
    })
    stateA.inc(1)
    return d.promise
  })
  it('should not fire change event when set to the same value', async () => {
    await sleep(150)
    let computingCount = 0
    stateB.$.subscribe((v) => {
      computingCount++
      if (computingCount > 1) {
        expect(v).toBe('recomputing un')
      }
    })
    stateA.$.subscribe((v) => {
      expect(v).toBe('should not be called')
    })
    stateA.setSame()
    expect(stateA.$.get()).toEqual({ count: 1 })
    await sleep(150)
    expect(stateB.$.get()).toEqual({ count: 2 })
  })
  it('should support unsubscribe subscriptions', async () => {
    await sleep(150)
    const unscribeB = stateB.$.subscribe((v) => {
      expect(v).toBe('should not be called')
    })
    const unscribeA = stateA.$.subscribe((v) => {
      expect(v).toBe('should not be called')
    })
    unscribeB()
    unscribeA()
    stateA.inc(1)
    expect(stateA.$.get()).toEqual({ count: 2 })
    await sleep(150)
    expect(stateB.$.get()).toEqual({ count: 4 })
  })
})
