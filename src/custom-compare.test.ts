import { createGlobalState, GlobalState } from "./lstate";
import { defer, sleep } from 'pjobs'

describe('lstate subscription tests', () => {
    let sample: GlobalState<{count: number}> & { inc(count: number): void, setSame(): void};
    beforeEach(() => {
        sample = createGlobalState({
            initial: {count: 1},
            compare: (a, b) => a.count === b.count,
            reducers: (setter) => ({
                setSame() {
                    setter((old) => old)
                },
                inc(v) {
                    setter((old) => ({count: old.count + v}))
                },
            })
        })
    });
    afterEach(() => {
        sample.$.destroy()
    });
    it('should support initial value', () => {
        expect(sample.$.get()).toEqual({count: 1})
    });
    it('should subscribe to changes', async() => {
        const d=defer<void>()
        sample.$.subscribe((v) => {
            expect(v).toEqual({count: 2})
            d.resolve()
        })
        sample.inc(1)
        return d.promise
    });
    it('should not fire change event when set to the same value', async() => {
        sample.$.subscribe((v) => {
            fail('should not be called')
        })
        sample.setSame()
        sample.inc(0)
        expect(sample.$.get()).toEqual({count: 1})
    });
    it('should support unsubscribe subscriptions', async() => {
        const unscribe = sample.$.subscribe((v) => {
            fail('should not be called')
        })
        unscribe()
        sample.inc(1)
        expect(sample.$.get()).toEqual({count: 2})
    });
})