/* eslint-disable no-use-before-define */

import React from 'react'
import { createLState, LAnyState, LState, ReadOnlyObject, Unscribe } from './lstate'
import { deepCompare } from './deepCompare'

export type RolesGranted = string[] | 'anonymous'
export type RolesRequired = RolesGranted | 'public'| 'auth'

export interface AuthProviderState {
  logged: RolesGranted
 }

export interface AuthProvider extends LState<AuthProviderState> {
  logout(): Promise<void>
}

export interface VarsBase {
  title: string
}

export interface AppPagelets {
  header: number|false,
  footer: number|false,
  lside: number|false,
  rside: number|false,
}

const MIN_CONTENT_SIZE = 100

export interface AppLayout {
  desired: AppPagelets
  actual: AppPagelets
  window: Size
  content: Size
}

export interface AppDecl<AUTH extends AuthProvider, VARS extends LState<VarsBase>> {
  title: string,
  auth: AUTH,
  vars: VARS,
  routes: {
    home: PageDef<any, {}>,
    notFound: PageDef<any, {url: string}>,
    forbidden: PageDef<any, {page: PageDef<any, any>, roles: RolesRequired}>,
    pages: Array<AppRoute<any>>
  },
  initialLayout: AppPagelets,
  load<DATA extends Object>(uri: string): Promise<DocumentDef<DATA>>
  getMenu<MENUITEM extends AppMenuItem>(): MENUITEM[],
  windowReference: WindowReference | 'pushState' // | 'hash',
}

export interface DocumentDef<DATA extends Object> {
  uri: string,
  data: LAnyState<DATA>,
  unload(): void,
}

export interface AppDef<AUTH extends AuthProvider, VARS extends LState<VarsBase>>{
  readonly auth: AUTH,
  readonly vars: VARS,
  readonly jobs: LState<Array<JobDef<any, any>>>,
  readonly router: Router
  readonly layout: LState<AppLayout>,
  can (required: RolesRequired): boolean,
  run<DATA extends Object, ARG> (a: ActionDef<DATA, ARG>, arg: ARG): Promise<void>,
}

export type RouterState = Array<ContentDef<any, any>>

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
  goUrl (url: string, replace: boolean): void
  goHistory (n: number): void
  unscribe(): void
}

export interface PageDef<DATA extends object, PARAMS extends object> {
  collection: string
  cache: {
    [id:string]: ContentDef<DATA, PARAMS>
  }
  identify(params: PARAMS): string
  title(data: undefined | DATA): string
  subscribe<DATA extends Object>(id: string, fn: (data: undefined | DATA)=>void): Unscribe
  view (params: PARAMS, data: undefined | DATA): ViewDef<DATA>,
  requires: RolesRequired
}

export interface ViewDecl<DATA extends object> {
  title(data: undefined | DATA): string
  readonly?: boolean,
  actions: (app: AppDef<any, any>) => Array<ActionDef<DATA, any>>,
  component: React.ComponentType<DATA>,
  onBack: false | (() => boolean),
}

export interface ViewDef<DATA extends object> {
  title(data: undefined | DATA): string
  readonly?: boolean,
  actions: Array<ActionDef<DATA, any>>,
  component: React.ComponentType<DATA>,
  onBack: false | (() => boolean),
}

export interface ContentDef<DATA extends object, PARAMS extends object> {
  id: string
  page: PageDef<DATA, PARAMS>,
  state: LState<ContentState<DATA, PARAMS>>,
  history: Array<ViewDef<DATA>>,
  release():void
  destroy():void
}

export interface ContentState<DATA extends object, PARAMS extends object> {
  title: {
    page: string
    view: string
  },
  data: undefined | DATA
  params: PARAMS,
  view: ViewDef<DATA>,
  actions: Array<ActionDef<DATA, any>>,
 }

export interface AppRoute<T extends { [name: string]: string }> {
  path: Array<string | { param: keyof T }>,
  page: PageDef<any, T>,
  params?: Partial<T>
}

export interface ActionDef<DATA extends object, ARG> {
  label: string,
  requires: RolesRequired,
  kind: 'primary' | 'secondary' | 'tertiary',
  description(value: DATA, arg: ARG): string,
  state(value: undefined|DATA): {visible: boolean, disabled: boolean},
  reducer (current: ReadOnlyObject<DATA>, arg: ARG): Promise<Next<DATA> | void>
}

export interface Next<DATA extends object> {
  view?: ViewDef<DATA>,
  state: undefined|DATA,
}

