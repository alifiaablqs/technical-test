import React, { createContext, useContext, useState, useEffect } from 'react'

/**
 * Catatan Arsitektur (PoC Assumption):
 * Role selection pada PoC ini digunakan untuk mensimulasikan responsibility masing-masing actor
 * (Client, Admin/Dispatcher, Technician). Authentication dan RBAC production-ready
 * berada di luar scope technical assignment ini.
 */

const RoleContext = createContext()

export const ROLES = {
  CLIENT: 'CLIENT',
  ADMIN: 'ADMIN',
  TECHNICIAN: 'TECHNICIAN',
}

export const ROLE_LABELS = {
  CLIENT: 'Client / Pelanggan',
  ADMIN: 'Admin / Dispatcher',
  TECHNICIAN: 'Field Officer / Teknisi',
}

export function RoleProvider({ children }) {
  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem('demo_current_role') || ROLES.ADMIN
  })

  useEffect(() => {
    localStorage.setItem('demo_current_role', currentRole)
  }, [currentRole])

  return (
    <RoleContext.Provider value={{ currentRole, setCurrentRole, ROLES, ROLE_LABELS }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider')
  }
  return context
}
