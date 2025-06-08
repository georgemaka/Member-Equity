import { useState } from 'react'
import { useMockAuth, UserRole } from '@/contexts/MockAuthContext'
import { 
  ChevronDownIcon,
  UserIcon,
  ShieldCheckIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline'

const roleLabels = {
  admin: 'Administrator',
  board_member: 'Board Member',
  accountant: 'Accountant',
  member: 'Member'
}

const roleIcons = {
  admin: ShieldCheckIcon,
  board_member: UserIcon,
  accountant: CalculatorIcon,
  member: UserIcon
}

const roleColors = {
  admin: 'bg-red-100 text-red-800 border-red-200',
  board_member: 'bg-purple-100 text-purple-800 border-purple-200',
  accountant: 'bg-blue-100 text-blue-800 border-blue-200',
  member: 'bg-green-100 text-green-800 border-green-200'
}

export default function RoleSwitcher() {
  const { user, switchUserRole } = useMockAuth()
  const [isOpen, setIsOpen] = useState(false)

  if (!user?.role) return null

  const CurrentRoleIcon = roleIcons[user.role]
  const currentRoleColor = roleColors[user.role]

  const roles: UserRole[] = ['admin', 'board_member', 'accountant', 'member']

  return (
    <div className="relative">
      {/* Current Role Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center w-full px-3 py-2 border rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-sm ${currentRoleColor}`}
      >
        <CurrentRoleIcon className="h-4 w-4 mr-2" />
        <span className="flex-1 text-left">{roleLabels[user.role]}</span>
        <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
              Switch Role (Demo)
            </div>
            {roles.map((role) => {
              const RoleIcon = roleIcons[role]
              const isSelected = user.role === role
              return (
                <button
                  key={role}
                  onClick={() => {
                    switchUserRole(role)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center px-2 py-2 text-sm rounded-md transition-colors duration-200 ${
                    isSelected
                      ? `${roleColors[role]} font-medium`
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <RoleIcon className="h-4 w-4 mr-2" />
                  {roleLabels[role]}
                  {isSelected && (
                    <span className="ml-auto text-xs">(Current)</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}