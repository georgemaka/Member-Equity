import { ReactNode } from 'react'
import { useMockAuth } from '@/contexts/MockAuthContext'
import { 
  ExclamationTriangleIcon,
  LockClosedIcon 
} from '@heroicons/react/24/outline'

interface PermissionGuardProps {
  children: ReactNode
  permission?: string
  resource?: string
  fallback?: ReactNode
  requireAll?: boolean
  permissions?: string[]
}

export default function PermissionGuard({ 
  children, 
  permission, 
  resource, 
  fallback,
  requireAll = false,
  permissions = []
}: PermissionGuardProps) {
  const { hasPermission, canAccess, user } = useMockAuth()

  // Check permissions
  let hasAccess = false

  if (permission) {
    hasAccess = hasPermission(permission)
  } else if (resource) {
    hasAccess = canAccess(resource)
  } else if (permissions.length > 0) {
    if (requireAll) {
      hasAccess = permissions.every(perm => hasPermission(perm))
    } else {
      hasAccess = permissions.some(perm => hasPermission(perm))
    }
  } else {
    hasAccess = true // No restrictions
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }

    // Default fallback UI
    return (
      <div className="flex items-center justify-center min-h-32">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <LockClosedIcon />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            You don't have permission to access this feature. 
            Current role: <span className="font-medium">{user?.role}</span>
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Hook for conditional rendering based on permissions
export function usePermissionCheck() {
  const { hasPermission, canAccess } = useMockAuth()

  return {
    hasPermission,
    canAccess,
    checkPermission: (permission: string) => hasPermission(permission),
    checkResource: (resource: string) => canAccess(resource)
  }
}