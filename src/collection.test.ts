/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react-hooks'
import { createLState, LCollection, useLState } from './lstate'
import { defer, sleep } from 'pjobs'

describe('collection subscription tests', () => {
  interface Employee {
    _id: number
    name: string
    salary: number
  }
  const sampleEmployees: Employee[] = [
    {
      _id: 1,
      name: 'one',
      salary: 100
    },
    {
      _id: 2,
      name: 'two',
      salary: 200
    }
  ]
  const sampleEmployees2: Employee[] = [
    ...sampleEmployees,
    {
      _id: 3,
      name: 'three',
      salary: 100
    }
  ]
  let sample: LCollection<Employee, '_id'> & {
    setSame(): void,
    raiseSalary(id: number, amount: number): void,
}
  beforeEach(() => {
    sample = createLState({
      id: '_id',
      items: sampleEmployees,
      reducers: ({ update, setter }) => ({
        setSame () {
          setter((old) => old)
        },
        raiseSalary (id: number, amount:number) {
          update(id, (old) => ({ salary: (old.salary || 0) + amount }))
        }
      })
    })
  })
  afterEach(() => {
    sample.$.destroy()
  })
  it('should support initial value', () => {
    expect(sample.$.get()).toEqual(sampleEmployees)
  })
  it('should support load raw data', async () => {
    sample.$.load(sampleEmployees2)
    await sleep(1)
    expect(sample.$.get()).toEqual(sampleEmployees2)
  })
  it('should subscribe to inserts', async () => {
    const d = defer<void>()
    sample.$.subscribe((v) => {
      expect(v).toEqual([
        ...sampleEmployees,
        {
          _id: 100,
          name: 'hundred',
          salary: 100
        }
      ])
      d.resolve()
    })
    sample.$.upsert({
      _id: 100,
      name: 'hundred',
      salary: 100
    })
    return d.promise
  })
  it('should subscribe to updates with upsert', async () => {
    const d = defer<void>()
    sample.$.subscribe((v) => {
      expect(v).toEqual(sampleEmployees.map(e => {
        if (e === sampleEmployees[0]) {
          return {
            ...e,
            salary: 150
          }
        }
        return e
      }))
      d.resolve()
    })
    sample.$.upsert({
      ...sampleEmployees[0],
      salary: 150
    })
    return d.promise
  })
  it('should subscribe to updates with filtered upsert', async () => {
    const d = defer<void>()
    sample.$.subscribe((v) => {
      expect(v).toEqual(sampleEmployees.map(e => {
        if (e === sampleEmployees[0]) {
          return {
            ...e,
            salary: 150
          }
        }
        return e
      }))
      d.resolve()
    })
    sample.$.update(
      (e) => e.name === 'one',
      (e) => ({
        ...e,
        salary: 150
      }))
    return d.promise
  })
  it('should subscribe to updates with update', async () => {
    const d = defer<void>()
    sample.$.subscribe((v) => {
      expect(v).toEqual(sampleEmployees.map(e => {
        if (e === sampleEmployees[0]) {
          return {
            ...e,
            salary: 150
          }
        }
        return e
      }))
      d.resolve()
    })
    sample.raiseSalary(1, 50)
    return d.promise
  })

  it('should subscribe to remove an item', async () => {
    const d = defer<void>()
    sample.$.subscribe((v) => {
      expect(v).toEqual([sampleEmployees[0]])
      d.resolve()
    })
    sample.$.remove(2)
    return d.promise
  })
  it('should subscribe to remove an item', async () => {
    const d = defer<void>()
    sample.$.subscribe((v) => {
      expect(v).toEqual([sampleEmployees[0]])
      d.resolve()
    })
    sample.$.remove(e => e.name === 'two')
    return d.promise
  })
  it('should not dispatch when try remove an nonexisting data', async () => {
    sample.$.subscribe((v) => {
      expect(v).toBe('should not be called')
    })
    sample.$.remove(9)
    await sleep(150)
  })
  it('should subscribe to changes of an item', async () => {
    const d = defer<void>()
    sample.$.subscribeItem(2, (item) => {
      expect(item).toEqual({ ...sampleEmployees[1], salary: 240 })
      d.resolve()
    })
    sample.raiseSalary(2, 40)
    return d.promise
  })
  it('should not fire change event when set to the same value', async () => {
    sample.$.subscribe((v) => {
      expect(v).toBe('should not be called')
    })
    sample.setSame()
    sample.raiseSalary(1, 0)
    sleep(100)
    expect(sample.$.get()).toEqual(sampleEmployees)
  })
  it('should support unsubscribe subscriptions', async () => {
    const unscribe = sample.$.subscribe((v) => {
      expect(v).toBe('should not be called')
    })
    unscribe()
    sample.raiseSalary(1, 50)
    await sleep(100)
    expect(sample.$.get()).toEqual(sampleEmployees.map(e => {
      if (e === sampleEmployees[0]) {
        return {
          ...e,
          salary: 150
        }
      }
      return e
    }))
  })
  describe('useLState on collection', () => {
    it('initial items', async () => {
      const { result } = renderHook(() => useLState(sample))
      expect(result.current).toEqual(sampleEmployees)
    })
    it('invoke actions', async () => {
      const { result } = renderHook(() => useLState(sample))
      act(() => {
        sample.raiseSalary(1, 50)
      })
      expect(result.current).toEqual(sampleEmployees)
      await act(async () => {
        await sleep(100)
      })
      expect(result.current).toEqual(sampleEmployees.map(e => {
        if (e === sampleEmployees[0]) {
          return {
            ...e,
            salary: 150
          }
        }
        return e
      }))
    })
  })
  describe('useLState on collection item', () => {
    it('initial value', async () => {
      const { result } = renderHook(() => useLState(sample, 1))
      expect(result.current).toEqual(sampleEmployees[0])
    })
    it('invoke actions', async () => {
      const { result } = renderHook(() => useLState(sample, 1))
      act(() => {
        sample.raiseSalary(1, 50)
      })
      expect(result.current).toEqual(sampleEmployees[0])
      await act(async () => {
        await sleep(100)
      })
      expect(result.current).toEqual({
        ...sampleEmployees[0],
        salary: 150
      })
    })
  })
})