export interface JobDef <DATA extends object, ARG> {
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

export function createLApplication<AUTH extends AuthProvider, VARS extends LState<VarsBase>> (
  decl: AppDecl<AUTH, VARS>
): AppDef<AUTH, VARS> {
  const { auth, vars } = decl
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
  const def: AppDef<AUTH, VARS> = {
    layout,
    auth,
    vars,
    jobs,
    router,
    // registerBadge (pub: Publication<AppBagde>): AppBagdeDef,
    can,
    run: runAtActivePage
  }
  return def
  function urlChanged (): void {
    const { page, params } = getRouterFromUrl()
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
  function runAtActivePage<DATA extends Object, ARG> (a: ActionDef<DATA, ARG>, arg: ARG): Promise<void> {
    const content = getActiveContent()
    return runAt(content, a, arg)
  }
  function runAt<DATA extends Object, ARG> (content: ContentDef<DATA, any>, a: ActionDef<DATA, ARG>, arg: ARG): Promise<void> {
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
      data: content.state.$get().data as any,
      action: a,
      arg,
      defer
    }
    jobs.handle(job)
    return defer.promise
  }
  function createContent<DATA extends Object, PARAMS extends object> (id: string, page: PageDef<DATA, PARAMS>, params: PARAMS): ContentDef<DATA, PARAMS> {
    const initialView = page.view(params, undefined)
    const initialState: ContentState<DATA, PARAMS> = {
      title: {
        page: page.title(undefined),
        view: initialView.title(undefined)
      },
      params,
      data: undefined,
      view: initialView,
      actions: initialView.actions.filter(a => can(a.requires))
    }
    let contentState = createLState({
      initial: initialState,
      compare (a, b) {
        return a === b as any
      },
      actions: (setter) => {
        return {
          update (data: DATA|undefined) {
            setter((old) => {
              if (deepCompare(data, old, true) === 0) return old

              const newView = page.view(params, undefined)
              const newState: ContentState<DATA, PARAMS> = {
                title: {
                  page: page.title(data),
                  view: newView.title(data)
                },
                params,
                data,
                view: newView,
                actions: newView.actions.filter(a => can(a.requires))
              }
              return newState
            })
          }
        }
      }
    })
    let unscribe = page.subscribe(id, (data) => {
      contentState && contentState.update(data as any)
    })
    let content: ContentDef<DATA, PARAMS> = {
      id,
      page,
      state: contentState,
      history: [],
      release () {
        // TODO: release
      },
      destroy () {
        delete page.cache[id]
        const state = contentState
        const unscribeIt = unscribe;
        (unscribe as any) = undefined;
        (content as any) = undefined;
        (contentState as any) = undefined
        unscribeIt()
        state.$destroy()
      }
    }
    return content
  }
  function getActiveContent (): ContentDef<any, any> {
    return router.$get() as any
  }
  function getRouterFromUrl<DATA extends Object, PARAMS extends object> (): {page: PageDef<DATA, PARAMS>, params: PARAMS} {
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
    const { page, params } = getRouterFromUrl()
    const id = page.identify(params)
    const initialContent = createContent(id, page, params)
    const r = createLState({
      initial: [initialContent] as RouterState,
      actions: (setter) => {
        return {
          async activate<DATA extends Object, PARAMS extends object> (page: PageDef<DATA, PARAMS>, params: PARAMS): Promise<void> {
            const id = page.identify(params)
            let content = page.cache[id]
            if (!content) {
              content = createContent(id, page, params)
              page.cache[id] = content
            }
            setter((old) => {
              const state: RouterState = [
                content,
                ...old.filter(c => c.id !== id)
              ]
              return state
            })
          },
          async close () {
            const content = getActiveContent()
            content.release()
            setter((old) => {
              const state: RouterState = [
                ...old.filter(c => c.id !== id)
              ]
              return state
            })
          },
          async closeAll () {
            setter((old) => {
              old.forEach(c => c.release())
              return []
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
    let $url = '^/'
    const $params: string[] = []
    for (let i = 0; i < r.path.length; i++) {
      const p = r.path[i]
      if (i > 0) $url = $url + '/'
      if (typeof p === 'string') {
        if (/\\W/g.test(p)) throw new Error(p + ' nome parametro invalido: ' + JSON.stringify(r))
        $url = $url + p
      } else {
        $url = $url + '([^/]*)'
        const pn = p.param as string
        if (/\\W/g.test(pn)) throw new Error(pn + ' nome parametro invalido: ' + JSON.stringify(r))
        $params.push(pn)
      }
    }
    $url = $url + '$'
    return { ...r, $url, $params }
  }
  function can (required: RolesRequired): boolean {
    if (required === 'public') return true
    const { logged } = auth.$get()
    if (logged === 'anonymous') return required === 'anonymous'
    if (required === 'auth') return true
    return logged.some((r) => required.indexOf(r) >= 0)
  }
}

export function windowReferenceForPushState ({
  sizeChanged, urlChanged
}: {
  sizeChanged(): void
  urlChanged(): void
}) : {
  getUrl(): string
  goUrl (url: string, replace: boolean): void
  getSize(): Size
  goHistory (n: number): void
  unscribe (): void
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
