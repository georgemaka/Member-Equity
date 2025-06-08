import { createContext, useContext, useState, ReactNode } from 'react'

export type UserRole = 'admin' | 'member' | 'board_member' | 'accountant'

export interface User {
  id?: string
  name?: string
  email?: string
  role?: UserRole
  permissions?: string[]
  memberId?: string // For linking to member records
}

interface MockAuthContextType {
  isLoading: boolean
  isAuthenticated: boolean
  user?: User
  loginWithRedirect: () => void
  logout: (options?: any) => void
  getAccessTokenSilently: () => Promise<string>
  switchUserRole: (role: UserRole) => void
  hasPermission: (permission: string) => boolean
  canAccess: (resource: string) => boolean
}

const MockAuthContext = createContext<MockAuthContextType | null>(null)

// Role-based permissions
const ROLE_PERMISSIONS = {
  admin: [
    'members:read', 'members:write', 'members:delete',
    'equity:read', 'equity:write', 'equity:manage',
    'distributions:read', 'distributions:write', 'distributions:approve',
    'tax_payments:read', 'tax_payments:write',
    'analytics:read', 'analytics:export', 'audit:read',
    'documents:read', 'documents:write', 'documents:delete',
    'settings:read', 'settings:write'
  ],
  board_member: [
    'members:read', 'equity:read', 'equity:write', 'equity:manage',
    'distributions:read', 'distributions:approve',
    'tax_payments:read', 'analytics:read', 'analytics:export', 'audit:read',
    'documents:read', 'documents:write'
  ],
  accountant: [
    'members:read', 'equity:read',
    'distributions:read', 'distributions:write',
    'tax_payments:read', 'tax_payments:write',
    'analytics:read', 'audit:read',
    'documents:read', 'documents:write'
  ],
  member: [
    'members:read_own', 'equity:read_own',
    'distributions:read_own', 'tax_payments:read_own',
    'documents:read'
  ]
}

// Mock users for different roles
const MOCK_USERS = {
  admin: {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@sukut.com',
    role: 'admin' as UserRole,
    permissions: ROLE_PERMISSIONS.admin
  },
  board_member: {
    id: 'board-1',
    name: 'Board Member',
    email: 'board@sukut.com',
    role: 'board_member' as UserRole,
    permissions: ROLE_PERMISSIONS.board_member
  },
  accountant: {
    id: 'accountant-1',
    name: 'Staff Accountant',
    email: 'accountant@sukut.com',
    role: 'accountant' as UserRole,
    permissions: ROLE_PERMISSIONS.accountant
  },
  member: {
    id: 'member-1',
    name: 'John Smith',
    email: 'john.smith@sukut.com',
    role: 'member' as UserRole,
    permissions: ROLE_PERMISSIONS.member,
    memberId: 'member-123'
  }
}

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const [user, setUser] = useState<User | undefined>(MOCK_USERS.admin)

  const loginWithRedirect = () => {
    // Simulate login - default to admin
    setUser(MOCK_USERS.admin)
    setIsAuthenticated(true)
  }

  const logout = () => {
    setUser(undefined)
    setIsAuthenticated(false)
  }

  const getAccessTokenSilently = async () => {
    return 'mock-token-for-development'
  }

  const switchUserRole = (role: UserRole) => {
    setUser(MOCK_USERS[role])
  }

  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) || false
  }

  const canAccess = (resource: string): boolean => {
    if (!user?.role) return false
    
    // Resource access mapping
    const resourcePermissions = {
      'members': ['members:read', 'members:write'],
      'equity': ['equity:read', 'equity:write'],
      'distributions': ['distributions:read', 'distributions:write'],
      'tax-payments': ['tax_payments:read', 'tax_payments:write'],
      'analytics': ['analytics:read'],
      'audit': ['audit:read'],
      'documents': ['documents:read', 'documents:write'],
      'settings': ['settings:read']
    }
    
    const requiredPermissions = resourcePermissions[resource as keyof typeof resourcePermissions]
    if (!requiredPermissions) return false
    
    // Check if user has at least one of the required permissions
    return requiredPermissions.some(permission => hasPermission(permission))
  }

  return (
    <MockAuthContext.Provider value={{
      isLoading: false,
      isAuthenticated,
      user,
      loginWithRedirect,
      logout,
      getAccessTokenSilently,
      switchUserRole,
      hasPermission,
      canAccess
    }}>
      {children}
    </MockAuthContext.Provider>
  )
}

export function useMockAuth() {
  const context = useContext(MockAuthContext)
  if (!context) {
    throw new Error('useMockAuth must be used within MockAuthProvider')
  }
  return context
}