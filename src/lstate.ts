import { useEffect, useState } from 'react'

export type FullReadOnly<T> = T extends Array<infer U> ? ReadonlyArray<FullReadOnly<U>> :
T extends object ? {
    readonly [P in keyof T]: FullReadOnly<T[P]>;
}
: T

export type GlobalStateSetter<T> = (fn:(oldvalue: FullReadOnly<T>)=>T) =>void

export interface GlobalState<T extends {}> {
    $: {
        get(): FullReadOnly<T>
        set: GlobalStateSetter<T>
        subscribe(subscription: (value: FullReadOnly<T>)=>void): ()=>void
        destroy(): void
    },
}

export interface GlobalStateReducers {
    [key: string]: (...value: any[])=>any
}

export type DependencyCompute<T extends {}> = (setter: GlobalStateSetter<T>) => void

export interface GlobalStateDef<T extends {}, REDUCERS extends GlobalStateReducers> {
    initial: T,
    reducers: (setter: GlobalStateSetter<T>)=> REDUCERS
    dependencies?: [...Array<GlobalState<any>>, DependencyCompute<T>]
    compare?: (a: FullReadOnly<T>, b: T)=>boolean
}

export function createGlobalState<T extends {}, REDUCERS extends GlobalStateReducers> (
  def: GlobalStateDef<T, REDUCERS>): GlobalState<T> & REDUCERS {
  let isSame = def.compare || ((a, b) => a === b)
  let value: FullReadOnly<T> = def.initial as any
  let unscribeDeps: Array<()=>void> | undefined
  initDeps()
  let subscriptions = new Set<(value: FullReadOnly<T>) => void>()
  let self = {
    $: {
      get: getter,
      set: setter,
      subscribe (subscription: (value: FullReadOnly<T>) => void) {
        subscriptions.add(subscription)
        return () => subscriptions && subscriptions.delete(subscription)
      },
      destroy () {
        if (self) {
          if (unscribeDeps) {
            unscribeDeps.forEach(fn => setTimeout(fn, 1))
            unscribeDeps = undefined
          }
          Object.keys(self.$).forEach(key => {
            delete (self.$ as any)[key]
          })
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
    },
    ...def.reducers(setter)
  }
  return self as GlobalState<T> & REDUCERS
  function getter () {
    return value
  }
  function setter (fn:(oldvalue: FullReadOnly<T>)=>T) {
    const newvalue = fn(value)
    if (!isSame(value, newvalue)) {
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
    if (!def.dependencies) return
    unscribeDeps = []
    let compute : DependencyCompute<T>
    let tm: any
    def.dependencies.forEach((dep) => {
      if (isGlobalState(dep)) unscribeDeps!.push(dep.$.subscribe(recompute))
      else compute = dep
    })
    recompute()
    function recompute () {
      if (tm) clearTimeout(tm)
      tm = setTimeout(() => {
        if (unscribeDeps) { compute(setter) }
      }, 100)
    }
  }
}

export function useGlobalState<T> (state:GlobalState<T>) {
  const [value, setValue] = useState(() => state.$.get())
  useEffect(() => state.$.subscribe(setValue), [])
  return value
}

export function isGlobalState (state:any): state is GlobalState<any> {
  return state && state.$ && state.$.get && state.$.set
}
