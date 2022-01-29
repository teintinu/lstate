import { useEffect, useState } from "react";

export interface GlobalState<T extends {}> {
    $: {
        get(): T
        set(fn:(oldvalue: T)=>T):void
        subscribe(subscription: (value: T)=>void): ()=>void
        kill(): void
    },
}

export interface GlobalStateDef<T extends {}, REDUCERS extends GlobalStateReducers> {
    initial: T, 
    reducers: (setter: (fn: (value:T)=>T)=>void)=> REDUCERS
    compare?: (a: T, b: T)=>boolean
}

export interface GlobalStateReducers {
    [key: string]: (...value: any[])=>any
}

export function createGlobalState<T extends {}, REDUCERS extends GlobalStateReducers>(
    def: GlobalStateDef<T, REDUCERS>): GlobalState<T> & REDUCERS{
  let isSame = def.compare || ((a, b)=>a === b)
  let value = def.initial;
  let subscriptions = new Set<(value: T) => void>()
  let self = {
    $: {
        get: getter,
        set: setter,
        subscribe(subscription: (value: T) => void) {
            subscriptions.add(subscription)
            return () => subscriptions.delete(subscription)
        },
        kill() {
            if(self) {
                Object.keys(self.$).forEach(key => {
                    delete (self.$ as any)[key]
                })
                Object.keys(self).forEach(key => {
                    delete self[key]
                })
                value = null as any
                subscriptions.clear()
                subscriptions=null as any
                self===null
                isSame=null as any
            }
        }
    },
    ...def.reducers(setter),
  }
  return self as GlobalState<T> & REDUCERS;
  function getter() {
    return value
  }
  function setter(fn:(oldvalue: T)=>T) {
    const newvalue = fn(value)
    if (!isSame(value, newvalue)) {
        value = newvalue
        dispatch()
    }
  }
  function dispatch() {
    subscriptions.forEach(subscription => {
        setTimeout(()=>subscription(value),1)
    })
  }
}

export function useGlobalState<T>(state:GlobalState<T>): T{
  const [value, setValue] = useState(state.$.get())
  useEffect(() => state.$.subscribe(setValue), [])
  return value
}