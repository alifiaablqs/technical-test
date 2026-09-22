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

export const USERS = [
  { id: 1, name: 'Client Demo', role: ROLES.CLIENT, label: 'Client Demo (CLIENT)' },
  { id: 2, name: 'Admin Dispatcher', role: ROLES.ADMIN, label: 'Admin Dispatcher (ADMIN)' },
  { id: 3, name: 'Technician A', role: ROLES.TECHNICIAN, label: 'Technician A (ID 3)' },
  { id: 4, name: 'Technician B', role: ROLES.TECHNICIAN, label: 'Technician B (ID 4)' },
]

export function RoleProvider({ children }) {
  const [currentUserId, setCurrentUserId] = useState(() => {
    const saved = localStorage.getItem('demo_current_user_id')
    return saved ? Number(saved) : 2 // Default to Admin Dispatcher (ID 2)
  })

  useEffect(() => {
    localStorage.setItem('demo_current_user_id', currentUserId)
  }, [currentUserId])

  const currentUser = USERS.find((u) => u.id === currentUserId) || USERS[1]
  const currentRole = currentUser.role

  const switchUser = (userId) => {
    setCurrentUserId(Number(userId))
  }

  return (
    <RoleContext.Provider
      value={{
        currentUser,
        currentRole,
        currentUserId,
        switchUser,
        USERS,
        ROLES,
        ROLE_LABELS,
      }}
    >
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
