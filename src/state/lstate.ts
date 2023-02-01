import { useCallback, useEffect, useState } from 'react'
import { deepCompare } from '../deepCompare'

export type FullReadOnly<T> = T extends Array<infer U> ? ReadonlyArray<FullReadOnly<U>> :
  T extends object ? {
    readonly [P in keyof T]: FullReadOnly<T[P]>;
  }
  : T

export type LStateSetter<T> = (
  value: FullReadOnly<T> |
  ((oldvalue: FullReadOnly<T>) => undefined | FullReadOnly<T>)
 )=>void

export type Unscribe = () => void
export interface LState<T extends {}> {
  $: {
    get(): FullReadOnly<T>
    set: LStateSetter<T>
    subscribe(subscription: (value: FullReadOnly<T>) => void): () => void
    destroy(): void
  },
}

export type LComputedValue<T extends {}> = [value: FullReadOnly<T>, pending: boolean]
export interface LComputed<T extends {}> {
  $: {
    get(): LComputedValue<T>
    subscribe(subscription: (value: LComputedValue<T>) => void): () => void
    destroy(): void
  },
}

export type LCollectionFilter<T extends {}, ID extends keyof T> = T[ID] | ((item: T) => boolean)

export interface LCollection<T extends {}, ID extends keyof T> {
  $: {
    get(): FullReadOnly<T[]>
    set: LStateSetter<T[]>
    load(data: T[]): void
    subscribe(subscription: (items: FullReadOnly<T[]>) => void): () => void
    getItem(id: T[ID]): undefined | FullReadOnly<T>
    subscribeItem(id: T[ID], subscription: (item?: FullReadOnly<T>) => void): () => void
    upsert(item: T): void
    update(id: LCollectionFilter<T, ID>, fn: (old: FullReadOnly<T>) => undefined | Partial<T>): void
    remove(id: LCollectionFilter<T, ID>): void
    destroy(): void
  },
}

export type LAnyState<T extends {}> = LState<T> | LComputed<T> | LCollection<T, any>

export type ExtractLAnyState<T> = T extends LState<infer T1> ? T1 :
  T extends LComputed<infer T2> ? T2 :
  T extends LCollection<infer T3, any> ? T3 :
  unknown

export type ExtractLAnyStates<T> = {
  [key in keyof T]: ExtractLAnyState<T[key]>
}

export interface LStateReducers {
  [key: string]: (...value: any[]) => any
}

export type DependencyComputeSetter<T extends {}, DEPS extends Array<LAnyState<any>>> =
(
  value: FullReadOnly<T> |
  ((oldvalue: FullReadOnly<T>, ...deps: ExtractLAnyStates<DEPS>) => undefined | FullReadOnly<T>)
)=>void

export type DependencyCompute<T extends {}, DEPS extends Array<LAnyState<any>>> =
(
  setter: DependencyComputeSetter<T, DEPS>
)=>void|Promise<void>

export interface LStateDef<T extends {}, REDUCERS extends LStateReducers> {
  initial: T,
  reducers: (setter: LStateSetter<T>) => REDUCERS
  disconnect?: () => void
  compare?: (a: FullReadOnly<T>, b: T) => number
}

export interface LComputedDef<T extends {}, DEPS extends Array<LAnyState<any>>> {
  default: T,
  dependencies: DEPS,
  compute: DependencyCompute<T, DEPS>,
  throttle?: number,
  compare?: (a: FullReadOnly<T>, b: T) => number
}

export interface LCollectionDef<T extends {}, ID extends keyof T, REDUCERS extends LStateReducers> {
  id: ID,
  items: FullReadOnly<T[]>,
  compare?: (a: FullReadOnly<T>, b: T) => number
  reducers: (dml: {
    setter: LStateSetter<T[]>,
    upsert(item: T): void
    update(id: LCollectionFilter<T, ID>, fn: (old: FullReadOnly<T>) => undefined | Partial<T>): void
    remove(id: LCollectionFilter<T, ID>): void
  }) => REDUCERS
}

