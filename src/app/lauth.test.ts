import { Anonymous, AuthAccount, createLAuth } from "./lauth"

interface MyAuthState extends AuthAccount {
    user?: string,
    email?: string
}

describe('lrouter sample', () => {
    it('should start as anonymous', async () => {
        const { authState } = createTestAuthentication()
        expect(authState.$get()).toBe(Anonymous)
    })
    it('should support password authentication', async () => {
        const { authState } = createTestAuthentication()
        authState.loginWithPassword('admin', '123')
        expect(authState.$get()).toEqual({
            user: 'admin',
            token: 'valid-password',
            roles: ['sample-password']
        })
        authState.logout()
        expect(authState.$get()).toBe(Anonymous)
    })
    it('should support async email authentication', async () => {
        const { authState, confirmationCode } = createTestAuthentication()
        const emailHandler = authState.asyncLoginWithEmail('any@email')
        expect(authState.$get()).toBe(Anonymous)
        emailHandler.confirmEmailCode(confirmationCode())
        expect(authState.$get()).toEqual({
            email: 'any@email',
            token: 'valid-email',
            roles: ['sample-email']
        })
        authState.logout()
        expect(authState.$get()).toBe(Anonymous)
    })
})

function createTestAuthentication() {
    let confirmationCode: number = 0
    const authState = createLAuth({
        initial: Anonymous as MyAuthState,
        actions: ((setter) => ({
            loginWithPassword(user: string, pwd: string) {
                setter((state) => ({
                    ...state,
                    user,
                    token: 'valid-password',
                    roles: ['sample-password']
                }))
            },
            asyncLoginWithEmail(email: string) {
                confirmationCode = Math.round(Math.random() * 1000000)
                return {
                    confirmEmailCode(code: number) {
                        if (code === confirmationCode)
                            setter((state) => ({
                                ...state,
                                email,
                                token: 'valid-email',
                                roles: ['sample-email']
                            }))

                    }
                }
            },
            logout() {
                setter(()=>Anonymous)
            }
        })),
    });
    return {
        authState,
        confirmationCode() {
            return confirmationCode
        }
    }
}