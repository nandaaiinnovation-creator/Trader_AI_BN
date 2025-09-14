import React, {useEffect, useState} from 'react'
import { io } from 'socket.io-client'

export default function Dashboard(){
  const [connected, setConnected] = useState(false)
  const [events, setEvents] = useState([])

  useEffect(()=>{
    const socket = io(undefined, { path: '/socket.io' })
    socket.on('connect', ()=> setConnected(true))
    socket.on('disconnect', ()=> setConnected(false))
    socket.on('signal', (data)=>{
      setEvents(e=>[data, ...e].slice(0,50))
    })
    return ()=> socket.disconnect()
  },[])

  return (
    <div>
      <p>Socket: {connected ? 'connected' : 'disconnected'}</p>
      <section>
        <h2>Recent signals</h2>
        <ul>
          {events.map((ev, i)=> <li key={i}>{JSON.stringify(ev)}</li>)}
        </ul>
      </section>
    </div>
  )
}
