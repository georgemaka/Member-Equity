import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMockAuth } from '@/contexts/MockAuthContext'
import FiscalYearSelector from './FiscalYearSelector'
import RoleSwitcher from './RoleSwitcher'
import { 
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  CogIcon,
  BellIcon
} from '@heroicons/react/24/outline'

interface GlobalHeaderProps {
  onMenuClick: () => void
}

export default function GlobalHeader({ onMenuClick }: GlobalHeaderProps) {
  const { user, logout } = useMockAuth()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Left section */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={onMenuClick}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sukut-500 lg:hidden"
            >
              <span className="sr-only">Open menu</span>
              <Bars3Icon className="h-6 w-6" />
            </button>

            {/* Logo/Company name */}
            <div className="flex items-center ml-4 lg:ml-0">
              <Link to="/" className="flex items-center">
                <span className="text-lg font-bold text-sukut-700">Sukut Construction</span>
              </Link>
            </div>
          </div>

          {/* Center section - Reserved for future use */}
          <div className="hidden md:flex items-center flex-1 justify-center">
            {/* Space for global search or other controls */}
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-4">
            {/* Notification bell (placeholder) */}
            <button className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sukut-500">
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-6 w-6" />
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center rounded-md bg-white p-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sukut-500"
              >
                <UserCircleIcon className="h-6 w-6 text-gray-400" />
                <span className="hidden ml-2 mr-1 sm:block font-medium">
                  {user?.name || user?.email}
                </span>
                <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* User dropdown */}
              {isUserMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="p-1">
                      {/* User info */}
                      <div className="px-3 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>

                      {/* Role switcher (compact) */}
                      <div className="px-3 py-2 border-b border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Current Role</p>
                        <div className="w-full">
                          <RoleSwitcher />
                        </div>
                      </div>

                      {/* Fiscal year selector for mobile */}
                      <div className="px-3 py-2 md:hidden border-b border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Fiscal Year</p>
                        <FiscalYearSelector />
                      </div>

                      {/* Menu items */}
                      <button
                        className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                      >
                        <CogIcon className="mr-3 h-5 w-5 text-gray-400" />
                        Settings
                      </button>

                      <button
                        onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                        className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                      >
                        <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}