// /* eslint-disable no-use-before-define */

export const x=1;
// import React from 'react'
// import { createLState, LState, ReadOnlyObject, Unscribe } from './state/lstate'
// import { deepCompare } from './deepCompare'

// export interface AppDecl {
//   title: string,
//   initialLayout: AppPagelets,
//   getAuth(): ReadOnlyObject<AuthProviderState>
//   getMenu<MENUITEM extends AppMenuItem>(): MENUITEM[],
//   mode: WindowReference | 'pushState' // | 'hash',
//   defaultContentGroup: string,
// }

// export interface AppDef {
//   readonly jobs: LState<Array<JobDef<any, any>>>,
//   readonly router: Router
//   readonly layout: LState<AppLayout>,
//   can(required: RolesRequired): boolean,
//   run<DATA extends Object, ARG>(a: ActionDef<DATA, ARG>, arg: ARG): Promise<void>,
// }

// export type AppMenuItem = AppMenuItemSimple | AppMenuItemWithSubmenu | '-'

// export interface AppMenuItemSimple {
//   title: string,
//   url: string,
//   roles: RolesRequired
// }

// export interface AppMenuItemWithSubmenu {
//   title: string,
//   submenu: AppMenuItem[],
//   roles: RolesRequired
// }





// export function createLApplication (
//   decl: AppDecl
// ): AppDef {
//   const cache: { [id: string]: ContentItemDef<any, any>} = {}
//   const { getAuth, defaultContentGroup } = decl
//   const winRef = decl.mode === 'pushState' ? windowReferenceForPushState : decl.mode
//   const { getUrl, getSize } = winRef({ // TODO: unscribe
//     sizeChanged,
//     urlChanged
//   })
//   const parsedRoutes = parseRoutePaths()
//   const { notFound, forbidden } = decl.routes
//   const router = createRouter()
//   const jobs = createJobs()
//   const layout = createLayout()
//   const def: AppDef = {
//     layout,
//     jobs,
//     router,
//     // registerBadge (pub: Publication<AppBagde>): AppBagdeDef,
//     can,
//     run: runAtActivePage
//   }
//   return def
//   function urlChanged (): void {
//     const { page, params } = getRouteFromUrl()
//     router.activate(page, params)
//   }
//   function createLayout () {
//     const initial = calcLayout(decl.initialLayout)
//     return createLState({
//       initial,
//       compare: (a, b) => deepCompare(a, b, true) === 0,
//       actions: (setter) => {
//         return {
//           setDesired (desired: AppPagelets) {
//             setter((state) => deepCompare(state.desired, desired, false) === 0 ? state : calcLayout(desired))
//           },
//           resize () {
//             setter((state) => calcLayout(state.desired))
//           }
//         }
//       }
//     })
//     function calcLayout (desired: AppPagelets) {
//       const windowSize = getSize()
//       const actual = { ...desired }
//       if ((desired.header || 0) + (desired.footer || 0) + MIN_CONTENT_SIZE > windowSize.height) {
//         actual.header = false
//         actual.footer = false
//       }
//       if ((desired.lside || 0) + (desired.rside || 0) + MIN_CONTENT_SIZE > windowSize.width) {
//         actual.lside = false
//         actual.rside = false
//       }
//       const content = {
//         width: windowSize.width - (actual.lside || 0) - (actual.rside || 0),
//         height: windowSize.height - (actual.header || 0) - (actual.footer || 0)
//       }
//       const layout: AppLayout = {
//         desired,
//         actual,
//         window: windowSize,
//         content
//       }
//       return layout
//     }
//   }
//   function sizeChanged (): void {
//     layout.resize()
//   }
//   function getActiveContent (): RouterState {
//     return router.$get() as any
//   }
//   function runAtActivePage<DATA extends Object, ARG> (a: ActionDef<DATA, ARG>, arg: ARG): Promise<void> {
//     const [content] = getActiveContent().tabs
//     return content && runAt(content, a, arg)
//   }
//   function runAt<DATA extends Object, ARG> (content: ContentItemDef<DATA, any>, a: ActionDef<DATA, ARG>, arg: ARG): Promise<void> {
//     const defer: {
//       resolve: () => void,
//       reject: (err: Error) => void
//       promise: Promise<void>
//     } = {

