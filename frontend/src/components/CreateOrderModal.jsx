import React, { useState } from 'react'

export function CreateOrderModal({ isOpen, onClose, onSubmit }) {
  const [orderNumber, setOrderNumber] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!orderNumber.trim() || !description.trim()) {
      setError('Order Number dan Deskripsi Pekerjaan wajib diisi.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await onSubmit({
        order_number: orderNumber.trim(),
        description: description.trim(),
        client_id: null,
      })
      setOrderNumber('')
      setDescription('')
      onClose()
    } catch (err) {
      setError(err.message || 'Gagal membuat order baru')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Buat Order Pekerjaan Baru</h3>
          <button
            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: '#64748B' }}
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger">
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Order Number <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Contoh: ORD-2026-001"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                Deskripsi Pekerjaan <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Jelaskan rincian pengecekan / perbaikan pekerjaan..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
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
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
