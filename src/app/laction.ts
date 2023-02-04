import { FullReadOnly } from 'src/state/lstate'
import { RolesRequired } from './lauth'
import { ViewDef } from './lview'

export interface ActionDecl<STATE extends object, ARG> {
    label: string,
    requires: RolesRequired,
    kind: 'primary' | 'secondary' | 'tertiary',
    description(state: undefined | FullReadOnly<STATE>, arg: ARG): string,
    visible?(state: undefined | FullReadOnly<STATE>): boolean,
    enabled?(state: undefined | FullReadOnly<STATE>): boolean,
    reducer(current: undefined | FullReadOnly<STATE>, arg: ARG): Promise<Next<STATE> | void> | Next<STATE> | void
}

export interface ActionDef<STATE extends object, ARG> {
    name: string,
    label: string,
    requires: RolesRequired,
    kind: 'primary' | 'secondary' | 'tertiary',
    description(state: undefined | FullReadOnly<STATE>, arg: ARG): string,
    visible(state: undefined | FullReadOnly<STATE>): boolean,
    enabled(state: undefined | FullReadOnly<STATE>): boolean,
    reducer(current: undefined | FullReadOnly<STATE>, arg: ARG): Promise<Next<STATE> | void> | Next<STATE> | void
}

export interface Next<STATE extends object> {
    view?: ViewDef<STATE>,
    state: undefined | STATE,
}