export function createLState<T extends {}, REDUCERS extends LStateReducers>(
  definition: LStateDef<T, REDUCERS>): LState<T> & REDUCERS
// eslint-disable-next-line no-redeclare
export function createLState<T extends {}, DEPS extends Array<LAnyState<any>>>(
  definition: LComputedDef<T, DEPS>): LComputed<T>;
// eslint-disable-next-line no-redeclare
export function createLState<T extends {}, ID extends keyof T, REDUCERS extends LStateReducers>(
  def: LCollectionDef<T, ID, REDUCERS>): LCollection<T, ID> & REDUCERS;
// eslint-disable-next-line no-redeclare
export function createLState<T extends {}> (
  definition: LStateDef<T, any> | LComputedDef<T, any> | LCollectionDef<T, any, any>
): any {
  let compare: (a: any, b: any) => number =
    (definition as LStateDef<T, any>).compare || ((a, b) => a === b ? 0 : 1)
  const colId = (definition as LCollectionDef<T, any, any>).id
  const items = colId && (definition as LCollectionDef<T, any, any>).items
  let value: unknown = (definition as LStateDef<T, any>).initial ||
    items ||
    [(definition as LComputedDef<T, any>).default, true]
  let disconnect = (definition as LStateDef<T, any>).disconnect
  let deps = (definition as LComputedDef<T, any>).dependencies
  const throttle = (definition as LComputedDef<T, any>).throttle || 100
  let compute = (definition as LComputedDef<T, any>).compute
  let subscriptions = new Set<(value: any) => void>()
  let unscribeDeps: Array<() => void> | undefined
  let self: any = {
    $: {
      get: getter,
      subscribe (subscription: (value: any) => void) {
        deps && (!unscribeDeps) && initDeps()
        subscriptions.add(subscription)
        return () => subscriptions && subscriptions.delete(subscription) && releaseDeps()
      },
      destroy () {
        if (self) {
          releaseDeps()
          Object.keys(self.$).forEach(key => {
            delete (self.$ as any)[key]
          })
          Object.keys(self).forEach(key => {
            delete (self as any)[key]
          })
          value = undefined as any
          subscriptions.clear()
          subscriptions = undefined as any
          self = undefined as any
          compare = undefined as any
          deps = undefined as any
          compute = undefined as any
          if (disconnect) {
            setTimeout(disconnect, 1)
            disconnect = undefined as any
          }
        }
      }
    }
  }
  if (!compute) {
    self.$.setter = setter
    const reducers: any = (definition as LStateDef<T, any>).reducers
    if (reducers) self = { ...self, ...reducers(items ? { setter, update, upsert, remove } : setter) }
  }
  if (items) {
    self.$.load = (data: any) => {
      setter(() => data)
    }
    self.$.getItem = (idval: any) => {
      return (getter() as any).find((i: any) => i[colId] === idval)
    }
    self.$.subscribeItem = (idval: any, subscription: (item: any) => void): (() => void) => {
      return self.$.subscribe((items: any) => {
        const item = items.find((i: any) => i[colId] === idval)
        if (item) { subscription(item) }
      })
    }
    self.$.upsert = upsert
    self.$.update = update
    self.$.remove = remove
  }
  return self
  function getter () {
    return value
  }
  function setter (v: any|((oldvalue: any) => any)) {
    Promise.resolve(typeof v === 'function' ? v(value) : v)
      .then(newvalue => {
        if (newvalue && compare(value, newvalue) !== 0) {
          value = newvalue as any
          dispatch()
        }
      })
  }
  function dispatch () {
    subscriptions.forEach(subscription =>
      subscription(value)
    )
  }
  function initDeps () {
    let shouldRun = true
    unscribeDeps = deps.map((dep: any) => dep.$.subscribe(needRecompute))
    needRecompute()
    function needRecompute () {
      if (unscribeDeps && !((value as any)[1])) {
        value = [(value as any)[0], true]
        setTimeout(dispatch, 1)
      }
      shouldRun && setTimeout(() => {
        shouldRun = true
        computeIt()
      }, throttle)
      shouldRun = false
    }
  }
  function releaseDeps () {
    if (unscribeDeps) {
      unscribeDeps.forEach(fn => setTimeout(fn, 1))
      unscribeDeps = undefined
    }
  }
  function computeIt () {
    if (unscribeDeps && ((value as any)[1])) {
      const cSetter: DependencyComputeSetter<T, any> = (nv) => {
        Promise.resolve(
          typeof nv === 'function'
            ? nv((value as any)[0], ...deps.map((dep: any) => dep.$.get()) as any)
            : nv)
          .then(newvalue => {
            newvalue && setter([newvalue, false])
          })
      }
      compute(cSetter)
    }
  }
  function upsert (item: any): void {
    setter((oldItems: T[]) => {
      let changed = false
      let needInsert = true
      const changedItems = oldItems.map((oldItem: any) => {
        if (oldItem[colId] === item[colId]) {
          needInsert = false
          changed = changed || deepCompare(oldItem, item) !== 0
          return item
        }
        return oldItem
      })
      if (needInsert) {
        changedItems.push(item)
        changed = true
      }
      if (changed) return changedItems
    })
  }
  function createFilterItem (filter: LCollectionFilter<T, any>): (item: T) => boolean {
    if (typeof filter === 'function') return filter
    return (item: T) => ((item as any)[colId] === filter)
  }
  function update (filter: LCollectionFilter<T, any>, fn: (old: any) => any): void {
    setter((oldItems: T[]) => {
      let changed = false
      const filterFn = createFilterItem(filter)
      const changedItems = oldItems.map((oldItem) => {
        if (filterFn(oldItem)) {
          const update = fn(oldItem)
          if (update) {
            const newItem = { ...oldItem, ...update }
            changed = changed || deepCompare(oldItem, newItem) !== 0
            return newItem
          }
        }
        return oldItem
      })
      if (changed) return changedItems
    })
  }
  function remove (filter: LCollectionFilter<T, any>): void {
    setter((oldItems: T[]) => {
      let changed = false
      const filterFn = createFilterItem(filter)
      const changedItems = oldItems.filter((oldItem) => {
        if (filterFn(oldItem)) {
          changed = true
          return false
        }
        return true
      })
      if (changed) return changedItems
    })
  }
}

