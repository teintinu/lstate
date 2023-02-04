import React from 'react'
import { ActionDecl, ActionDef } from './laction'

export interface ViewDecl<STATE extends object> {
    title(state: undefined | STATE): string
    actions: { [name: string]: ActionDecl<STATE, any> },
    component: React.ComponentType<{ state?: STATE }>,
    onBack: false | (() => boolean),
}

export interface ViewDef<STATE extends object> {
    title(state: undefined | STATE): string
    actions: Array<ActionDef<STATE, any>>,
    component: React.ComponentType<{ state?: STATE }>,
    onBack: () => boolean,
}

export function createView<STATE extends Object> (
  view: ViewDecl<STATE>
): ViewDef<STATE> {
  return {
    ...view,
    actions: Object.keys(view.actions).map((k) => ({
      ...view.actions[k],
      name: k,
      visible: view.actions[k].visible || alwaysTrue,
      enabled: view.actions[k].enabled || alwaysTrue
    })),
    onBack: view.onBack || alwaysFalse
  }
}

function alwaysTrue () {
  return true
}

function alwaysFalse () {
  return false
}
