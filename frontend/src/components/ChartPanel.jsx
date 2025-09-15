import React, { useEffect, useRef } from 'react'
import { createChart } from 'lightweight-charts'

export default function ChartPanel({ signals }) {
  const ref = useRef(null)
  const chartRef = useRef(null)
  const rafRef = useRef(null)
  const resizeObserverRef = useRef(null)

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
    const r = chartRef.current
    if (!r) return

    // Batch frequent updates with requestAnimationFrame to avoid thrashing
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      // signals are newest-first; convert to ascending time for the chart
      const slice = (signals || []).slice(0, 1000)
      const points = slice.slice().reverse().map((s) => ({
        time: Math.floor(new Date(s.timestamp).getTime() / 1000),
        value: Number(s.score || 0),
      }))
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

      // Update current value overlay (small DOM overlay)
      if (r.chart) {
        try {
          const last = points[points.length - 1]
          const el = ref.current && ref.current.parentElement && ref.current.parentElement.querySelector('.chart-current-value')
          if (el && last) el.textContent = `Current: ${last.value.toFixed(2)}`
        } catch (e) {}
      }
    })

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [signals])

  return (
    <div style={{ width: '100%', height: 360 }}>
      <div ref={ref} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