export function useLState<T extends {}>(state: LState<T>): FullReadOnly<T>;
// eslint-disable-next-line no-redeclare
export function useLState<T extends {}>(state: LComputed<T>): LComputedValue<T>;
// eslint-disable-next-line no-redeclare
export function useLState<T extends {}, ID extends keyof T>(state: LCollection<T, ID>): FullReadOnly<T[]>;
// eslint-disable-next-line no-redeclare
export function useLState<T extends {}, ID extends keyof T>(state: LCollection<T, ID>, id: T[ID]): FullReadOnly<T>;
// eslint-disable-next-line no-redeclare
export function useLState<T extends {}> (state: LAnyState<T>, id?: any): FullReadOnly<T> | FullReadOnly<T[]> {
  const isItem = arguments.length === 2
  const [value, setValue] = useState(() =>
    isItem ? (state as LCollection<T, any>).$.getItem(id) : state.$.get()
  )
  const cbSetValue = useCallback((value: FullReadOnly<T>) => setValue(value), [state, setValue])
  useEffect(() => {
    if (isItem) {
      return (state as LCollection<T, any>).$.subscribeItem(id, cbSetValue as any)
    }
    return (state as LState<T>).$.subscribe(cbSetValue as any)
  }, [state, setValue])
  return value as any
}
