import React, { useState, useEffect } from 'react'
import { StatusBadge } from './StatusBadge'
import { OrderTimeline } from './OrderTimeline'
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
      second: '2-digit',
    })
  } catch {
    return isoString
  }
}

export function OrderDetail({
  orderDetail,
  loading,
  actionLoading,
  error,
  technicians = [],
  onClose,
  onUpdateStatus,
  onCancelClick,
  onAssignTechnician,
}) {
  const { currentRole } = useRole()
  const [selectedTechId, setSelectedTechId] = useState('')
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignError, setAssignError] = useState(null)

  useEffect(() => {
    if (orderDetail?.technician_id) {
      setSelectedTechId(String(orderDetail.technician_id))
    } else {
      setSelectedTechId('')
    }
    setAssignError(null)
  }, [orderDetail])

  if (loading) {
    return (
      <div className="panel order-detail-panel">
        <div className="panel-header">
          <button className="btn btn-secondary btn-sm back-to-list-btn" onClick={onClose}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Daftar Order
          </button>
        </div>
        <div className="panel-body loading-state">
          <div className="spinner" />
          <p style={{ marginTop: '12px' }}>Memuat detail order...</p>
        </div>
      </div>
    )
  }

  if (!orderDetail) {
    return null
  }

  const { id, order_number, description, status, version, created_at, updated_at, history, technician_id } = orderDetail
  const isFinal = status === 'DONE' || status === 'CANCELLED'

  // Current Technician lookup
  const assignedTech = technicians.find((t) => Number(t.id) === Number(technician_id))
  const currentTechName = assignedTech ? assignedTech.name : (technician_id ? `Technician #${technician_id}` : 'Unassigned')

  // Role Access Rules
  const canUpdateStatus = (currentRole === ROLES.ADMIN || currentRole === ROLES.TECHNICIAN) && !isFinal
  const canCancelOrder = (currentRole === ROLES.CLIENT || currentRole === ROLES.ADMIN) && !isFinal
  const canAssignTechnician = currentRole === ROLES.ADMIN && status === 'TO DO'

  const handleAssignSubmit = async (e) => {
    e.preventDefault()
    if (!selectedTechId) {
      setAssignError('Pilih salah satu teknisi dari dropdown terlebih dahulu.')
      return
    }
    try {
      setAssignLoading(true)
      setAssignError(null)
      await onAssignTechnician(id, Number(selectedTechId))
    } catch (err) {
      setAssignError(err.message || 'Gagal menugaskan teknisi')
    } finally {
      setAssignLoading(false)
    }
  }

  return (
    <div className="panel order-detail-panel">
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Back button for Mobile drill-down */}
          <button className="btn btn-secondary btn-sm back-btn" onClick={onClose} title="Kembali ke Daftar Order">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="back-text">Kembali</span>
          </button>

          <span className="panel-title">{order_number}</span>
          <span style={{ fontSize: '11px', background: '#E2E8F0', padding: '2px 6px', borderRadius: '4px', color: '#475569', fontWeight: 600 }}>
            v{version}
          </span>
        </div>

        <button className="btn btn-secondary btn-sm close-desktop-btn" onClick={onClose}>
          Tutup
        </button>
      </div>

      <div className="panel-body">
        {error && (
          <div className="alert alert-danger">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Current Status & Technician Info Section */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
            Status & Teknisi Teralokasi
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <StatusBadge status={status} />
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Versi Data: {version}
            </span>
          </div>

          <div style={{ fontSize: '13px', backgroundColor: '#F8FAFC', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#0284C7' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>
              Current Technician:{' '}
              <strong style={{ color: assignedTech ? 'var(--color-primary)' : '#64748B' }}>
                {currentTechName}
              </strong>
            </span>
          </div>
        </div>

        {/* Admin Technician Assignment Form Section */}
        {currentRole === ROLES.ADMIN && (
          <div style={{ padding: '14px', backgroundColor: '#F0F9FF', borderRadius: '6px', border: '1px solid #BAE6FD', marginBottom: '20px' }}>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0369A1', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Penugasan Teknisi Lapangan (Assign Technician)
            </div>

            {assignError && (
              <div className="alert alert-danger" style={{ padding: '8px 12px', fontSize: '12px' }}>
                <span>{assignError}</span>
              </div>
            )}

            {canAssignTechnician ? (
              <form onSubmit={handleAssignSubmit} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <select
                  className="form-control"
                  style={{ flex: 1, minWidth: '180px', backgroundColor: '#FFFFFF' }}
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value)}
                  disabled={assignLoading}
                >
                  <option value="">-- Select Technician --</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={assignLoading || !selectedTechId}
                >
                  {assignLoading ? 'Menugaskan...' : 'Assign Technician'}
                </button>
              </form>
            ) : (
              <div style={{ fontSize: '12px', color: '#0284C7', fontStyle: 'italic' }}>
                Penugasan teknisi hanya dapat dilakukan ketika order berstatus <strong>TO DO</strong>. Status saat ini: <strong>{status}</strong>.
              </div>
            )}
          </div>
        )}

        {/* Role-Specific Action Controls Section */}
        <div className="action-control-box">
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-sub)', marginBottom: '10px' }}>
            Aksi Transisi Status ({currentRole})
          </div>

          {isFinal ? (
            <div style={{ fontSize: '12.5px', color: '#64748B', fontStyle: 'italic' }}>
              Status pekerjaan sudah <strong>{status}</strong> (Final - tidak dapat diubah).
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {canUpdateStatus && status === 'TO DO' && (
                <button
                  className="btn btn-primary btn-sm"
                  disabled={actionLoading}
                  onClick={() => onUpdateStatus(id, 'IN PROGRESS')}
                >
                  {actionLoading ? 'Memproses...' : 'Mulai Pekerjaan (IN PROGRESS)'}
                </button>
              )}

              {canUpdateStatus && status === 'IN PROGRESS' && (
                <button
                  className="btn btn-success btn-sm"
                  disabled={actionLoading}
                  onClick={() => onUpdateStatus(id, 'DONE')}
                >
                  {actionLoading ? 'Memproses...' : 'Selesaikan Pekerjaan (DONE)'}
                </button>
              )}

              {canCancelOrder && (
                <button
                  className="btn btn-outline-danger btn-sm"
                  disabled={actionLoading}
                  onClick={() => onCancelClick(orderDetail)}
                >
                  Batalkan Order
                </button>
              )}

              {currentRole === ROLES.CLIENT && !canCancelOrder && (
                <div style={{ fontSize: '12px', color: '#64748B', fontStyle: 'italic' }}>
                  Perubahan status pekerjaan dilakukan oleh Tim Operasional SUCOFINDO.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Order Details Metadata */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>
            Deskripsi Pekerjaan
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--color-text-main)', backgroundColor: '#FFFFFF', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
            {description}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px', fontSize: '12px' }}>
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>Waktu Dibuat:</span>
            <div style={{ fontWeight: 600, marginTop: '2px' }}>{formatDate(created_at)}</div>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>Terakhir Diperbarui:</span>
            <div style={{ fontWeight: 600, marginTop: '2px' }}>{formatDate(updated_at)}</div>
          </div>
        </div>

        {/* Status History Timeline Section */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '12px' }}>
            Histori Transisi Status (Timeline)
          </div>
          <OrderTimeline history={history} />
        </div>
      </div>
    </div>
  )
}
