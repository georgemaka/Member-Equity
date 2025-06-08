import { Link, useLocation } from 'react-router-dom'
import { useMockAuth } from '@/contexts/MockAuthContext'
import FiscalYearSelector from './FiscalYearSelector'
import { 
  HomeIcon, 
  UsersIcon, 
  ChartBarIcon, 
  BanknotesIcon,
  ChartPieIcon,
  CurrencyDollarIcon,
  CalculatorIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Members', href: '/members', icon: UsersIcon },
  { name: 'Equity', href: '/equity', icon: ChartPieIcon },
  { name: 'Tax Payments', href: '/tax-payments', icon: CurrencyDollarIcon },
  { name: 'Year-End Allocation', href: '/year-end-allocation', icon: CalculatorIcon },
  { name: 'Distributions', href: '/distributions', icon: BanknotesIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
]

export default function Navigation() {
  const location = useLocation()
  const { user, logout } = useMockAuth()

  return (
    <nav className="bg-white shadow-lg w-64 min-h-screen">
      <div className="p-6">
        <div className="mb-8">
          <span className="text-xl font-bold text-sukut-700">
            Sukut Construction
          </span>
          <p className="text-sm text-gray-500 mt-1">Member Equity Management</p>
        </div>

        <div className="space-y-2">
          {navigation.map((item) => {
            const isCurrent = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  isCurrent
                    ? 'bg-sukut-100 text-sukut-700 border-r-2 border-sukut-500'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                } flex items-center px-3 py-2 text-sm font-medium rounded-l-md transition-colors duration-150`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            )
          })}
        </div>

        {/* Fiscal Year Selector */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Fiscal Year
          </p>
          <FiscalYearSelector />
        </div>

        <div className="mt-auto pt-8 border-t border-gray-200">
          <div className="mb-4">
            <p className="text-sm text-gray-500">Welcome,</p>
            <p className="text-sm font-medium text-gray-900">
              {user?.name || user?.email}
            </p>
          </div>
          <button
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-150"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  )
}