import { useEffect, useState } from 'react'
import { deepCompare } from './deepCompare'

export type ReadOnlyObject<T> =
    T extends (...args: any[]) => any ? T
    : T extends Date ? T
    : T extends object ? {
        readonly [name in keyof T]: ReadOnlyObject<T[name]>
    }
    : T extends Array<infer K> ? ReadonlyArray<K>
    :
    T

export type LStateSetter<T> = <U extends T>(fn:(oldvalue: Readonly<U>)=>undefined|U) =>void

export type Unscribe = ()=>void
export interface LState<T extends {}> {
    $get<U extends T>(): ReadOnlyObject<U>
    $set: LStateSetter<T>
    $subscribe<U extends T>(subscription: (value: ReadOnlyObject<U>)=>void): Unscribe
    $destroy(): void
}

export interface LComputed<T extends {}> {
    $get(): ReadOnlyObject<T>
    $subscribe(subscription: (value: ReadOnlyObject<T>)=>void): Unscribe
    $destroy(): void
}

export type LCollectionOf<T extends {id: string}> = {
    [id: string]: Omit<T, 'id'>
}

export type LCollectionList<T extends { id: string }> = T[]

export interface LCollection<T extends { id: string}> {
    $get(): ReadOnlyObject<LCollectionOf<T>>
    $set: LStateSetter<LCollectionOf<T>>
    $load(data: ReadOnlyObject<LCollectionOf<T>>): void
    $subscribe(subscription: (collectionOf: ReadOnlyObject<LCollectionOf<T>>)=>void): Unscribe
    $subscribeList(
        subscription: (items: ReadOnlyObject<LCollectionList<T>>)=>void
    ): Unscribe
    $subscribeQuery<R=LCollectionList<T>>(
        initial: R,
        reducer: (last: R, item: ReadOnlyObject<T>)=>R,
        subscription: (reduced: ReadOnlyObject<R>)=>void,
    ): Unscribe
    $subscribeItem(id: string, subscription: (item?: ReadOnlyObject<LCollectionOf<T>>)=>void): Unscribe
    $upsert (id: string, fn:(old?: Omit<T, 'id'>)=> undefined | Omit<T, 'id'>): void
    $remove(id: string): void
    $destroy(): void
}

export type LAnyState<T extends object> = LState<T> | LComputed<T> | (T extends {id:string} ? LCollection<T> : never)

export type ExtractLAnyState<T> = T extends LState<infer T1> ? T1 :
    T extends LComputed<infer T2> ? T2 :
    T extends LCollection<infer T3> ? T3 :
    never

export type ExtractLAnyStates<T> = {
    [key in keyof T]: ExtractLAnyState<T[key]>
}

export interface LStateActions {
    [key: string]: (...value: any[])=>any
}

export type DependencyCompute<T extends {}, DEPS extends Array<LAnyState<any>>> =
  (setter: LStateSetter<T>, ...deps: ExtractLAnyStates<DEPS>) => void

export interface LStateDef<T extends {}, ACTIONS extends LStateActions> {
    initial: T,
    actions: (setter: LStateSetter<T>)=> ACTIONS
    compare?: (a: ReadOnlyObject<T>, b: T)=>boolean
}

export interface LComputedDef<T extends {}, DEPS extends Array<LAnyState<any>>> {
    default: T,
    dependencies: DEPS,
    compute: DependencyCompute<T, DEPS>,
    compare?: (a: ReadOnlyObject<T>, b: T)=>boolean
}

export interface LCollectionDef<T extends {id:string}, ACTIONS extends LStateActions> {
    items: ArrayLike<T> | LCollectionOf<T>,
    actions: (dml: {
        setter: LStateSetter<LCollectionOf<T>>,
        upsert (id: string, fn:(old?: Omit<T, 'id'>)=> undefined | Omit<T, 'id'>): void
        remove(id: string): void
    }) => ACTIONS
}

export type LStateExtract<T> = T extends LState<infer U> ? U :
T extends LComputed<infer U> ? U :
T extends LCollection<infer U> ? U : never
export type LStateExtractCollection<T> =
T extends LCollection<infer U> ? U : never

export function createLState<T extends {}, ACTIONS extends LStateActions> (
  def: LStateDef<T, ACTIONS>): LState<T> & ACTIONS
// eslint-disable-next-line no-redeclare
export function createLState<T extends {}, DEPS extends Array<LAnyState<any>>> (
  def: LComputedDef<T, DEPS>): LComputed<T>;
