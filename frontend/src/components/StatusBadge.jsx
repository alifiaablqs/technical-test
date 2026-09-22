import React from 'react'

export function StatusBadge({ status }) {
  const normalized = (status || 'TO DO').toUpperCase().replace(/\s+/g, '-')
  const classMap = {
    'TO-DO': 'todo',
    'IN-PROGRESS': 'in-progress',
    'DONE': 'done',
    'CANCELLED': 'cancelled',
  }

  const badgeClass = classMap[normalized] || 'todo'

  return (
    <span className={`status-badge ${badgeClass}`}>
      <span className="status-dot" />
      {status || 'TO DO'}
    </span>
  )
}
