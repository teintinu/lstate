import { createLState, LState, LComputed } from './lstate'
import { defer, sleep } from 'pjobs'

describe('count on stateB is double of count on stateA', () => {
  let connected: number = 0
  let stateA: LState<{ count: number }> & { inc(count: number): void, setSame(): void }
  let stateB: LComputed<{ doubleOfCount: number }>
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
      default: { doubleOfCount: -1 },
      dependencies: [stateA],
      compute: (setter) => {
        setter((_, a) => ({ doubleOfCount: a.count * 2 }))
      },
      throttle: 100
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
    expect(stateB.$.get()).toEqual([{ doubleOfCount: -1 }, true])
  })
  it('should subscribe to changes', async () => {
    const d = defer<void>()
    const log: string[] = []
    let eventSeq = 0
    stateA.$.subscribe((v) => {
      eventSeq++
      if (eventSeq === 2) {
        expect(log).toEqual(['B=default(pending)'])
        log.push('A=1')
      } else {
        expect(log).toEqual([
          'B=default(pending)',
          'A=1',
          'B=2'
        ])
        log.push('A=2')
      }
      expect(v).toEqual({ count: 2 })
    })
    stateB.$.subscribe(([v, pending]) => {
      eventSeq++
      if (eventSeq === 1) {
        expect(log).toEqual([])
        log.push('B=default(pending)')
      } else if (eventSeq === 3) {
        expect(log).toEqual(['B=default(pending)', 'A=1'])
        log.push('B=2')
        expect(pending).toBe(true)
        expect(v).toEqual({ doubleOfCount: 2 })
      } else {
        expect(log).toEqual(['B=default(pending)', 'A=1', 'B=2'])
        expect(pending).toBe(false)
        expect(v).toEqual({ doubleOfCount: 4 })
        d.resolve()
      }
    })
    await sleep(150)
    stateA.inc(1)
    return d.promise
  })
  it('should not fire change event when set to the same value', async () => {
    await sleep(150)
    let computingCount = 0
    stateA.$.subscribe((v) => {
      expect(v).toBe('should not be called')
    })
    stateB.$.subscribe(([v, pending]) => {
      if (pending) return
      computingCount++
      if (computingCount > 1) {
        expect(v).toBe('recomputing un')
      }
    })
    stateA.setSame()
    expect(stateA.$.get()).toEqual({ count: 1 })
    await sleep(150)
    expect(stateB.$.get()).toEqual([{ doubleOfCount: 2 }, false])
  })
  it('should support unsubscribe subscriptions', async () => {
    await sleep(150)
    const unscribeA = stateA.$.subscribe((v) => {
      expect(v).toBe('should not be called')
    })
    const unscribeB = stateB.$.subscribe(([v, pending]) => {
      if (pending) return
      expect(v).toBe('should not be called')
    })
    unscribeB()
    unscribeA()
    stateA.inc(1)
    await sleep(5)
    expect(stateA.$.get()).toEqual({ count: 2 })
    await sleep(150)
    expect(stateB.$.get()).toEqual([{ doubleOfCount: -1 }, true])
  })
})

