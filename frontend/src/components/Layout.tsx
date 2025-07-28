import { ReactNode, useState } from 'react'
import { useMockAuth } from '@/contexts/MockAuthContext'
import Navigation from './Navigation'
import GlobalHeader from './GlobalHeader'
import MobileNavigationDrawer from './MobileNavigationDrawer'
import LoadingSpinner from './LoadingSpinner'

interface LayoutProps {
  children: ReactNode
  fullWidth?: boolean
}

export default function Layout({ children, fullWidth = false }: LayoutProps) {
  const { isLoading, isAuthenticated, loginWithRedirect } = useMockAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-sukut-700">
              Sukut Construction
            </h1>
            <h2 className="mt-2 text-xl text-gray-600">
              Member Equity Management
            </h2>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <button
              onClick={() => loginWithRedirect()}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sukut-600 hover:bg-sukut-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sukut-500"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global Header */}
      <GlobalHeader onMenuClick={() => setMobileMenuOpen(true)} />
      
      <div className="flex">
        {/* Desktop Navigation */}
        <div className="hidden lg:block">
          <Navigation />
        </div>
        
        {/* Mobile Navigation Drawer */}
        <MobileNavigationDrawer 
          open={mobileMenuOpen} 
          onClose={() => setMobileMenuOpen(false)} 
        />
        
        {/* Main Content */}
        <main className={`flex-1 overflow-x-hidden ${fullWidth ? 'p-2 sm:p-3 lg:p-4' : 'p-4 sm:p-6 lg:p-8 xl:p-10 2xl:p-12'}`}>
          {children}
        </main>
      </div>
    </div>
  )
}