/* eslint-disable no-use-before-define */

import React from 'react'
import { createLState, LState, ReadOnlyObject, Unscribe } from './lstate'
import { deepCompare } from './deepCompare'

export type RolesGranted = string[] | 'anonymous'
export type RolesRequired = RolesGranted | 'public' | 'auth'

export interface AuthProviderState {
  logged: RolesGranted
}

export interface AuthProvider extends LState<AuthProviderState> {
  logout(): Promise<void>
}

export interface AppPagelets {
  header: number | false,
  footer: number | false,
  lside: number | false,
  rside: number | false,
}

const MIN_CONTENT_SIZE = 100

export interface AppLayout {
  desired: AppPagelets
  actual: AppPagelets
  window: Size
  content: Size
}

export interface AppDecl {
  title: string,
  routes: {
    home: PageDef<any, {}>,
    notFound: PageDef<any, { url: string }>,
    forbidden: PageDef<any, { page: PageDef<any, any>, roles: RolesRequired }>,
    pages: Array<AppRoute<any>>
  },
  initialLayout: AppPagelets,
  getAuth(): ReadOnlyObject<AuthProviderState>
  getMenu<MENUITEM extends AppMenuItem>(): MENUITEM[],
  windowReference: WindowReference | 'pushState' // | 'hash',
  defaultContentGroup: string,
}

export interface AppDef {
  readonly jobs: LState<Array<JobDef<any, any>>>,
  readonly router: Router
  readonly layout: LState<AppLayout>,
  can(required: RolesRequired): boolean,
  run<DATA extends Object, ARG>(a: ActionDef<DATA, ARG>, arg: ARG): Promise<void>,
}

export interface Router extends LState<RouterState> {
  activate<DATA extends Object, PARAMS extends object>(page: PageDef<DATA, PARAMS>, params?: PARAMS): Promise<void>
  close(): Promise<void>
  closeAll(): Promise<void>
}

export type AppMenuItem = AppMenuItemSimple | AppMenuItemWithSubmenu | '-'

export interface AppMenuItemSimple {
  title: string,
  url: string,
  roles: RolesRequired
}

export interface AppMenuItemWithSubmenu {
  title: string,
  submenu: AppMenuItem[],
  roles: RolesRequired
}

export interface Size {
  width: number,
  height: number
}

