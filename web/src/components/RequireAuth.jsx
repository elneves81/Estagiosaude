import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

// Simple client-side route guard using localStorage token and userType
export default function RequireAuth({ children, roles }) {
  const location = useLocation()
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const userType = typeof window !== 'undefined' ? localStorage.getItem('userType') : null

  if (!token) {
    // Not authenticated: go to login, keep where we wanted to go
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && Array.isArray(roles) && roles.length > 0) {
    if (!userType || !roles.includes(userType)) {
      // Auth but not authorized: go to dashboard
      return <Navigate to="/dashboard" replace />
    }
  }

  return children
}
