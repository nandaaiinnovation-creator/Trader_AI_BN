import React, { useEffect, useRef, useState } from 'react'
import { createChart } from 'lightweight-charts'
import '../styles/chart.css'
import ChartOverlay from './ChartOverlay'

export default function ChartPanel({ signals }) {
  const ref = useRef(null)
  const chartRef = useRef(null)
  const rafRef = useRef(null)
  const resizeObserverRef = useRef(null)
  // dataRef now holds an array of series: [{ label, color, points: [...] }]
  const dataRef = useRef([])
  const [legendItems, setLegendItems] = useState([{ label: 'Series 1', value: '—', color: '#2b8bd1' }])
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

  // prepare container for multiple series; we'll add series objects later
  chartRef.current = { chart, series: {} }

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
    // compute series now and store immediately so pointer handlers can use them
    const slice = (signals || []).slice(0, 1000)

    // Group points by symbol when available, otherwise fallback to a single series
    const grouped = {}
    if (slice.length && slice[0].symbol) {
      slice.forEach(s => {
        const key = s.symbol || 'Series 1'
        if (!grouped[key]) grouped[key] = []
        grouped[key].push({ time: Math.floor(new Date(s.timestamp).getTime() / 1000), value: Number(s.score || 0), raw: s })
      })
    } else {
      grouped['Series 1'] = slice.map(s => ({ time: Math.floor(new Date(s.timestamp).getTime() / 1000), value: Number(s.score || 0), raw: s }))
    }

    // Prepare a small color palette and ensure deterministic assignment per label
    const palette = ['#2b8bd1', '#f59e0b', '#10b981', '#ef4444', '#7c3aed']
    const labels = Object.keys(grouped)
    const seriesData = labels.map((label, idx) => ({ label, color: palette[idx % palette.length], points: grouped[label].slice().reverse() }))
    dataRef.current = seriesData

    // update legend items synchronously so tests and keyboard focus can read them
    try {
      const syncItems = seriesData.map(s => ({ label: s.label, value: s.points && s.points.length ? s.points[s.points.length-1].value.toFixed(2) : '—', color: s.color }))
      setLegendItems(syncItems)
    } catch (e) {}

    rafRef.current = requestAnimationFrame(() => {
      // ensure we have created a series object for every label
      labels.forEach((label, idx) => {
        const existing = (r.series && r.series[label])
        if (!existing) {
          try {
            const s = r.chart.addLineSeries({ color: seriesData[idx].color, lineWidth: 2 })
            r.series = r.series || {}
            r.series[label] = { series: s, color: seriesData[idx].color }
          } catch (e) { /* ignore creation error in tests */ }
        }
      })

      // set data and markers per series
      labels.forEach((label, idx) => {
        try {
          const pts = seriesData[idx].points
          if (r.series && r.series[label] && r.series[label].series && pts) {
            r.series[label].series.setData(pts)
            // markers for this series (limited)
            const markers = (slice || [])
              .filter(s => s.signal && s.symbol === label)
              .slice(0, 50)
              .map(s => ({
                time: Math.floor(new Date(s.timestamp).getTime() / 1000),
                position: 'below',
                color: s.signal === 'BUY' ? '#2e7d32' : '#c62828',
                shape: 'arrowUp',
                text: `${s.symbol} ${s.signal}`,
              }))
            try { r.series[label].series.setMarkers(markers) } catch (e) {}
          }
        } catch (e) { /* ignore per-series errors */ }
      })

      // Do not update legend state here; we already set sync values above. Keep RAF for chart operations only.
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
      const seriesArr = dataRef.current || []
      if (!seriesArr.length) return
      const rect = node.getBoundingClientRect()
      const x = e.clientX - rect.left
      // compute an index per series by proportional x
      const items = seriesArr.map(s => {
        const len = s.points.length || 1
        const proportional = x / rect.width
        const idx = Math.max(0, Math.min(len - 1, Math.floor(proportional * len)))
        const v = s.points[idx]
        return { label: s.label, value: v ? v.value.toFixed(2) : '—', color: s.color }
      })

      if (tooltipRef.current){
        tooltipRef.current.style.display = 'block'
        tooltipRef.current.style.left = Math.max(4, Math.min(rect.width - 10, x)) + 'px'
        tooltipRef.current.style.top = '8px'
        // show time from the first series as a reference
        const first = seriesArr[0] && seriesArr[0].points[0]
        if (first) tooltipRef.current.textContent = `${new Date(first.time*1000).toLocaleTimeString()} — ${items[0].value}`
        tooltipRef.current.setAttribute('aria-hidden', 'false')
      }
      // update legend multi-series structure via state so overlay re-renders
      try {
        setLegendItems(items)
        if (legendRef.current) {
          // keep textual backup
          legendRef.current.textContent = items.map(i => `${i.label}: ${i.value}`).join(' | ')
        }
      } catch (e) {}
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
      const seriesArr = dataRef.current || []
      if (!seriesArr.length) return
      // show last point for each series
      const items = seriesArr.map(s => ({ label: s.label, value: s.points && s.points.length ? s.points[s.points.length-1].value.toFixed(2) : '—', color: s.color }))
      if (tooltipRef.current){
        tooltipRef.current.style.display = 'block'
        tooltipRef.current.style.left = '50%'
        tooltipRef.current.style.top = '8px'
        tooltipRef.current.textContent = items.length ? `${items[0].label}: ${items[0].value}` : ''
        tooltipRef.current.setAttribute('aria-hidden', 'false')
      }
      try { setLegendItems(items) } catch (e) {}
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

  // legendItems state drives the overlay rendering (multi-series aware)
  return (
    <div className="chart-panel">
      <div ref={ref} className="chart-area" />
      <ChartOverlay legendItems={legendItems} currentValue={legendItems && legendItems[0] ? legendItems[0].value : '—'} tooltipId={'chart-tooltip'} tooltipRef={tooltipRef} legendRef={legendRef} />
    </div>
  )
}
