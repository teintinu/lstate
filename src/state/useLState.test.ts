/**
 * @jest-environment jsdom
 */

import { createLState, useLState } from './lstate'
import { sleep } from 'pjobs'
import { renderHook } from '../test-utils/renderHook'

describe('useLState - value', () => {
  let sample: ReturnType<typeof createSampleState>
  beforeEach(() => {
    sample = createSampleState()
  })
  afterAll(async () => {
    // sample.$.destroy()
    // renderers.forEach((r) => r.unmount())
    await sleep(500)
  })
  it('initial value', async () => {
    const hook = renderHook(() => useLState(sample))
    hook.expect({ value: 0 })
  })
  it('invoke actions', async () => {
    const hook = renderHook(() => useLState(sample))
    hook.expect({ value: 0 })
    await hook.act(async () => {
      sample.set(1)
    })
    hook.expect({ value: 1 })
  })
  it('invoke computed', async () => {
    const computed = createLState({
      default: { double: -1 },
      dependencies: [sample],
      compute: (setter) => {
        setter((_, a) => ({ double: a.value * 2 }))
      }
    })
    const hook = renderHook(() => {
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
    hook.expect([{ double: -1 }, true])
    await hook.act(async () => {
      await sleep(150)
    })
    hook.expect([{ double: 0 }, false])
    await hook.act(() => {
      sample.set(1)
    })
    await hook.act(async () => {
      await sleep(10)
    })
    hook.expect([{ double: 0 }, true])
    await hook.act(async () => {
      await sleep(150)
    })
    hook.expect([{ double: 2 }, false])
  })
})

describe('useLState - fn', () => {
  let sample: ReturnType<typeof createSampleState>
  beforeEach(() => {
    sample = createSampleState()
  })
  afterAll(async () => {
    // sample.$.destroy()
    // renderers.forEach((r) => r.unmount())
    await sleep(500)
  })
  beforeEach(() => sample.reset())
  it('initial value', async () => {
    const hook = renderHook(() => useLState(sample))
    hook.expect({ value: 0 })
  })
  it('invoke actions', async () => {
    const hook = renderHook(() => useLState(sample))
    hook.expect({ value: 0 })
    await hook.act(() => {
      sample.inc()
    })
    hook.expect({ value: 1 })
    await hook.act(async () => {
      await sleep(150)
    })
  })
  it('invoke computed', async () => {
    const computed = createLState({
      default: { double: -1 },
      dependencies: [sample],
      compute: (setter) => {
        setter((_, a) => ({ double: a.value * 2 }))
      }
    })
    const hook = renderHook(() => {
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
    hook.expect([{ double: -1 }, true])
    await hook.act(async () => {
      await sleep(150)
    })
    hook.expect([{ double: 0 }, false])
    await hook.act(() => {
      sample.inc()
    })
    await hook.act(async () => {
      await sleep(10)
    })
    hook.expect([{ double: 0 }, true])
    await hook.act(async () => {
      await sleep(150)
    })
    hook.expect([{ double: 2 }, false])
    await hook.act(async () => {
      await sleep(150)
    })
  })
})

describe('useLState - with Promise', () => {
  let sample: ReturnType<typeof createSampleState>
  beforeEach(() => {
    sample = createSampleState()
  })
  afterAll(async () => {
    await sleep(500)
  })
  beforeEach(() => sample.reset())
  it('initial value', async () => {
    const hook = renderHook(() => useLState(sample))
    hook.expect({ value: 0 })
  })
  it('invoke actions', async () => {
    const hook = renderHook(() => useLState(sample))
    hook.expect({ value: 0 })
    await hook.act(() => {
      sample.inc()
    })
    hook.expect({ value: 1 })
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
    const hook = renderHook(() => {
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
    hook.expect([{ double: -1 }, true])
    await hook.act(async () => {
      await sleep(150)
    })
    hook.expect([{ double: 0 }, false])
    await hook.act(() => {
      sample.inc()
    })
    await hook.act(async () => {
      await sleep(10)
    })
    hook.expect([{ double: 0 }, true])
    await hook.act(async () => {
      await sleep(150)
    })
    hook.expect([{ double: 2 }, false])
  })
})

function createSampleState () {
  return createLState({
    initial: { value: 0 },
    reducers: (setter) => ({
      reset () {
        setter({ value: 0 })
      },
      set (value: number) {
        setter({ value })
      },
      inc (amount = 1) {
        setter(o => ({ value: o.value + amount }))
      }
    })
  })
}
