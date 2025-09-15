import React, { useEffect, useRef } from 'react'
import { createChart } from 'lightweight-charts'
import '../styles/chart.css'
import ChartOverlay from './ChartOverlay'

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
      const p = findNearestPoint(x, rect)
      if (!p) return
      if (tooltipRef.current){
        tooltipRef.current.style.display = 'block'
        tooltipRef.current.style.left = Math.max(4, Math.min(rect.width - 10, x)) + 'px'
        tooltipRef.current.style.top = '8px'
        tooltipRef.current.textContent = `${new Date(p.time*1000).toLocaleTimeString()} — ${p.value.toFixed(2)}`
        tooltipRef.current.setAttribute('aria-hidden', 'false')
      }
      // update legend possible multi-series structure
      if (legendRef.current){
        // simple single-series support for now
        legendRef.current.textContent = `Current: ${p.value.toFixed(2)}`
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

  // keyboard accessibility: focus the chart area to show tooltip for the last point
  useEffect(()=>{
    const node = ref.current
    if (!node) return
    function onFocus(){
      const pts = dataRef.current || []
      if (!pts.length) return
      const p = pts[pts.length -1]
      if (!p) return
      if (tooltipRef.current){
        tooltipRef.current.style.display = 'block'
        tooltipRef.current.style.left = '50%'
        tooltipRef.current.style.top = '8px'
        tooltipRef.current.textContent = `${new Date(p.time*1000).toLocaleTimeString()} — ${p.value.toFixed(2)}`
        tooltipRef.current.setAttribute('aria-hidden', 'false')
      }
    }
    function onBlur(){
      if (tooltipRef.current){
        tooltipRef.current.style.display = 'none'
        tooltipRef.current.setAttribute('aria-hidden', 'true')
      }
    }
    node.setAttribute('tabindex', '0')
    node.addEventListener('focus', onFocus)
    node.addEventListener('blur', onBlur)
    return ()=>{
      node.removeEventListener('focus', onFocus)
      node.removeEventListener('blur', onBlur)
      node.removeAttribute('tabindex')
    }
  }, [])

  // helper: find nearest point to an X coordinate
  function findNearestPoint(x, rect){
    const pts = dataRef.current || []
    if (!pts.length) return null
    // compute index by proportional position, then scan +/- a small window for nearest time
    const proportional = x / rect.width
    let idx = Math.max(0, Math.min(pts.length - 1, Math.floor(proportional * pts.length)))
    // scan +/- 3 indices for nearest by pixel distance
    let best = pts[idx]
    let bestDist = Math.abs(idx - proportional * pts.length)
    for (let delta = -3; delta <= 3; delta++){
      const j = idx + delta
      if (j < 0 || j >= pts.length) continue
      const d = Math.abs(j - proportional * pts.length)
      if (d < bestDist){ bestDist = d; best = pts[j] }
    }
    return best
  }

  // prepare multi-series legend items (single series now)
  const legendItems = [{ label: 'Series 1', value: dataRef.current && dataRef.current.length ? dataRef.current[dataRef.current.length-1].value.toFixed(2) : '—' }]

  return (
    <div className="chart-panel">
      <div ref={ref} className="chart-area" />
      <ChartOverlay legendItems={legendItems} currentValue={legendItems[0].value} tooltipId={'chart-tooltip'} tooltipRef={tooltipRef} legendRef={legendRef} />
    </div>
  )
}
