import { sleep } from 'pjobs'
import { Anonymous, AuthAccount, createLAuth } from './lauth'

interface MyAuthState extends AuthAccount {
    user?: string,
    email?: string
}

describe('lauth sample', () => {
  it('should start as anonymous', async () => {
    const { authState } = createTestAuthentication()
    expect(authState.$.get()).toBe(Anonymous)
  })
  it('should support password authentication', async () => {
    const { authState } = createTestAuthentication()
    authState.loginWithPassword('admin', '123')
    await sleep(10)
    expect(authState.$.get()).toEqual({
      user: 'admin',
      token: 'valid-password',
      roles: ['sample-password']
    })
    authState.logout()
    await sleep(10)
    expect(authState.$.get()).toBe(Anonymous)
  })
  it('should support async email authentication', async () => {
    const { authState, confirmationCode } = createTestAuthentication()
    const emailHandler = authState.asyncLoginWithEmail('any@email')
    await sleep(10)
    expect(authState.$.get()).toBe(Anonymous)
    emailHandler.confirmEmailCode(confirmationCode())
    await sleep(10)
    expect(authState.$.get()).toEqual({
      email: 'any@email',
      token: 'valid-email',
      roles: ['sample-email']
    })
    authState.logout()
    await sleep(10)
    expect(authState.$.get()).toBe(Anonymous)
  })
})

function createTestAuthentication () {
  let confirmationCode: number = 0
  const authState = createLAuth({
    initial: Anonymous as MyAuthState,
    reducers: (setter) => ({
      loginWithPassword (user: string, pwd: string) {
        setter({
          user,
          token: 'valid-password',
          roles: ['sample-password']
        })
      },
      asyncLoginWithEmail (email: string) {
        confirmationCode = Math.round(Math.random() * 1000000)
        return {
          confirmEmailCode (code: number) {
            if (code === confirmationCode) {
              setter((state) => ({
                ...state,
                email,
                token: 'valid-email',
                roles: ['sample-email']
              }))
            }
          }
        }
      },
      logout () {
        setter(() => Anonymous)
      }
    })
  })
  return {
    authState,
    confirmationCode () {
      return confirmationCode
    }
  }
}
