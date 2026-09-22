import React from 'react'
import { useRole, ROLES, ROLE_LABELS } from '../context/RoleContext'

export function Header({ title, subtitle, onCreateClick, onOpenMobileDrawer }) {
  const { currentRole, setCurrentRole } = useRole()

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
        {/* Demo Role Switcher Selector */}
        <div className="role-switcher-container">
          <label className="role-switcher-label">Simulasi Role:</label>
          <select
            className="role-select-control"
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value)}
            title="Ganti Role Aktif untuk Demo Skenario"
          >
            <option value={ROLES.CLIENT}>Client (Pelanggan)</option>
            <option value={ROLES.ADMIN}>Admin (Dispatcher)</option>
            <option value={ROLES.TECHNICIAN}>Technician (Teknisi)</option>
          </select>
        </div>

        {/* Current Active Role Badge */}
        <div className={`role-badge role-${currentRole.toLowerCase()}`}>
          <span className="role-dot" />
          <span className="role-name">{ROLE_LABELS[currentRole]}</span>
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
