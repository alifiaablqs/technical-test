import React from 'react'
import { StatusBadge } from './StatusBadge'

export function Overview({ orders = [] }) {
  const counts = {
    total: orders.length,
    todo: orders.filter((o) => o.status === 'TO DO').length,
    inProgress: orders.filter((o) => o.status === 'IN PROGRESS').length,
    done: orders.filter((o) => o.status === 'DONE').length,
    cancelled: orders.filter((o) => o.status === 'CANCELLED').length,
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
      <div className="panel" style={{ padding: '20px' }}>
        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
          Total Order Pekerjaan
        </div>
        <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-primary)', marginTop: '4px' }}>
          {counts.total}
        </div>
      </div>

      <div className="panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Menunggu</span>
          <StatusBadge status="TO DO" />
        </div>
        <div style={{ fontSize: '28px', fontWeight: 800, color: '#475569', marginTop: '4px' }}>
          {counts.todo}
        </div>
      </div>

      <div className="panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Berjalan</span>
          <StatusBadge status="IN PROGRESS" />
        </div>
        <div style={{ fontSize: '28px', fontWeight: 800, color: '#0284C7', marginTop: '4px' }}>
          {counts.inProgress}
        </div>
      </div>

      <div className="panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Selesai</span>
          <StatusBadge status="DONE" />
        </div>
        <div style={{ fontSize: '28px', fontWeight: 800, color: '#16A34A', marginTop: '4px' }}>
          {counts.done}
        </div>
      </div>

      <div className="panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Dibatalkan</span>
          <StatusBadge status="CANCELLED" />
        </div>
        <div style={{ fontSize: '28px', fontWeight: 800, color: '#DC2626', marginTop: '4px' }}>
          {counts.cancelled}
        </div>
      </div>
    </div>
  )
}