// eslint-disable-next-line no-redeclare
export function createLState<T extends {id: string}, ACTIONS extends LStateActions> (
  def: LCollectionDef<T, ACTIONS>): LCollection<T> & ACTIONS;
// eslint-disable-next-line no-redeclare
export function createLState (def: any): any {
  let isSame : (a: any, b: any) => boolean = def.compare || ((a, b) => a === b)
  const items = def.items && collectionListToCollectionOf(def.items)
  let value: any = def.initial || items || def.default
  const deps = def.dependencies
  const compute = def.compute
  let subscriptions = new Set<(value: any) => void>()
  let unscribeDeps: Array<()=>void> | undefined
  if (deps) initDeps()
  let self: any = {
    $get: getter,
    $subscribe (subscription: (value: any) => void) {
      subscriptions.add(subscription)
      return () => subscriptions && subscriptions.delete(subscription)
    },
    $destroy () {
      if (self) {
        if (unscribeDeps) {
          unscribeDeps.forEach(fn => setTimeout(fn, 1))
          unscribeDeps = undefined
        }
        Object.keys(self).forEach(key => {
          delete self[key]
        })
        value = null as any
        subscriptions.clear()
        subscriptions = null as any
        self = null as any
        isSame = null as any
      }
    }
  }
  if (!def.compute) {
    self.$setter = setter
    if (def.actions) self = { ...self, ...def.actions(items ? { setter, upsert, remove } : setter) }
  }
  if (items) {
    self.$load = (data: any) => {
      setter(() => data)
    }
    self.$subscribeList = (
      subscription: (items: any)=>void
    ): (()=>void) => {
      return self.$subscribe(
        (collectionOf: any) =>
          subscription(collectionOfToCollectionList(collectionOf) as any)
      )
    }
    self.$subscribeQuery = (
      initial: any,
      reducer: (last: any, item: any)=> any,
      subscription: (reduced: any)=>void
    ): (()=>void) => {
      return self.$subscribe((collectionOf: any) => subscription(
        collectionOfToCollectionList(collectionOf).reduce(reducer, initial)
      ))
    }
    self.$subscribeItem = (id: string, subscription: (item: any)=>void): (()=>void) => {
      return self.$subscribe((collectionOf: any) =>
        subscription(collectionOf[id] as any)
      )
    }
    self.$upsert = upsert
    self.$remove = remove
  }
  return self
  function getter () {
    return value
  }
  function setter (fn:(oldvalue: any)=>any) {
    const newvalue = fn(value)
    if (newvalue && !isSame(value, newvalue)) {
      value = newvalue as any
      dispatch()
    }
  }
  function dispatch () {
    subscriptions.forEach(subscription => {
      setTimeout(() => subscription(value), 1)
    })
  }
  function initDeps () {
    unscribeDeps = []
    let tm: any
    unscribeDeps = deps.map((dep: any) => dep.$subscribe(recompute))
    recompute()
    function recompute () {
      if (tm) clearTimeout(tm)
      tm = setTimeout(() => {
        if (unscribeDeps) {
          compute(setter, ...deps.map((dep: any) => dep.$get()) as any)
        }
      }, 100)
    }
  }
  function upsert (id: string, fn:(old?: any)=> any): void {
    setter((collectionOf: any) => {
      const item: any = collectionOf[id]
      const updatedItem: any = fn(item as any)
      if (updatedItem) {
        return deepCompare(item, updatedItem, true) === 0
          ? collectionOf as any
          : {
              ...collectionOf,
              [id]: updatedItem
            }
      }
    })
  }
  function remove (id: string): void {
    setter((collectionOf) => {
      const copy: any = { ...collectionOf }
      if (copy[id]) {
        delete copy[id]
        return copy
      } else return collectionOf
    })
  }
}

export function useLState<T> (state:LState<T>) {
  const [value, setValue] = useState(() => state.$get())
  useEffect(() => state.$subscribe(setValue), [])
  return value
}

export function collectionListToCollectionOf<T extends {id: string}> (list: ReadOnlyObject<LCollectionList<T>>): LCollectionOf<T> {
  const ret:LCollectionOf<T> = {} as any
  list.forEach((item) => {
    const { id, ...data } = item
    ret[id] = data as any
  })
  return ret
}

export function collectionOfToCollectionList<T extends {id: string}> (collection: ReadOnlyObject<LCollectionOf<T>>): LCollectionList<T> {
  return Object.keys(collection).map((id) => ({ id, ...collection[id] } as any as T))
}
