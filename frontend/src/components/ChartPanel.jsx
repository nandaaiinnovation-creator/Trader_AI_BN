import React, {useEffect, useRef} from 'react'
import { createChart } from 'lightweight-charts'

export default function ChartPanel({ signals }){
  const ref = useRef(null)
  const chartRef = useRef(null)

  useEffect(()=>{
    const node = ref.current
    if (!node) return
    const chart = createChart(node, { width: node.clientWidth, height: 300 })
    const line = chart.addLineSeries()
    chartRef.current = { chart, line }
    return ()=> chart.remove()
  },[])

  useEffect(()=>{
    const r = chartRef.current
    if (!r) return
    // Convert signals into a simple time series for demo purposes
    const points = signals.slice().reverse().map((s, i)=>({ time: Math.floor(new Date(s.timestamp).getTime()/1000), value: Number(s.score || 0) }))
    r.line.setData(points)
  },[signals])

  return (
    <div>
      <div ref={ref} style={{width: '100%', height: 300}} />
    </div>
  )
}
