import React, { useState } from 'react'
import { StatusBadge } from './StatusBadge'
import { useRole, ROLES } from '../context/RoleContext'

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
    })
  } catch {
    return isoString
  }
}

export function OrderList({
  orders = [],
  loading,
  error,
  selectedOrderId,
  onSelectOrder,
  onRefresh,
}) {
  const { currentRole } = useRole()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === 'ALL' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Title & description adapted to active role
  const getPanelTitle = () => {
    if (currentRole === ROLES.CLIENT) return 'Daftar Order Permohonan Pekerjaan'
    if (currentRole === ROLES.TECHNICIAN) return 'Daftar Penugasan Pekerjaan Lapangan'
    return 'Daftar Seluruh Order Operasional'
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="panel-title">{getPanelTitle()}</span>
          <span style={{ fontSize: '11px', backgroundColor: '#E2E8F0', padding: '2px 8px', borderRadius: '12px', fontWeight: 600, color: '#475569' }}>
            {filteredOrders.length}
          </span>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={onRefresh} title="Refresh Data">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{ padding: '12px 16px', backgroundColor: '#FAFAFA', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input
          type="text"
          className="form-control"
          style={{ maxWidth: '280px' }}
          placeholder="Cari Order Number / Deskripsi..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          className="form-control"
          style={{ width: '160px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">Semua Status</option>
          <option value="TO DO">TO DO</option>
          <option value="IN PROGRESS">IN PROGRESS</option>
          <option value="DONE">DONE</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {/* Table Content */}
      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p style={{ marginTop: '12px' }}>Memuat data order...</p>
          </div>
        ) : error ? (
          <div className="loading-state">
            <p style={{ color: '#DC2626', fontWeight: 600 }}>Gagal memuat data order</p>
            <p style={{ fontSize: '12.5px', color: '#64748B', marginTop: '4px' }}>{error}</p>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: '12px' }} onClick={onRefresh}>
              Coba Lagi
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" style={{ marginBottom: '8px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p style={{ fontWeight: 600, color: 'var(--color-text-sub)' }}>Belum ada order.</p>
            <p style={{ fontSize: '12.5px', marginTop: '2px' }}>
              {searchTerm || statusFilter !== 'ALL'
                ? 'Tidak ada order yang cocok dengan filter pencarian.'
                : 'Silakan buat order pekerjaan baru.'}
            </p>
          </div>
        ) : (
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Deskripsi Pekerjaan</th>
                <th>Status</th>
                <th>Version</th>
                <th>Waktu Diperbarui</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const isSelected = selectedOrderId === order.id

                return (
                  <tr
                    key={order.id}
                    className={isSelected ? 'selected' : ''}
                    onClick={() => onSelectOrder(order.id)}
                  >
                    <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                      {order.order_number}
                    </td>
                    <td style={{ maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {order.description}
                    </td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td style={{ fontWeight: 500, color: '#64748B' }}>
                      v{order.version}
                    </td>
                    <td style={{ fontSize: '12.5px', color: '#64748B' }}>
                      {formatDate(order.updated_at)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectOrder(order.id)
                        }}
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
