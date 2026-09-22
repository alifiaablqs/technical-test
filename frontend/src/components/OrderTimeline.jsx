import React from 'react'
import { StatusBadge } from './StatusBadge'

function formatDate(isoString) {
  if (!isoString) return '-'
  try {
    const d = new Date(isoString)
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return isoString
  }
}

export function OrderTimeline({ history = [] }) {
  if (!history || history.length === 0) {
    return (
      <div style={{ padding: '12px 0', color: 'var(--color-text-muted)', fontSize: '13px' }}>
        Belum ada histori transisi status.
      </div>
    )
  }

  return (
    <div className="timeline">
      {history.map((item, index) => {
        const isLatest = index === history.length - 1

        return (
          <div key={item.id || index} className={`timeline-item ${isLatest ? 'latest' : ''}`}>
            <div className="timeline-marker" />
            <div className="timeline-content">
              <div className="timeline-header">
                <StatusBadge status={item.status} />
                <span className="timeline-time">{formatDate(item.created_at)}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
