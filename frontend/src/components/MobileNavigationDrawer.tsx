import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Link, useLocation } from 'react-router-dom'
import { useMockAuth } from '@/contexts/MockAuthContext'
import FiscalYearSelector from './FiscalYearSelector'
import RoleSwitcher from './RoleSwitcher'
import { 
  XMarkIcon,
  HomeIcon, 
  UsersIcon, 
  ChartBarIcon, 
  BanknotesIcon,
  ChartPieIcon,
  CurrencyDollarIcon,
  CalculatorIcon,
  ClockIcon,
  FolderIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline'

interface MobileNavigationDrawerProps {
  open: boolean
  onClose: () => void
}

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/', 
    icon: HomeIcon,
    permission: 'members:read'
  },
  { 
    name: 'Members', 
    href: '/members', 
    icon: UsersIcon,
    resource: 'members'
  },
  { 
    name: 'Equity', 
    href: '/equity', 
    icon: ChartPieIcon,
    resource: 'equity'
  },
  { 
    name: 'Tax Payments', 
    href: '/tax-payments', 
    icon: CurrencyDollarIcon,
    resource: 'tax-payments'
  },
  { 
    name: 'Year-End Allocation', 
    href: '/year-end-allocation', 
    icon: CalculatorIcon,
    permission: 'equity:write'
  },
  { 
    name: 'Distributions', 
    href: '/distributions', 
    icon: BanknotesIcon,
    resource: 'distributions'
  },
  { 
    name: 'Analytics', 
    href: '/analytics', 
    icon: ChartBarIcon,
    resource: 'analytics'
  },
  { 
    name: 'Documents', 
    href: '/documents', 
    icon: FolderIcon,
    permission: 'documents:read'
  },
  { 
    name: 'Audit Trail', 
    href: '/audit', 
    icon: ClockIcon,
    resource: 'audit'
  },
]

export default function MobileNavigationDrawer({ open, onClose }: MobileNavigationDrawerProps) {
  const location = useLocation()
  const { user, hasPermission, canAccess } = useMockAuth()

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/80" />
        </Transition.Child>

        <div className="fixed inset-0 flex">
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
              <Transition.Child
                as={Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <button
                    type="button"
                    className="-m-2.5 p-2.5"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon className="h-6 w-6 text-white" />
                  </button>
                </div>
              </Transition.Child>

              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                <div className="flex h-16 shrink-0 items-center">
                  <span className="text-xl font-bold text-sukut-700">Sukut Construction</span>
                </div>

                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {navigation.map((item) => {
                          const isCurrent = location.pathname === item.href
                          
                          // Check if user has access to this navigation item
                          let hasAccess = true
                          if (item.permission) {
                            hasAccess = hasPermission(item.permission)
                          } else if (item.resource) {
                            hasAccess = canAccess(item.resource)
                          }

                          if (!hasAccess) {
                            return null
                          }

                          return (
                            <li key={item.name}>
                              <Link
                                to={item.href}
                                onClick={onClose}
                                className={`${
                                  isCurrent
                                    ? 'bg-sukut-50 text-sukut-700'
                                    : 'text-gray-700 hover:text-sukut-700 hover:bg-gray-50'
                                } group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold`}
                              >
                                <item.icon
                                  className={`${
                                    isCurrent ? 'text-sukut-700' : 'text-gray-400 group-hover:text-sukut-700'
                                  } h-6 w-6 shrink-0`}
                                />
                                {item.name}
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    </li>

                    <li className="mt-auto">
                      {/* Role Switcher */}
                      <div className="mb-6">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                          Current Role
                        </p>
                        <RoleSwitcher />
                      </div>

                      {/* Fiscal Year Selector */}
                      <div className="mb-6">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                          Fiscal Year
                        </p>
                        <FiscalYearSelector />
                      </div>

                      {/* User info */}
                      <div className="flex items-center gap-x-4 py-3 text-sm font-semibold leading-6 text-gray-900">
                        <div className="h-8 w-8 rounded-full bg-gray-300" />
                        <span className="sr-only">Your profile</span>
                        <span>{user?.name || user?.email}</span>
                      </div>
                    </li>
                  </ul>
                </nav>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}