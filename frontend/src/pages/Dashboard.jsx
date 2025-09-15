import React, {useEffect, useState, useRef} from 'react'
import { io } from 'socket.io-client'
import ChartPanel from '../components/ChartPanel'
import RulesPanel from '../components/RulesPanel'
import '../styles/dashboard.css'

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
    <div className="bn-dashboard">
      <div>
        <header className="bn-header">
          <h2 style={{margin:0}}>Signal feed</h2>
          <div style={{fontSize:12, color: connected ? '#2e7d32' : '#c62828'}}>Socket: {connected ? 'connected' : 'disconnected'}</div>
        </header>
        <div className="bn-card" style={{marginTop:12, position:'relative'}}>
          <div className="chart-current-value">Current: —</div>
          <ChartPanel signals={events} />
        </div>

        <section style={{marginTop:12}} className="bn-card">
          <h3 style={{marginTop:0}}>Recent signals</h3>
          <ul className="bn-recent-list">
            {events.map((ev, i)=> <li key={i}>{ev.symbol} <strong style={{marginLeft:6}}>{ev.signal}</strong> <span style={{color:'#666', marginLeft:8}}>@{new Date(ev.timestamp).toLocaleTimeString()}</span> <em style={{float:'right', color:'#999'}}>{ev.rule_name}</em></li>)}
          </ul>
        </section>
      </div>
      <aside className="bn-aside">
        <div className="bn-card"><RulesPanel /></div>
      </aside>
    </div>
  )
}
