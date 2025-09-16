module.exports = {
  io: function(){
    // minimal event emitter shape used by RulesPanel
    const handlers = {}
    return {
      on: (ev, cb)=> { handlers[ev] = cb },
      emit: (ev, ...args)=> { if (typeof handlers[ev] === 'function') handlers[ev](...args) },
      disconnect: ()=>{},
    }
  }
}
