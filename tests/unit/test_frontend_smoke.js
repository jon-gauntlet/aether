import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../../frontend/src/App.vue'

describe('Frontend Smoke Tests', () => {
  it('App component can be mounted', () => {
    const wrapper = mount(App)
    expect(wrapper.exists()).toBe(true)
  })

  it('App has a root element', () => {
    const wrapper = mount(App)
    expect(wrapper.element.tagName).toBeDefined()
  })
}) 