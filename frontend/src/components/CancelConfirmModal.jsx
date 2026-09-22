import React, { useState } from 'react'

export function CancelConfirmModal({ isOpen, order, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen || !order) return null

  const handleConfirm = async () => {
    try {
      setLoading(true)
      setError(null)
      await onConfirm(order.id)
      onClose()
    } catch (err) {
      if (err.status === 409) {
        setError('Order tidak dapat dibatalkan karena status pekerjaan sudah final.')
      } else {
        setError(err.message || 'Gagal membatalkan order.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ color: '#B91C1C' }}>
            Konfirmasi Pembatalan Order
          </h3>
          <button
            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: '#64748B' }}
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert alert-danger">
              <span>{error}</span>
            </div>
          )}

          <p style={{ fontSize: '14px', color: 'var(--color-text-main)', marginBottom: '10px' }}>
            Apakah Anda yakin ingin membatalkan order pekerjaan <strong>{order.order_number}</strong>?
          </p>
          <div style={{ padding: '10px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '4px', fontSize: '12.5px', color: '#991B1B' }}>
            Perhatian: Status order akan diubah menjadi <strong>CANCELLED</strong> (Final) dan tidak dapat diubah kembali setelah proses ini diselesaikan.
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Batal
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Membatalkan...' : 'Ya, Batalkan Order'}
          </button>
        </div>
      </div>
    </div>
  )
}
