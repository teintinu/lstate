/**
 * @jest-environment jsdom
 */

import React from "react"
import { render } from "../test-utils/render"
import { createView, ViewDef } from "./lview"

describe('lview sample', () => {
    let log: string[] = []
    let view: ViewDef<SampleState>
    interface SampleState {
        title: string
        source: string
    }
    beforeEach(() => {
        log=[]
        view = createView<SampleState>({
            title(state) {
                return 'view ' + (state?.title || '-')
            },
            component: ViewComponent,
            actions: {
                copy: {
                    description(state) {
                        return 'sample action to copy ' + (state?.title || '-')
                    },
                    kind: 'primary',
                    label: 'Copy',
                    requires: 'auth',
                    reducer(state) {
                        log.push('copy ' + (state?.title || '-'))
                        return { state }
                    },
                    enabled(state) {
                        return !!state
                    },
                },
                print: {
                    description(state) {
                        return 'sample action to print ' + (state?.title || '-')
                    },
                    kind: 'secondary',
                    label: 'Print',
                    requires: ['admin'],
                    enabled(state) {
                        return !!state
                    },
                    visible(state) {
                        return !!state
                    },
                    reducer(state) {
                        log.push('print ' + (state?.title || '-'))
                        return { state }
                    },
                },
            },
            onBack: () => false,
        })
        function ViewComponent({ state }: { state?: SampleState }) {
            return state ? <div>
                <div>{state.title || '-'}</div>
                <pre>{state?.source || ''}</pre>
            </div> : <span>loading</span>
        }
    })
    it('should initialize view when state is undefined', async () => {
        expect(view).toBeDefined()
        expect(view.title(undefined)).toBe('view -')
        const renderer=render(()=><view.component state={undefined} />)
        renderer.expectText('span','loading')
        expect(view.onBack()).toBeFalsy()
        expect(view.actions.length).toBe(2)
        const copyAction = view.actions.find(({ name }) => name === 'copy')
        if (copyAction) {
            expect(copyAction.kind).toBe('primary')
            expect(copyAction.requires).toBe('auth')
            expect(copyAction.description(undefined, undefined))
                .toBe('sample action to copy -')
            expect(copyAction.visible(undefined)).toBeTruthy()
            expect(copyAction.enabled(undefined)).toBeFalsy()
            expect(copyAction.reducer(undefined, undefined)).toEqual({state: undefined})
            expect(log).toEqual(['copy -'])
        } else {
            expect(copyAction).toBeDefined()
        }
        const printAction = view.actions.find(({ name }) => name === 'print')
        if (printAction) {
            expect(printAction.kind).toBe('secondary')
            expect(printAction.requires).toEqual(['admin'])
            expect(printAction.description(undefined, undefined))
                .toBe('sample action to print -')
            expect(printAction.visible(undefined)).toBeFalsy()
            expect(printAction.enabled(undefined)).toBeFalsy()
            expect(printAction.reducer(undefined, undefined)).toEqual({state: undefined})
            expect(log).toEqual(["copy -",'print -'])
        } else {
            expect(printAction).toBeDefined()
        }
    })
})
