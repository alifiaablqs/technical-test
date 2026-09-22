import React from 'react'

export function Sidebar({
  activeTab,
  setActiveTab,
  isCollapsed,
  onToggleCollapse,
  isMobileDrawerOpen,
  onCloseMobileDrawer,
}) {
  const handleNavClick = (tab) => {
    setActiveTab(tab)
    if (onCloseMobileDrawer) {
      onCloseMobileDrawer()
    }
  }

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileDrawerOpen && (
        <div className="mobile-drawer-backdrop" onClick={onCloseMobileDrawer} />
      )}

      <aside
        className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${
          isMobileDrawerOpen ? 'mobile-drawer-open' : ''
        }`}
      >
        <div className="sidebar-header">
          <div className="brand-logo-area">
            <div className="brand-badge">S</div>
            {!isCollapsed && (
              <div className="brand-info">
                <span className="brand-subtitle">Order Tracking</span>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            type="button"
            className="collapse-toggle-btn desktop-only"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand Sidebar' : 'Minimize Sidebar'}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
              )}
            </svg>
          </button>

          {/* Mobile drawer close button */}
          <button
            type="button"
            className="mobile-close-btn mobile-only"
            onClick={onCloseMobileDrawer}
            title="Tutup Menu"
          >
            &times;
          </button>
        </div>

        <nav className="sidebar-nav">
          {!isCollapsed && <div className="nav-group-title">MENU UTAMA</div>}

          <button
            type="button"
            className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => handleNavClick('orders')}
            title="Daftar Order"
          >
            <svg className="nav-icon" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {!isCollapsed && <span className="nav-text">Daftar Order</span>}
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleNavClick('overview')}
            title="Ringkasan Status"
          >
            <svg className="nav-icon" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {!isCollapsed && <span className="nav-text">Ringkasan Status</span>}
          </button>
        </nav>

        <div className="sidebar-footer">
          {!isCollapsed ? (
            <>
              <div>Lingkungan Operasional</div>
              <div style={{ color: '#E2E8F0', fontWeight: 600, fontSize: '11px', marginTop: '2px' }}>
                INTERNAL PORTAL v1.0
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', fontSize: '10px', color: '#94A3B8' }}>v1.0</div>
          )}
        </div>
      </aside>
    </>
  )
}
