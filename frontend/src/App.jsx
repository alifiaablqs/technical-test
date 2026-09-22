import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  fetchOrders,
  fetchOrderDetail,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  fetchTechnicians,
  assignTechnician,
} from './api/orderApi'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { OrderList } from './components/OrderList'
import { OrderDetail } from './components/OrderDetail'
import { Overview } from './components/Overview'
import { CreateOrderModal } from './components/CreateOrderModal'
import { CancelConfirmModal } from './components/CancelConfirmModal'

export default function App() {
  const [activeTab, setActiveTab] = useState('orders')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)

  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [ordersError, setOrdersError] = useState(null)

  const [technicians, setTechnicians] = useState([])

  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [detailError, setDetailError] = useState(null)

  const [sseStatus, setSseStatus] = useState('Disconnected')
  const selectedOrderIdRef = useRef(selectedOrderId)

  const [actionLoading, setActionLoading] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [cancelTargetOrder, setCancelTargetOrder] = useState(null)

  const [toast, setToast] = useState(null)

  // Keep selectedOrderIdRef updated to prevent stale closures in SSE listener
  useEffect(() => {
    selectedOrderIdRef.current = selectedOrderId
  }, [selectedOrderId])

  // Auto-collapse sidebar on Tablet screen sizes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024 && window.innerWidth > 768) {
        setIsSidebarCollapsed(true)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const showToast = (text, type = 'success') => {
    setToast({ text, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Load order list
  const loadOrders = useCallback(async () => {
    try {
      setLoadingOrders(true)
      setOrdersError(null)
      const res = await fetchOrders()
      setOrders(res.data || [])
    } catch (err) {
      setOrdersError(err.message || 'Gagal memuat daftar order')
    } finally {
      setLoadingOrders(false)
    }
  }, [])

  // Load technicians list
  const loadTechnicians = useCallback(async () => {
    try {
      const res = await fetchTechnicians()
      setTechnicians(res.data || [])
    } catch (err) {
      console.error('Gagal memuat daftar teknisi:', err)
    }
  }, [])

  useEffect(() => {
    loadOrders()
    loadTechnicians()
  }, [loadOrders, loadTechnicians])

  // Load detail order
  const loadDetail = useCallback(async (id) => {
    if (!id) return
    try {
      setLoadingDetail(true)
      setDetailError(null)
      const res = await fetchOrderDetail(id)
      setSelectedOrderDetail(res.data)
    } catch (err) {
      setDetailError(err.message || 'Gagal memuat detail order')
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  // Real-time SSE Connection Effect
  useEffect(() => {
    let eventSource = null

    try {
      eventSource = new EventSource('/api/orders/events')

      eventSource.onopen = () => {
        setSseStatus('Connected')
        // Upon connecting or reconnecting, fetch fresh state from API/DB
        loadOrders()
        if (selectedOrderIdRef.current) {
          loadDetail(selectedOrderIdRef.current)
        }
      }

      eventSource.onerror = () => {
        setSseStatus('Reconnecting')
      }

      eventSource.addEventListener('order.updated', (e) => {
        try {
          const data = JSON.parse(e.data)
          const updatedId = Number(data.order_id)
          const newStatus = data.status
          const newVersion = data.version

          // Update order status & version in order list state
          setOrders((prevOrders) =>
            prevOrders.map((order) =>
              order.id === updatedId
                ? { ...order, status: newStatus, version: newVersion }
                : order
            )
          )

          // If the updated order is currently open in Order Detail, refresh full detail
          if (selectedOrderIdRef.current === updatedId) {
            loadDetail(updatedId)
          }
        } catch (err) {
          console.error('Gagal memproses event order.updated:', err)
        }
      })
    } catch (err) {
      console.error('Gagal inisialisasi SSE EventSource:', err)
      setSseStatus('Disconnected')
    }

    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [loadOrders, loadDetail])

  const handleSelectOrder = (id) => {
    if (selectedOrderId === id) return
    setSelectedOrderId(id)
    loadDetail(id)
  }

  const handleCloseDetail = () => {
    setSelectedOrderId(null)
    setSelectedOrderDetail(null)
    setDetailError(null)
  }

  // Action: Create Order
  const handleCreateOrder = async (payload) => {
    const res = await createOrder(payload)
    showToast(`Order ${payload.order_number} berhasil dibuat`, 'success')
    await loadOrders()
    if (res?.data?.id) {
      setSelectedOrderId(res.data.id)
      setSelectedOrderDetail({
        ...res.data,
        history: [{ id: 1, order_id: res.data.id, status: 'TO DO', created_at: res.data.created_at }],
      })
    }
  }

  // Action: Update Status
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      setActionLoading(true)
      setDetailError(null)
      await updateOrderStatus(id, newStatus)
      showToast(`Status order berhasil diubah menjadi ${newStatus}`, 'success')
      await loadDetail(id)
      await loadOrders()
    } catch (err) {
      setDetailError(err.message || 'Gagal memperbarui status order')
    } finally {
      setActionLoading(false)
    }
  }

  // Action: Assign Technician
  const handleAssignTechnician = async (orderId, technicianId) => {
    try {
      setActionLoading(true)
      setDetailError(null)
      await assignTechnician(orderId, technicianId)
      showToast(`Teknisi berhasil ditugaskan ke order`, 'success')
      await loadDetail(orderId)
      await loadOrders()
    } catch (err) {
      setDetailError(err.message || 'Gagal menugaskan teknisi')
    } finally {
      setActionLoading(false)
    }
  }

  // Action: Cancel Order
  const handleConfirmCancel = async (id) => {
    await cancelOrder(id)
    showToast(`Order berhasil dibatalkan`, 'success')
    await loadDetail(id)
    await loadOrders()
  }

  return (
    <div className="app-layout">
      {/* Sidebar / Mobile Navigation Drawer */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab)
          setIsMobileDrawerOpen(false)
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileDrawerOpen={isMobileDrawerOpen}
        onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
      />

      {/* Main Container */}
      <div className="main-wrapper">
        <Header
          title={activeTab === 'orders' ? 'Sistem Manajemen Order Pekerjaan' : 'Ringkasan Status Pekerjaan'}
          subtitle={
            activeTab === 'orders'
              ? 'Monitoring dan pengelolaan transisi status order pekerjaan secara terstruktur'
              : 'Informasi agregat seluruh order pekerjaan'
          }
          sseStatus={sseStatus}
          onCreateClick={() => setIsCreateModalOpen(true)}
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
        />


        <main className="main-content">
          {toast && (
            <div
              className={`alert ${toast.type === 'error' ? 'alert-danger' : 'alert-success'}`}
              style={{ marginBottom: '20px' }}
            >
              <span>{toast.text}</span>
            </div>
          )}

          {activeTab === 'overview' ? (
            <Overview orders={orders} />
          ) : (
            <div
              className={`master-detail-grid ${selectedOrderId ? 'has-selection' : ''} ${
                selectedOrderId ? 'mobile-show-detail' : 'mobile-show-list'
              }`}
            >
              {/* Order List Table Component */}
              <div className="order-list-pane">
                <OrderList
                  orders={orders}
                  loading={loadingOrders}
                  error={ordersError}
                  selectedOrderId={selectedOrderId}
                  onSelectOrder={handleSelectOrder}
                  onRefresh={loadOrders}
                />
              </div>

              {/* Order Detail Component */}
              {selectedOrderId && (
                <div className="order-detail-pane">
                  <OrderDetail
                    orderDetail={selectedOrderDetail}
                    loading={loadingDetail}
                    actionLoading={actionLoading}
                    error={detailError}
                    technicians={technicians}
                    onClose={handleCloseDetail}
                    onUpdateStatus={handleUpdateStatus}
                    onCancelClick={(order) => setCancelTargetOrder(order)}
                    onAssignTechnician={handleAssignTechnician}
                  />
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateOrder}
      />

      <CancelConfirmModal
        isOpen={!!cancelTargetOrder}
        order={cancelTargetOrder}
        onClose={() => setCancelTargetOrder(null)}
        onConfirm={handleConfirmCancel}
      />
    </div>
  )
}

