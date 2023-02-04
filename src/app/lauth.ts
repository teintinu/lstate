import { createLState, LState, LStateReducers, LStateSetter } from '../state/lstate'

export const Anonymous: AuthAccount = { token: '', roles: 'anonymous' }
export type RolesGranted = string[] | 'anonymous'
export type RolesRequired = RolesGranted | 'public' | 'auth'

export interface AuthAccount {
  token: string
  roles: RolesGranted
}

export type AuthDef<T extends AuthAccount, ACTIONS extends LStateReducers> = {
  initial: T,
  reducers: (setter: LStateSetter<T>)=> ACTIONS
}

export function createLAuth<T extends AuthAccount, ACTIONS extends LStateReducers>
(definition: AuthDef<T, ACTIONS>): LState<T> & ACTIONS {
  return createLState({
    ...definition
  })
}
