import { createLWindowState, Size, } from "./lwindow"
import { JSDOM } from 'jsdom'
import { createLState } from "../state/lstate"
import { sleep } from "pjobs"

describe('lwindow sample', () => {
    let mocked: ReturnType<typeof mockWindow>
    beforeEach(() => {
        mocked = mockWindow()
    })
    afterEach(() => {
        mocked.ws.location.$destroy()
        mocked.ws.size.$destroy()
        mocked.ws.extra1.$destroy()
    })
    it('should initialize window state correctly', async () => {
        expect(mocked.sizeChanged).not.toBeCalled()
        expect(mocked.locationChanged).not.toBeCalled()
        expect(mocked.log).toEqual([])
        expect(mocked.ws.size.$get()).toEqual({
            width: 1024,
            height: 768
        })
        expect(mocked.ws.location.$get()).toEqual({
            url: '/',
            title: ''
        })
    })
    it('should should handle window resize', async () => {
        expect(mocked.sizeChanged).not.toBeCalled()
        mocked.window.resizeTo(1000, 1000)
        await sleep(100)
        expect(mocked.sizeChanged).toBeCalledTimes(1)
        expect(mocked.locationChanged).not.toBeCalled()
        expect(mocked.log).toEqual([{
            width: 1000,
            height: 1000
        }])
        expect(mocked.ws.size.$get()).toEqual({
            width: 1000,
            height: 1000
        })
        expect(mocked.ws.location.$get()).toEqual({
            url: '/',
            title: ''
        })
    })
    it('should should handle location change', async () => {
        expect(mocked.locationChanged).not.toBeCalled()
        mocked.ws.location.goUrl('/home', false)
        await sleep(100)
        expect(mocked.sizeChanged).not.toBeCalledTimes(1)
        expect(mocked.locationChanged).toBeCalled()
        expect(mocked.log).toEqual([{
            url: '/home',
            title: ''
        }])
        expect(mocked.ws.size.$get()).toEqual({
            width: 1024,
            height: 768
        })
        expect(mocked.ws.location.$get()).toEqual({
            url: '/home',
            title: ''
        })
    })
})

function mockWindow() {
    const log: unknown[] = []
    const sizeChanged = jest.fn((size: Size) => {
        log.push(size)
    });
    const locationChanged = jest.fn((loc: any) => {
        log.push(loc)
    });
    const disconnectExtra = jest.fn(() => {
        log.push('disconnectExtra')
    });
    const { dom, window } = createMockedWindow();
    const ws = createLWindowState(window, 'pushState', () => ({
        extra1: createLState({
            initial: { value: 1 },
            actions() {
                return {}
            },
            disconnect: disconnectExtra
        })
    }));
    ws.size.$subscribe(sizeChanged)
    ws.location.$subscribe(locationChanged)
    return { ws, dom, window, log, sizeChanged, locationChanged }
}

export function createMockedWindow() {
    const dom = new JSDOM('<html><head><title>Mocked Window</title></head><body>sample</body></html>', {
        url: 'http://sample.test'
    })

    const window = dom.window as unknown as Window
    // Simulate window resize event
    const resizeEvent = window.document.createEvent('Event');
    resizeEvent.initEvent('resize', true, true);

    window.resizeTo = (width, height) => {
        (window as any).innerWidth = width || window.innerWidth;
        (window as any).innerHeight = height || window.innerHeight;
        window.dispatchEvent(resizeEvent);
    };
    return { dom, window }
}