//     } as any
//     defer.promise = new Promise<void>((resolve, reject) => {
//       defer.resolve = resolve
//       defer.reject = reject
//     })
//     const job: JobDef<DATA, ARG> = {
//       description: a.label,
//       data: content.data,
//       action: a,
//       arg,
//       defer
//     }
//     jobs.handle(job)
//     return defer.promise
//   }
//   function getContent<DATA extends Object, PARAMS extends object> (id: string, group: string, page: PageDef<DATA, PARAMS>, params: PARAMS): ContentItemDef<DATA, PARAMS> {
//     const cached = cache[id]
//     if (cached) {
//       return cached as any
//     }
//     const initialView = page.view(params, undefined)
//     let unscribe = page.subscribe(id, (data) => {
//       update(data as DATA)
//     })
//     const content: ContentItemDef<DATA, PARAMS> = {
//       id,
//       page,
//       history: [],
//       title: {
//         page: page.title(undefined),
//         view: initialView.title(undefined)
//       },
//       group,
//       params,
//       data: undefined,
//       view: initialView,
//       actions: initialView.actions.filter(a => can(a.requires)),
//       ping: Date.now(),
//       changeGroup,
//       release,
//       destroy
//     }
//     setTimeout(() => {
//       router.$set((old) => {
//         return { tabs: [content, ...old.tabs] }
//       })
//     }, 1)

//     return content
//     function update (data: DATA | undefined) {
//       router.$set((old) => {
//         let changed = false
//         const newItems = old.tabs.map((item) => {
//           if (item.page === page) {
//             if (deepCompare(item.data, data, true) !== 0) {
//               changed = true
//               const view = page.view(params, data)
//               const newItem = {
//                 ...item,
//                 data,
//                 view: view,
//                 title: {
//                   page: page.title(undefined),
//                   view: initialView.title(undefined)
//                 },
//                 actions: view.actions.filter(a => can(a.requires))
//               }
//               newItem.data = data
//               return newItem
//             }
//           }
//           return item
//         })
//         return changed ? { tabs: newItems } : old
//       })
//     }
//     function changeGroup (ngroup: string) {
//       router.$set((old) => {
//         const newItems = old.tabs.map((item) => {
//           if (item.page === page) {
//             return {
//               ...item,
//               group: ngroup
//             }
//           }
//           return item
//         })
//         return { tabs: newItems }
//       })
//     }
//     function release () {
//       router.$set((old) => {
//         const newItems = old.tabs.map((item) => {
//           if (item.page === page) {
//             return {
//               ...item,
//               ping: 0
//             }
//           }
//           return item
//         })
//         return { tabs: newItems }
//       })
//     }
//     function destroy () {
//       delete cache[id]
//       const unscribeIt = unscribe;
//       (unscribe as any) = undefined
//       setTimeout(unscribeIt, 1)
//       router.$set((old) => {
//         const newItems = old.tabs.filter((item) => item.id !== id)
//         return { tabs: newItems }
//       })
//     }
//   }

//   function getRouteFromUrl<DATA extends Object, PARAMS extends object> (): { page: PageDef<DATA, PARAMS>, params: PARAMS } {
//     const url = getUrl()

//     let page: PageDef<any, any> | undefined
//     let params: any = {}
//     for (let i = 0; (!page) && i < parsedRoutes.length; i++) {
//       const r = parsedRoutes[i]
//       const rg = new RegExp(r.$url, 'g')
//       const m = rg.exec(url)
//       if (m) {
//         page = r.page
//         params = r.params as any || {}
//         r.$params.forEach((pn, idx) => {
//           params[pn] = m[idx]
//         })
//       }
//     }

//     if (!page) {
//       page = notFound
//       params = { url }
//     }
//     const requireRoles: RolesRequired = page.requires
//     if (!can(requireRoles)) {
//       params = { page, roles: requireRoles }
//       page = forbidden
//     }
//     return { page, params }
//   }

