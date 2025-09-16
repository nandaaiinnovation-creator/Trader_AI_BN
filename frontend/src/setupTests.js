// Setup test environment polyfills and helpers
/* global */
// minimal ResizeObserver mock
class ResizeObserverMock {
  constructor(cb){ this.cb = cb }
  observe(){}
  unobserve(){}
  disconnect(){}
}

global.ResizeObserver = global.ResizeObserver || ResizeObserverMock

// minimal matchMedia
global.matchMedia = global.matchMedia || function(){
  return { matches: false, addListener: ()=>{}, removeListener: ()=>{} }
}

// fetch polyfill: default to returning empty data
global.fetch = global.fetch || (async ()=> ({ ok: true, json: async ()=>[] }))

// setImmediate polyfill for environments that lack it
global.setImmediate = global.setImmediate || function(fn, ...args){ return setTimeout(fn, 0, ...args) }

// jest-dom matchers
try{ require('@testing-library/jest-dom/extend-expect') } catch(e) { /* optional */ }
