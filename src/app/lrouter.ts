import { createLState, LState, LStateActions, LStateSetter, ReadOnlyObject, Unscribe, useLState } from '../state/lstate'
import { AuthAccount, AuthDef, RolesRequired } from './lauth'

export interface RouterDef {
    home: PageDef<any, {}>,
    notFound: PageDef<any, { url: string }>,
    forbidden: PageDef<any, { page: PageDef<any, any>, roles: RolesRequired }>,
    pages: Array<Route<any>>
}

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

export interface ViewDecl<DATA extends object> {
  title(data: undefined | DATA): string
  actions: { [name: string]: ActionDef<DATA, any> },
  component: React.ComponentType<{data: DATA}>,
  onBack: false | (() => boolean),
}

export interface ViewDef<DATA extends object> {
  title(data: undefined | DATA): string
  actions: Array<ActionDef<DATA, any>>,
  component: React.ComponentType<{data: DATA}>,
  onBack: false | (() => boolean),
}

export interface Route<T extends { [name: string]: string }> {
  path: Array<string | { param: keyof T }>,
  page: PageDef<any, T>,
  params?: Partial<T>
}

export interface ActionDecl<DATA extends object, ARG> {
  label: string,
  requires: RolesRequired,
  kind: 'primary' | 'secondary' | 'tertiary',
  description(value: DATA, arg: ARG): string,
  state(value: undefined | DATA): { visible: boolean, disabled: boolean },
  reducer(current: ReadOnlyObject<DATA>, arg: ARG): Promise<Next<DATA> | void>
}

export interface ActionDef<DATA extends object, ARG> {
  name: string,
  label: string,
  requires: RolesRequired,
  kind: 'primary' | 'secondary' | 'tertiary',
  description(value: DATA, arg: ARG): string,
  state(value: undefined | DATA): { visible: boolean, disabled: boolean },
  reducer(current: ReadOnlyObject<DATA>, arg: ARG): Promise<Next<DATA> | void>
}

export interface Next<DATA extends object> {
  view?: ViewDef<DATA>,
  state: undefined | DATA,
}

interface AppParsedRoute extends Route<any> {
  $url: string,
  $params: string[]
}
export interface RouterState {
  tabs: Array<ContentItemDef<any, any>>,
}

export interface ContentItemDef<DATA extends object, PARAMS extends object> {
  id: string
  page: PageDef<DATA, PARAMS>,
  title: {
    page: string
    view: string
  },
  group: string
  data: undefined | DATA
  params: PARAMS,
  view: ViewDef<DATA>,
  actions: Array<ActionDef<DATA, any>>,
  history: Array<ViewDef<DATA>>,
  ping: number,
  changeGroup(group: string): void
  release(): void
  destroy(): void
}

export interface Router extends LState<RouterState> {
  activate<DATA extends Object, PARAMS extends object>(page: PageDef<DATA, PARAMS>, params?: PARAMS): Promise<void>
  close(): Promise<void>
  closeAll(): Promise<void>
}

export function createLRoute<T extends AuthAccount, ACTIONS extends LStateActions>
  (definition: AuthDef<T, ACTIONS>): LState<T> & ACTIONS {
  return createLState({
    ...definition
  })
}

  function createRouter (): Router {
    const { page, params } = getRouteFromUrl()
    const id = page.identify(params)
    const initialContent = getContent(id, defaultContentGroup, page, params)
    const r = createLState({
      initial: { tabs: [initialContent] } as RouterState,
      actions: (setter) => {
        return {
          async activate<DATA extends Object, PARAMS extends object> (page: PageDef<DATA, PARAMS>, params: PARAMS, group = defaultContentGroup): Promise<void> {
            const id = page.identify(params)
            const content = getContent(id, group, page, params)
            setter((old) => {
              if (old.tabs[0]?.id === id) return old
              const newItems = [
                {
                  ...content,
                  ping: Date.now()
                },
                ...old.tabs.filter(c => c.id !== id)
              ]
              return { tabs: newItems }
            })
          },
          async close () {
            const content = getActiveContent().tabs[0]
            if (content) {
              content.release()
              setter((old) => {
                const newItems = [
                  ...old.tabs.filter(c => c.id !== id)
                ]
                return { tabs: newItems }
              })
            }
          },
          async closeAll () {
            setter((old) => {
              old.tabs.forEach(c => c.release())
              return { tabs: [] }
            })
          }
        }
      }
    })
    return r as any as Router
  }

//   function parseRoutePaths (): AppParsedRoute[] {
//     return decl.routes.pages.map((p) => parseRoutePath(p))
//   }
//   function parseRoutePath (r: AppRoute<any>): AppParsedRoute {
//     let $url = '^\\/'
//     const $params: string[] = []
//     for (let i = 0; i < r.path.length; i++) {
//       const p = r.path[i]
//       if (i > 0) $url = $url + '\\/'
//       if (typeof p === 'string') {
//         if (!/^\w+$/g.test(p)) throw new Error(p + ' nome parametro invalido: ' + JSON.stringify(r))
//         $url = $url + p
//       } else {
//         $url = $url + '([^/]*)'
//         const pn = p.param as string
//         if (!/^\w+$/g.test(pn)) throw new Error(pn + ' nome parametro invalido: ' + JSON.stringify(r))
//         $params.push(pn)
//       }
//     }
//     $url = $url + '$'
//     return { ...r, $url, $params }
//   }
//   function can (required: RolesRequired): boolean {
//     if (required === 'public') return true
//     const { logged } = getAuth()
//     if (logged === 'anonymous') return required === 'anonymous'
//     if (required === 'auth') return true
//     return logged.some((r) => required.indexOf(r) >= 0)
//   }
// }

// export function createPage<DATA extends Object, PARAMS extends object> (
//   page: PageDecl<DATA, PARAMS>
// ): PageDef<DATA, PARAMS> {
//   return {
//     ...page
//   }
// }

// export function createView<DATA extends Object> (
//   view: ViewDecl<DATA>
// ): ViewDef<DATA> {
//   return {
//     ...view,
//     actions: Object.keys(view.actions).map((k) => ({
//       ...view.actions[k],
//       name: k
//     }))
//   }
// }