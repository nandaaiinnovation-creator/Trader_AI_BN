import React, { useEffect, useRef } from 'react'
import { createChart } from 'lightweight-charts'

export default function ChartPanel({ signals }) {
  const ref = useRef(null)
  const chartRef = useRef(null)
  const rafRef = useRef(null)
  const resizeObserverRef = useRef(null)
  const dataRef = useRef([])
  const tooltipRef = useRef(null)
  const legendRef = useRef(null)

  useEffect(() => {
  const node = ref.current
    if (!node) return

    // create chart with a sensible default theme/options
    const chart = createChart(node, {
      width: node.clientWidth,
      height: node.clientHeight || 320,
      layout: { background: { color: '#fff' }, textColor: '#222' },
      rightPriceScale: { visible: true },
      timeScale: { timeVisible: true, secondsVisible: false },
      grid: { vertLines: { visible: false }, horzLines: { color: '#eee' } },
    })

  const line = chart.addLineSeries({ color: '#2b8bd1', lineWidth: 2 })
    chartRef.current = { chart, line }

    // Resize handling
    const ro = new ResizeObserver(() => {
      const n = ref.current
      if (!n) return
      try { chart.resize(n.clientWidth, n.clientHeight || 320) } catch (e) {}
    })
    ro.observe(node)
    resizeObserverRef.current = ro

    return () => {
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect()
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      chart.remove()
    }
  }, [])

  useEffect(() => {
    // allow the effect to run even if the chart hasn't been created yet (tests)
    const r = chartRef.current || { line: { setData: ()=>{}, setMarkers: ()=>{} }, chart: null }

    // Batch frequent updates with requestAnimationFrame to avoid thrashing
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    // compute points now and store immediately so pointer handlers can use them
    const slice = (signals || []).slice(0, 1000)
    const points = slice.slice().reverse().map((s) => ({
      time: Math.floor(new Date(s.timestamp).getTime() / 1000),
      value: Number(s.score || 0),
    }))
    dataRef.current = points
    rafRef.current = requestAnimationFrame(() => {
      // signals are newest-first; convert to ascending time for the chart
      r.line.setData(points)

      // Add simple markers for notable signals (keep markers small)
      const markers = slice
        .filter(s => s.signal)
        .slice(0, 50)
        .map(s => ({
          time: Math.floor(new Date(s.timestamp).getTime() / 1000),
          position: 'below',
          color: s.signal === 'BUY' ? '#2e7d32' : '#c62828',
          shape: 'arrowUp',
          text: `${s.symbol} ${s.signal}`,
        }))
      try { r.line.setMarkers(markers) } catch (e) { /* ignore marker failures */ }

      // Update legend / current value
      try {
        const last = points[points.length - 1]
        if (legendRef.current && last) legendRef.current.textContent = `Current: ${last.value.toFixed(2)}`
      } catch (e) {}
    })

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [signals])

  // pointer handlers to show a simple tooltip based on stored points
  useEffect(()=>{
    const node = ref.current
    if (!node) return

    function onPointerMove(e){
      const pts = dataRef.current || []
      if (!pts.length) return
      const rect = node.getBoundingClientRect()
      const x = e.clientX - rect.left
      const idx = Math.max(0, Math.min(pts.length - 1, Math.floor((x / rect.width) * pts.length)))
      const p = pts[idx]
      if (!p) return
      if (tooltipRef.current){
        tooltipRef.current.style.display = 'block'
        tooltipRef.current.style.left = Math.max(4, Math.min(rect.width - 10, x)) + 'px'
        tooltipRef.current.style.top = '8px'
        tooltipRef.current.textContent = `${new Date(p.time*1000).toLocaleTimeString()} — ${p.value.toFixed(2)}`
        tooltipRef.current.setAttribute('aria-hidden', 'false')
      }
    }

    function onPointerLeave(){
      if (tooltipRef.current){
        tooltipRef.current.style.display = 'none'
        tooltipRef.current.setAttribute('aria-hidden', 'true')
      }
    }

    node.addEventListener('pointermove', onPointerMove)
    node.addEventListener('mousemove', onPointerMove)
    node.addEventListener('pointerleave', onPointerLeave)
    node.addEventListener('mouseleave', onPointerLeave)
    return ()=>{
      node.removeEventListener('pointermove', onPointerMove)
      node.removeEventListener('mousemove', onPointerMove)
      node.removeEventListener('pointerleave', onPointerLeave)
      node.removeEventListener('mouseleave', onPointerLeave)
    }
  }, [])

  return (
    <div className="chart-panel" style={{ width: '100%', height: 360, position: 'relative' }}>
      <div ref={ref} style={{ width: '100%', height: '100%' }} />
      <div ref={legendRef} role="status" aria-live="polite" className="chart-legend" style={{position:'absolute', right:8, top:8, background:'#fff', padding:'4px 8px', borderRadius:4, boxShadow:'0 1px 3px rgba(0,0,0,0.08)', fontSize:12}}>Current: —</div>
      <div ref={tooltipRef} role="tooltip" aria-hidden="true" className="chart-tooltip" style={{display:'none', position:'absolute', pointerEvents:'none', transform:'translateX(-50%)', background:'#222', color:'#fff', padding:'6px 8px', borderRadius:4, fontSize:12}} />
    </div>
  )
}
