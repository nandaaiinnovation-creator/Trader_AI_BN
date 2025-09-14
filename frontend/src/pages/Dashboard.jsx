import React, {useEffect, useState, useRef} from 'react'
import { io } from 'socket.io-client'
import ChartPanel from '../components/ChartPanel'
import RulesPanel from '../components/RulesPanel'

export default function Dashboard(){
  const [connected, setConnected] = useState(false)
  const [events, setEvents] = useState([])
  const socketRef = useRef(null)

  useEffect(()=>{
    let mounted = true
    // Initial load: fetch recent signals
    fetch('/api/signals?limit=50')
      .then(r=>r.json())
      .then((json)=>{
        if (!mounted) return
        setEvents(json.data || [])
      })
      .catch(()=>{})

    const socket = io(undefined, { path: '/socket.io' })
    socketRef.current = socket
    socket.on('connect', ()=> setConnected(true))
    socket.on('disconnect', ()=> setConnected(false))
    socket.on('signal', (data)=>{
      setEvents(e=>[data, ...e].slice(0,200))
    })

    return ()=>{
      mounted = false
      socket.disconnect()
    }
  },[])

  return (
    <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap: 12}}>
      <div>
        <header style={{display:'flex', justifyContent:'space-between'}}>
          <h2>Signal feed</h2>
          <div>Socket: {connected ? 'connected' : 'disconnected'}</div>
        </header>
        <ChartPanel signals={events} />
        <section style={{marginTop:12}}>
          <h3>Recent signals</h3>
          <ul>
            {events.map((ev, i)=> <li key={i}>{ev.symbol} {ev.signal} @{new Date(ev.timestamp).toLocaleTimeString()} [{ev.rule_name}]</li>)}
          </ul>
        </section>
      </div>
      <aside>
        <RulesPanel />
      </aside>
    </div>
  )
}
