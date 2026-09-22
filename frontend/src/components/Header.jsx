import React from 'react'
import { useRole, ROLES, ROLE_LABELS } from '../context/RoleContext'

export function Header({ title, subtitle, sseStatus = 'Connected', onCreateClick, onOpenMobileDrawer }) {
  const { currentUser, currentRole, currentUserId, switchUser, USERS, ROLE_LABELS } = useRole()

  const canCreateOrder = currentRole === ROLES.CLIENT || currentRole === ROLES.ADMIN

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        {/* Mobile Hamburger Menu Button */}
        <button
          type="button"
          className="mobile-hamburger-btn mobile-only"
          onClick={onOpenMobileDrawer}
          title="Buka Navigasi Menu"
        >
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Brand logo in Top App Bar for Mobile */}
        <div className="mobile-brand-info mobile-only">
          <span className="brand-badge-sm">S</span>
          <span className="mobile-app-title">SUCOFINDO</span>
        </div>

        {/* Title Area for Desktop & Tablet */}
        <div className="desktop-title-area">
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="top-bar-right">
        {/* SSE Real-time Connection Indicator Badge */}
        {(() => {
          const lower = (sseStatus || '').toLowerCase()
          const statusKey = lower.includes('reconnect')
            ? 'reconnecting'
            : lower.includes('connect')
            ? 'connected'
            : 'disconnected'
          const displayText = statusKey === 'reconnecting' ? 'Reconnecting...' : statusKey === 'connected' ? 'Connected' : 'Disconnected'

          return (
            <div className={`sse-status-badge sse-${statusKey}`} title={`SSE Realtime Status: ${displayText}`}>
              <span className="sse-dot" />
              <span className="sse-text">{displayText}</span>
            </div>
          )
        })()}

        {/* Demo Role / User Switcher Selector */}
        <div className="role-switcher-container">
          <label className="role-switcher-label">Simulasi Akun:</label>
          <select
            className="role-select-control"
            value={currentUserId}
            onChange={(e) => switchUser(Number(e.target.value))}
            title="Ganti User / Role Aktif untuk Demo Skenario"
          >
            {USERS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        </div>

        {/* Current Active User & Role Badge */}
        <div className={`role-badge role-${currentRole.toLowerCase()}`}>
          <span className="role-dot" />
          <span className="role-name">{currentUser.name} ({ROLE_LABELS[currentRole]})</span>
        </div>

        {canCreateOrder && onCreateClick && (
          <button className="btn btn-primary btn-create" onClick={onCreateClick}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="btn-label">Buat Order Baru</span>
          </button>
        )}
      </div>
    </header>
  )
}

