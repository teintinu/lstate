import { createLState, LState, LStateActions, LStateSetter, ReadOnlyObject, useLState } from '../state/lstate'

export const Anonymous: AuthAccount = { token: '', roles: 'anonymous' }
export type RolesGranted = string[] | 'anonymous'
export type RolesRequired = RolesGranted | 'public' | 'auth'

export interface AuthAccount {
  token: string
  roles: RolesGranted
}

export type AuthDef<T extends AuthAccount, ACTIONS extends LStateActions> = {
  initial: T,
  actions: (setter: LStateSetter<T>)=> ACTIONS
}

export function createLAuth<T extends AuthAccount, ACTIONS extends LStateActions>
  (definition: AuthDef<T, ACTIONS>): LState<T> & ACTIONS {
  return createLState({
    ...definition
  })
}
