import { createLState, LState } from './lstate'
import { defer, sleep } from 'pjobs'
import { deepCompare } from './deepCompare'

describe('lstate with custom compare tests', () => {
  let sample: LState<{ count: number }> & { inc(count: number): void, setSame(): void }
  beforeEach(() => {
    sample = createLState({
      initial: { count: 1 },
      compare: (a, b) => a.count - b.count,
      reducers: (setter) => ({
        setSame () {
          setter((old) => old)
        },
        inc (v) {
          setter((old) => ({ count: old.count + v }))
        }
      })
    })
  })
  afterEach(() => {
    sample.$.destroy()
  })
  it('should support initial value', async () => {
    expect(sample.$.get()).toEqual({ count: 1 })
  })
  it('should subscribe to changes', async () => {
    const d = defer<void>()
    sample.$.subscribe((v) => {
      expect(v).toEqual({ count: 2 })
      d.resolve()
    })
    sample.inc(1)
    return d.promise
  })
  it('should not fire change event when set to the same value', async () => {
    sample.$.subscribe((v) => {
      expect(v).toBe('should not be called')
    })
    sample.setSame()
    sample.inc(0)
    expect(sample.$.get()).toEqual({ count: 1 })
  })
  it('should support unsubscribe subscriptions', async () => {
    const unscribe = sample.$.subscribe((v) => {
      expect(v).toBe('should not be called')
    })
    unscribe()
    sample.inc(1)
    await sleep(10)
    expect(sample.$.get()).toEqual({ count: 2 })
  })
})

describe('lstate with deepCompare tests', () => {
  let sample: LState<{ sub: { count: number } }> & { inc(count: number): void, setSame(): void }
  beforeEach(() => {
    sample = createLState({
      initial: { sub: { count: 1 } },
      compare: deepCompare,
      reducers: (setter) => ({
        setSame () {
          setter((old) => ({ sub: { count: old.sub.count } }))
        },
        inc (v) {
          setter((old) => ({ sub: { count: old.sub.count + v } }))
        }
      })
    })
  })
  afterEach(() => {
    sample.$.destroy()
  })
  it('should support initial value', async () => {
    expect(sample.$.get()).toEqual({ sub: { count: 1 } })
  })
  it('should subscribe to changes', async () => {
    const d = defer<void>()
    sample.$.subscribe((v) => {
      expect(v).toEqual({ sub: { count: 2 } })
      d.resolve()
    })
    sample.inc(1)
    return d.promise
  })
  it('should not fire change event when set to the same value', async () => {
    sample.$.subscribe((v) => {
      expect(v).toBe('should not be called')
    })
    sample.setSame()
    sample.inc(0)
    expect(sample.$.get()).toEqual({ sub: { count: 1 } })
  })
  it('should support unsubscribe subscriptions', async () => {
    const unscribe = sample.$.subscribe((v) => {
      expect(v).toBe('should not be called')
    })
    unscribe()
    sample.inc(1)
    await sleep(1)
    expect(sample.$.get()).toEqual({ sub: { count: 2 } })
  })
})
