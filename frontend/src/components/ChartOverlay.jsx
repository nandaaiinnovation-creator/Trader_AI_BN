import React from 'react'
import styles from '../styles/chartOverlay.module.css'

export default function ChartOverlay({ legendItems = [], currentValue = '—', tooltip = {}, tooltipId = 'chart-tooltip', tooltipRef = null, legendRef = null }){
  return (
    <div className={styles.overlay}>
      <div className={styles.legend} role="status" aria-live="polite" ref={legendRef}>
        {legendItems.map((it, i)=> (
          <div key={i} className={styles.legendItem}>
            <span className={styles.legendLabel}>{it.label}</span>
            <span className={styles.legendValue}>{it.value}</span>
          </div>
        ))}
        <div className={styles.current} aria-hidden="true">{`Current: ${currentValue}`}</div>
      </div>
      <div id={tooltipId} role="tooltip" aria-hidden={tooltip.visible ? 'false' : 'true'} className={styles.tooltip} style={{ left: tooltip.left, top: tooltip.top }} ref={tooltipRef}>
        {tooltip.text}
      </div>
    </div>
  )
}
