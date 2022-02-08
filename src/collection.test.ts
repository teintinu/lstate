import { createLState, LCollection } from './lstate'
import { defer, sleep } from 'pjobs'

describe('collection subscription tests', () => {
  let sample: LCollection<{id: string, count: number}> & { inc(id: string, count: number): void, setSame(): void}
  beforeEach(() => {
    sample = createLState({
      default: { a: { count: 1 }, b: { count: 2 } },
      actions: ({ upsert, setter }) => ({
        setSame () {
          setter((old) => old)
        },
        inc (id, v) {
          upsert(id, (old) => ({ count: (old?.count || 0) + v }))
        }
      })
    })
  })
  afterEach(() => {
    sample.$.destroy()
  })
  it('should support initial value', () => {
    expect(sample.$.get()).toEqual({ a: { count: 1 }, b: { count: 2 } })
  })
  it('should support load raw data', () => {
    sample.$.load([{ id: 'c', count: 3 }, { id: 'd', count: 4 }])
    expect(sample.$.get()).toEqual({ c: { count: 3 }, d: { count: 4 } })
  })
  it('should subscribe to inserts', async () => {
    const d = defer<void>()
    sample.$.subscribe((v) => {
      expect(v).toEqual({ a: { count: 1 }, b: { count: 2 }, c: { count: 1 } })
      d.resolve()
    })
    sample.inc('c', 1)
    return d.promise
  })
  it('should subscribe to updates', async () => {
    const d = defer<void>()
    sample.$.subscribe((v) => {
      expect(v).toEqual({ a: { count: 1 }, b: { count: 3 } })
      d.resolve()
    })
    sample.inc('b', 1)
    return d.promise
  })
  it('should subscribe to remove an item', async () => {
    const d = defer<void>()
    sample.$.subscribe((v) => {
      expect(v).toEqual({ a: { count: 1 } })
      d.resolve()
    })
    sample.$.remove('b')
    return d.promise
  })
  it('should not dispatch when try remove an unexisting data', async () => {
    sample.$.subscribe((v) => {
      expect(v).toBe('should not be called')
    })
    sample.$.remove('c')
    await sleep(150)
  })
  it('should subscribe to changes as list', async () => {
    const d = defer<void>()
    sample.$.subscribeList((v) => {
      expect(v).toEqual([{ id: 'a', count: 1 }, { id: 'b', count: 3 }])
      d.resolve()
    })
    sample.inc('b', 1)
    return d.promise
  })
  it('should subscribe to changes quering by reducers', async () => {
    const d = defer<void>()
    sample.$.subscribeQuery(
      { totalMinusA: 0 },
      (prev, curr) => {
        if (curr.id !== 'a') {
          prev.totalMinusA += curr.count
        }
        return prev
      },
      (v) => {
        expect(v).toEqual({ totalMinusA: 3 })
        d.resolve()
      })
    sample.inc('b', 1)
    return d.promise
  })
  it('should subscribe to changes of an item', async () => {
    const d = defer<void>()
    sample.$.subscribeItem('b', (item) => {
      expect(item).toEqual({ count: 3 })
      d.resolve()
    })
    sample.inc('b', 1)
    return d.promise
  })
  it('should not fire change event when set to the same value', async () => {
    sample.$.subscribe((v) => {
      expect(v).toBe('should not be called')
    })
    sample.setSame()
    sample.inc('a', 0)
    sleep(100)
    expect(sample.$.get()).toEqual({ a: { count: 1 }, b: { count: 2 } })
  })
  it('should support unsubscribe subscriptions', async () => {
    const unscribe = sample.$.subscribe((v) => {
      expect(v).toBe('should not be called')
    })
    unscribe()
    sample.inc('a', 1)
    expect(sample.$.get()).toEqual({ a: { count: 2 }, b: { count: 2 } })
  })
})