export type WindowReference = (handles: {
  sizeChanged(size: Size): void
  urlChanged(url: string): void
}) => {
  getUrl(): string,
  getSize(): Size,
  goUrl(url: string, replace: boolean): void
  goHistory(n: number): void
  unscribe(): void
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

export interface AppRoute<T extends { [name: string]: string }> {
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

export interface JobDef<DATA extends object, ARG> {
  description: string,
  action: ActionDef<DATA, ARG>,
  data: undefined | DATA,
  arg: ARG,
  defer: {
    resolve: () => void,
    reject: (err: Error) => void,
    promise: Promise<void>,
  }
}

interface AppParsedRoute extends AppRoute<any> {
  $url: string,
  $params: string[]
}

export function createLApplication (
  decl: AppDecl
): AppDef {
  const cache: { [id: string]: ContentItemDef<any, any>} = {}
  const { getAuth, defaultContentGroup } = decl
  const winRef = decl.windowReference === 'pushState' ? windowReferenceForPushState : decl.windowReference
  const { getUrl, getSize } = winRef({ // TODO: unscribe
    sizeChanged,
    urlChanged
  })
  const parsedRoutes = parseRoutePaths()
  const { notFound, forbidden } = decl.routes
  const router = createRouter()
  const jobs = createJobs()
  const layout = createLayout()
  const def: AppDef = {
    layout,
    jobs,
    router,
    // registerBadge (pub: Publication<AppBagde>): AppBagdeDef,
    can,
    run: runAtActivePage
  }
  return def
  function urlChanged (): void {
    const { page, params } = getRouteFromUrl()
    router.activate(page, params)
  }
  function createLayout () {
    const initial = calcLayout(decl.initialLayout)
    return createLState({
      initial,
      compare: (a, b) => deepCompare(a, b, true) === 0,
      actions: (setter) => {
        return {
          setDesired (desired: AppPagelets) {
            setter((state) => deepCompare(state.desired, desired, false) === 0 ? state : calcLayout(desired))
          },
          resize () {
            setter((state) => calcLayout(state.desired))
          }
        }
      }
    })
    function calcLayout (desired: AppPagelets) {
      const windowSize = getSize()
      const actual = { ...desired }
      if ((desired.header || 0) + (desired.footer || 0) + MIN_CONTENT_SIZE > windowSize.height) {
        actual.header = false
        actual.footer = false
      }
      if ((desired.lside || 0) + (desired.rside || 0) + MIN_CONTENT_SIZE > windowSize.width) {
        actual.lside = false
        actual.rside = false
      }
      const content = {
        width: windowSize.width - (actual.lside || 0) - (actual.rside || 0),
        height: windowSize.height - (actual.header || 0) - (actual.footer || 0)
      }
      const layout: AppLayout = {
        desired,
        actual,
        window: windowSize,
        content
      }
      return layout
    }
  }
  function sizeChanged (): void {
    layout.resize()
  }
  function getActiveContent (): RouterState {
    return router.$get() as any
  }
  function runAtActivePage<DATA extends Object, ARG> (a: ActionDef<DATA, ARG>, arg: ARG): Promise<void> {
    const [content] = getActiveContent().tabs
    return content && runAt(content, a, arg)
  }
  function runAt<DATA extends Object, ARG> (content: ContentItemDef<DATA, any>, a: ActionDef<DATA, ARG>, arg: ARG): Promise<void> {
    const defer: {
      resolve: () => void,
      reject: (err: Error) => void
      promise: Promise<void>
    } = {

    } as any
    defer.promise = new Promise<void>((resolve, reject) => {
      defer.resolve = resolve
      defer.reject = reject
    })
    const job: JobDef<DATA, ARG> = {
      description: a.label,
      data: content.data,
      action: a,
      arg,
      defer
    }
    jobs.handle(job)
    return defer.promise
  }
  function getContent<DATA extends Object, PARAMS extends object> (id: string, group: string, page: PageDef<DATA, PARAMS>, params: PARAMS): ContentItemDef<DATA, PARAMS> {
    const cached = cache[id]
    if (cached) {
      return cached as any
    }
    const initialView = page.view(params, undefined)
    let unscribe = page.subscribe(id, (data) => {
      update(data as DATA)
    })
    const content: ContentItemDef<DATA, PARAMS> = {
      id,
      page,
      history: [],
      title: {
        page: page.title(undefined),
        view: initialView.title(undefined)
      },
      group,
      params,
      data: undefined,
      view: initialView,
      actions: initialView.actions.filter(a => can(a.requires)),
      ping: Date.now(),
      changeGroup,
      release,
      destroy
    }
    setTimeout(() => {
      router.$set((old) => {
        return { tabs: [content, ...old.tabs] }
      })
    }, 1)

    return content
    function update (data: DATA | undefined) {
      router.$set((old) => {
        let changed = false
        const newItems = old.tabs.map((item) => {
          if (item.page === page) {
            if (deepCompare(item.data, data, true) !== 0) {
              changed = true
              const view = page.view(params, data)
              const newItem = {
                ...item,
                data,
                view: view,
                title: {
                  page: page.title(undefined),
                  view: initialView.title(undefined)
                },
                actions: view.actions.filter(a => can(a.requires))
              }
              newItem.data = data
              return newItem
            }
          }
          return item
        })
        return changed ? { tabs: newItems } : old
      })
    }
    function changeGroup (ngroup: string) {
      router.$set((old) => {
        const newItems = old.tabs.map((item) => {
          if (item.page === page) {
            return {
              ...item,
              group: ngroup
            }
          }
          return item
        })
        return { tabs: newItems }
      })
    }
    function release () {
      router.$set((old) => {
        const newItems = old.tabs.map((item) => {
          if (item.page === page) {
            return {
              ...item,
              ping: 0
            }
          }
          return item
        })
        return { tabs: newItems }
      })
    }
    function destroy () {
      delete cache[id]
      const unscribeIt = unscribe;
      (unscribe as any) = undefined
      setTimeout(unscribeIt, 1)
      router.$set((old) => {
        const newItems = old.tabs.filter((item) => item.id !== id)
        return { tabs: newItems }
      })
    }
  }

  function getRouteFromUrl<DATA extends Object, PARAMS extends object> (): { page: PageDef<DATA, PARAMS>, params: PARAMS } {
    const url = getUrl()

    let page: PageDef<any, any> | undefined
    let params: any = {}
    for (let i = 0; (!page) && i < parsedRoutes.length; i++) {
      const r = parsedRoutes[i]
      const rg = new RegExp(r.$url, 'g')
      const m = rg.exec(url)
      if (m) {
        page = r.page
        params = r.params as any || {}
        r.$params.forEach((pn, idx) => {
          params[pn] = m[idx]
        })
      }
    }

    debugger
    if (!page) {
      page = notFound
      params = { url }
    }
    const requireRoles: RolesRequired = page.requires
    if (!can(requireRoles)) {
      params = { page, roles: requireRoles }
      page = forbidden
    }
    return { page, params }
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
  function createJobs () {
    return createLState({
      initial: [] as Array<JobDef<any, any>>,
      actions: (setter) => {
        return {
          handle<DATA extends object, ARG> (job: JobDef<DATA, ARG>) {
            setter((state) => [...state, job])
            job.action.reducer(job.data as any, job.arg)
              .then(job.defer.resolve, job.defer.reject)
              .finally(() => {
                setter((state) => state.filter((j) => j !== job))
              })
          }
        }
      }
    })
  }
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

export function createPage<DATA extends Object, PARAMS extends object> (
  page: PageDecl<DATA, PARAMS>
): PageDef<DATA, PARAMS> {
  return {
    ...page
  }
}

export function createView<DATA extends Object> (
  view: ViewDecl<DATA>
): ViewDef<DATA> {
  return {
    ...view,
    actions: Object.keys(view.actions).map((k) => ({
      ...view.actions[k],
      name: k
    }))
  }
}

export function windowReferenceForPushState ({
  sizeChanged, urlChanged
}: {
  sizeChanged(): void
  urlChanged(): void
}): {
  getUrl(): string
  goUrl(url: string, replace: boolean): void
  getSize(): Size
  goHistory(n: number): void
  unscribe(): void
} {
  window.onpopstate = notifyUrl
  window.onresize = notifySize
  window.onload = notifyAll
  return {
    getUrl () {
      return window.location.pathname
    },
    getSize () {
      return {
        width: window.innerWidth,
        height: window.innerHeight
      }
    },
    goUrl (url: string, replace: boolean): void {
      console.log('goUrl', url, replace)
      if (replace) window.history.replaceState(undefined, '', url)
      else window.history.pushState(undefined, '', url)
      setTimeout(notifyUrl, 1)
    },
    goHistory (n: number): void {
      console.log('goHistory', n)
      window.history.go(n)
    },
    unscribe () {
      const w: any = window
      delete w.onpopstate
      delete w.onresize
      delete w.onload
    }
  }
  function notifyAll () {
    urlChanged()
    sizeChanged()
  }
  function notifyUrl () {
    urlChanged()
  }
  function notifySize () {
    sizeChanged()
  }
}
