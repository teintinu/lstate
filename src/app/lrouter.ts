import { createLState, FullReadOnly, LState, LStateReducers, Unscribe } from '../state/lstate'
import { AuthAccount, AuthDef, RolesRequired } from './lauth'

export interface RouterDef<AUTH extends AuthAccount, ACTIONS extends LStateReducers> {
  auth: LState<AUTH>
  home: PageDef<any, {}>,
  notFound: PageDef<any, { url: string }>,
  forbidden: PageDef<any, { page: PageDef<any, any>, roles: RolesRequired }>,
  pages: Array<Route<any>>
}

export interface Route<T extends { [name: string]: string }> {
  path: Array<string | { param: keyof T }>,
  page: PageDef<any, T>,
  params?: Partial<T>
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

export function createLRoute<T extends AuthAccount, ACTIONS extends LStateReducers>
(definition: RouterDef<T, ACTIONS>): LState<T> & ACTIONS {
  const { page, params } = getRouteFromUrl()
  const id = page.identify(params)
  const initialContent = getContent(id, defaultContentGroup, page, params)
  const r = createLState({
    initial: { tabs: [initialContent] } as RouterState,
    reducers: (setter) => {
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

  function parseRoutePaths (): AppParsedRoute[] {
    return decl.routes.pages.map((p) => parseRoutePath(p))
  }
  function parseRoutePath (r: AppRoute<any>): AppParsedRoute {
    let $url = '^\\/'
    const $params: string[] = []
    for (let i = 0; i < r.path.length; i++) {
      const p = r.path[i]
      if (i > 0) $url = $url + '\\/'
      if (typeof p === 'string') {
        if (!/^\w+$/g.test(p)) throw new Error(p + ' nome parametro invalido: ' + JSON.stringify(r))
        $url = $url + p
      } else {
        $url = $url + '([^/]*)'
        const pn = p.param as string
        if (!/^\w+$/g.test(pn)) throw new Error(pn + ' nome parametro invalido: ' + JSON.stringify(r))
        $params.push(pn)
      }
    }
    $url = $url + '$'
    return { ...r, $url, $params }
  }
  function can (required: RolesRequired): boolean {
    if (required === 'public') return true
    const { logged } = getAuth()
    if (logged === 'anonymous') return required === 'anonymous'
    if (required === 'auth') return true
    return logged.some((r) => required.indexOf(r) >= 0)
  }
}
