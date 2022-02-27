// import { createLApplication } from './lrouter'
// import { createLState } from './lstate'

describe.skip('lrouter sample', () => {
  // const app = createLApplication({
  //   title: 'lrouter sample',
  //   getAuth() {

  //   },
  // })
  // beforeEach(() => {
  //   app.bootup()
  // })
  // beforeEach(() => {
  //   app.shutdown()
  // })
  it('should start in anonymous page when not logged', async () => {})
  it('should start in auth page when logged', async () => {})
})

// function createApp () {
//   const authProvider = createLState({
//     initial: { logged: false },
//     actions: (setter) => ({
//       login () {
//         setter(() => ({ logged: true }))
//       },
//       logout () {
//         setter(() => ({ logged: false }))
//       }
//     })
//   })

//   const app = createLApplication({
//     title: 'Multlab web',
//     authProvider,
//     windowReference,
//     welcome: {
//         unlogged
//         logged,
//     },
//     extensions: {
//       v1: 1,
//       v2: 'v2'
//     },
//     routes: [
//       { path: [], proc: welcome },
//       { path: ['newpage'], proc: newpage },
//       { path: ['cliente', { param: 'id' }], proc: clienteProc },
//       { path: ['4'], proc: clienteProc, params: { id: 'um' } }
//     ],
//     getMenu () {
//       return [
//         { title: 'nav 1', icon: 'user', url: '/', roles: 'public' },
//         '-',
//         {
//           title: 'group',
//           icon: 'alibaba',
//           submenu: [
//             { title: 'nav 2', icon: 'video-camera', url: '/3', roles: 'auth' },
//             { title: 'nav 3', icon: 'upload', url: '/3', roles: 'auth' }
//           ],
//           roles: 'auth'
//         },
//         { title: 'nav 2', icon: 'video-camera', url: '/3', roles: 'anonymous' },
//         { title: 'nav 3', icon: 'upload', url: '/3', roles: ['perm1'] },
//         { title: 'nav 4', icon: 'alert', url: '/4', roles: ['perm2'] }
//       ]
//     }
//   })
//   app.registerBadge({
//     visible: true,
//     title: 'teste1',
//     icon: 'user',
//     onClick () {
//       // tslint:disable-next-line: no-floating-promises
//       app.auth.auth1.signIn({ uid: '1', name: 'nome1' })
//     }
//   })
//   app.registerBadge({
//     visible: true,
//     title: 'teste2',
//     icon: 'upload',
//     onClick () {
//       // tslint:disable-next-line: no-floating-promises
//       app.auth.logout()
//     }
//   })
//   return app
// }