describe('count on stateB is promisified double of count on stateA', () => {
  let connected: number = 0
  let stateA: LState<{ count: number }> & { inc(count: number): void, setSame(): void }
  let stateB: LComputed<{ doubleOfCount: number }>
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
      default: { doubleOfCount: -1 },
      dependencies: [stateA],
      async compute (setter) {
        await Promise.resolve()
        setter((_, a) => ({ doubleOfCount: a.count * 2 }))
      },
      throttle: 50
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
    expect(stateB.$.get()).toEqual([{ doubleOfCount: -1 }, true])
  })
  it('should subscribe to changes', async () => {
    const d = defer<void>()
    const log: string[] = []
    let eventSeq = 0
    stateA.$.subscribe((v) => {
      eventSeq++
      if (eventSeq === 2) {
        expect(log).toEqual(['B=default(pending)'])
        log.push('A=1')
      } else {
        expect(log).toEqual([
          'B=default(pending)',
          'A=1',
          'B=2'
        ])
        log.push('A=2')
      }
      expect(v).toEqual({ count: 2 })
    })
    stateB.$.subscribe(([v, pending]) => {
      eventSeq++
      if (eventSeq === 1) {
        expect(log).toEqual([])
        log.push('B=default(pending)')
      } else if (eventSeq === 3) {
        expect(log).toEqual(['B=default(pending)', 'A=1'])
        log.push('B=2')
        expect(pending).toBe(true)
        expect(v).toEqual({ doubleOfCount: 2 })
      } else {
        expect(log).toEqual(['B=default(pending)', 'A=1', 'B=2'])
        expect(pending).toBe(false)
        expect(v).toEqual({ doubleOfCount: 4 })
        d.resolve()
      }
    })
    await sleep(150)
    stateA.inc(1)
    return d.promise
  })
  it('should not fire change event when set to the same value', async () => {
    await sleep(150)
    let computingCount = 0
    stateA.$.subscribe((v) => {
      expect(v).toBe('should not be called')
    })
    stateB.$.subscribe(([v, pending]) => {
      if (pending) return
      computingCount++
      if (computingCount > 1) {
        expect(v).toBe('recomputing un')
      }
    })
    stateA.setSame()
    expect(stateA.$.get()).toEqual({ count: 1 })
    await sleep(150)
    expect(stateB.$.get()).toEqual([{ doubleOfCount: 2 }, false])
  })
  it('should respect throttle when firing events', async () => {
    await sleep(150)
    const log:string[] = []
    let computingCount = 0
    stateB.$.subscribe(([v, pending]) => {
      computingCount++
      log.push([computingCount, ' B=', v.doubleOfCount, pending ? 'P' : ''].join(''))
      if (computingCount === 1) {
        expect(log).toEqual(['1 B=6'])
      } else if (computingCount === 2) {
        expect(log).toEqual(['1 B=6', '2 B=6P'])
      } else if (computingCount === 3) {
        expect(log).toEqual(['1 B=6', '2 B=6P', '3 B=10'])
      } else if (computingCount === 4) {
        expect(log).toEqual(['1 B=6', '2 B=6P', '3 B=10', '4 B=10P'])
      } else if (computingCount === 5) {
        expect(log).toEqual(['1 B=6', '2 B=6P', '3 B=10', '4 B=10P', '5 B=14'])
      } else if (computingCount === 6) {
        expect(log).toEqual(['1 B=6', '2 B=6P', '3 B=10', '4 B=10P', '5 B=14', '6 B=14P'])
      } else if (computingCount === 7) {
        expect(log).toEqual(['1 B=6', '2 B=6P', '3 B=10', '4 B=10P', '5 B=14', '6 B=14P', '7 B=18'])
      } else if (computingCount === 8) {
        expect(log).toEqual(['1 B=6', '2 B=6P', '3 B=10', '4 B=10P', '5 B=14', '6 B=14P', '7 B=18', '8 B=18P'])
      } else if (computingCount === 9) {
        expect(log).toEqual(['1 B=6', '2 B=6P', '3 B=10', '4 B=10P', '5 B=14', '6 B=14P', '7 B=18', '8 B=18P', '9 B=20'])
      } else {
        expect(log).toEqual('?')
      }
    })
    for (let i = 1; i < 10; i++) {
      stateA.inc(1)
      await sleep(40)
    }
    await sleep(200)
    expect(stateB.$.get()).toEqual([{ doubleOfCount: 20 }, false])
  })
  it('should support unsubscribe subscriptions', async () => {
    await sleep(150)
    const unscribeA = stateA.$.subscribe((v) => {
      expect(v).toBe('should not be called')
    })
    const unscribeB = stateB.$.subscribe(([v, pending]) => {
      if (pending) return
      expect(v).toBe('should not be called')
    })
    unscribeB()
    unscribeA()
    stateA.inc(1)
    await sleep(5)
    expect(stateA.$.get()).toEqual({ count: 2 })
    await sleep(150)
    expect(stateB.$.get()).toEqual([{ doubleOfCount: -1 }, true])
  })
})
