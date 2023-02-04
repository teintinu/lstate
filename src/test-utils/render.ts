import React from 'react'
import { create } from 'react-test-renderer'

export function render (el: ()=>React.ReactElement) {
  const renderer = create(el())
  const instance = renderer.root
  return {
    expectText (query: string, text: string): void {
      const el = instance.findByType(query as React.ElementType<any>)
      if (!el) expect(query).toBe('QUERY NOT FOUND')
      expect(el.children.join('')).toBe(text)
    }
  }
}
