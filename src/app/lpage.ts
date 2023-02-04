import { RolesRequired } from './lauth'

export interface PageDecl<DATA extends object, PARAMS extends object> {
    identify(params: PARAMS): string
    title(data: undefined | DATA): string
    subscribe<DATA extends Object>(id: string, fn: (data: undefined | DATA) => void): Unscribe
    view(params: PARAMS, data: undefined | DATA): ViewDef<DATA>,
    requires: RolesRequired
  }

export interface PageDef<DATA extends object, PARAMS extends object> {
    identify(params: PARAMS): string
    title(data: undefined | DATA): string
    subscribe<DATA extends Object>(id: string, fn: (data: undefined | DATA) => void): Unscribe
    view(params: PARAMS, data: undefined | DATA): ViewDef<DATA>,
    requires: RolesRequired
  }

export function createPage<DATA extends Object, PARAMS extends object> (
  page: PageDecl<DATA, PARAMS>
): PageDef<DATA, PARAMS> {
  return {
    ...page
  }
}
