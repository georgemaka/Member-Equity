import { createContext, useContext, useState, ReactNode } from 'react'

interface User {
  name?: string
  email?: string
}

interface MockAuthContextType {
  isLoading: boolean
  isAuthenticated: boolean
  user?: User
  loginWithRedirect: () => void
  logout: (options?: any) => void
  getAccessTokenSilently: () => Promise<string>
}

const MockAuthContext = createContext<MockAuthContextType | null>(null)

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | undefined>()

  const loginWithRedirect = () => {
    // Simulate login
    setUser({ 
      name: 'Admin User', 
      email: 'admin@sukut.com' 
    })
    setIsAuthenticated(true)
  }

  const logout = () => {
    setUser(undefined)
    setIsAuthenticated(false)
  }

  const getAccessTokenSilently = async () => {
    return 'mock-token-for-development'
  }

  return (
    <MockAuthContext.Provider value={{
      isLoading: false,
      isAuthenticated,
      user,
      loginWithRedirect,
      logout,
      getAccessTokenSilently
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