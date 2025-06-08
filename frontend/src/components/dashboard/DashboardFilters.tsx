import { useState } from 'react'
import { DashboardFilters, DashboardGroupBy } from '@/types/dashboard'
import { MemberStatus } from '@/types/member'
import { useFiscalYear } from '@/contexts/FiscalYearContext'
import {
  FunnelIcon,
  XMarkIcon,
  CalendarDaysIcon,
  UsersIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

interface DashboardFiltersProps {
  filters: DashboardFilters
  onFiltersChange: (filters: DashboardFilters) => void
  onReset: () => void
  isOpen: boolean
  onToggle: () => void
}

const groupByOptions = [
  { value: 'none', label: 'No Grouping' },
  { value: 'position', label: 'Job Title/Position' },
  { value: 'equity_range', label: 'Equity Percentage Range' },
  { value: 'years_of_service', label: 'Years of Service' },
  { value: 'member_status', label: 'Member Status' },
  { value: 'join_date_cohort', label: 'Join Date Cohort' },
  { value: 'hire_date_cohort', label: 'Hire Date Cohort' },
  { value: 'capital_account_size', label: 'Capital Account Size' },
  { value: 'tax_payment_frequency', label: 'Tax Payment Frequency' },
] as const

const statusOptions: MemberStatus[] = [
  'active', 'retired', 'resigned', 'terminated', 'deceased', 'suspended', 'probationary'
]

const equityRangeOptions = [
  { value: 'small', label: 'Small Holders (<1%)' },
  { value: 'medium', label: 'Medium Holders (1-5%)' },
  { value: 'large', label: 'Large Holders (>5%)' },
]

const serviceYearOptions = [
  { value: 'new', label: 'New (0-2 years)' },
  { value: 'experienced', label: 'Experienced (3-5 years)' },
  { value: 'veteran', label: 'Veteran (5+ years)' },
]

export default function DashboardFiltersPanel({ 
  filters, 
  onFiltersChange, 
  onReset, 
  isOpen, 
  onToggle 
}: DashboardFiltersProps) {
  const { currentFiscalYear } = useFiscalYear()
  const [tempFilters, setTempFilters] = useState<DashboardFilters>(filters)

  const handleApplyFilters = () => {
    onFiltersChange(tempFilters)
    onToggle()
  }

  const handleReset = () => {
    const defaultFilters: DashboardFilters = {
      fiscalYears: [currentFiscalYear],
      groupBy: 'none'
    }
    setTempFilters(defaultFilters)
    onReset()
    onToggle()
  }

  const updateTempFilters = (updates: Partial<DashboardFilters>) => {
    setTempFilters(prev => ({ ...prev, ...updates }))
  }

  const toggleFiscalYear = (year: number) => {
    const years = tempFilters.fiscalYears.includes(year)
      ? tempFilters.fiscalYears.filter(y => y !== year)
      : [...tempFilters.fiscalYears, year].sort((a, b) => b - a)
    
    updateTempFilters({ fiscalYears: years })
  }

  const toggleStatus = (status: MemberStatus) => {
    const statuses = tempFilters.memberStatuses || []
    const newStatuses = statuses.includes(status)
      ? statuses.filter(s => s !== status)
      : [...statuses, status]
    
    updateTempFilters({ 
      memberStatuses: newStatuses.length > 0 ? newStatuses : undefined 
    })
  }

  const toggleEquityRange = (range: string) => {
    const ranges = tempFilters.equityRanges || []
    const newRanges = ranges.includes(range as any)
      ? ranges.filter(r => r !== range)
      : [...ranges, range as any]
    
    updateTempFilters({ 
      equityRanges: newRanges.length > 0 ? newRanges : undefined 
    })
  }

  const toggleServiceRange = (range: string) => {
    const ranges = tempFilters.serviceYearRanges || []
    const newRanges = ranges.includes(range as any)
      ? ranges.filter(r => r !== range)
      : [...ranges, range as any]
    
    updateTempFilters({ 
      serviceYearRanges: newRanges.length > 0 ? newRanges : undefined 
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <FunnelIcon className="h-6 w-6 text-gray-500 mr-2" />
            <h3 className="text-xl font-semibold text-gray-900">Dashboard Filters</h3>
          </div>
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Fiscal Years */}
          <div>
            <div className="flex items-center mb-4">
              <CalendarDaysIcon className="h-5 w-5 text-gray-500 mr-2" />
              <h4 className="text-lg font-medium text-gray-900">Fiscal Years</h4>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: 6 }, (_, i) => currentFiscalYear - i).map(year => (
                <label key={year} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={tempFilters.fiscalYears.includes(year)}
                    onChange={() => toggleFiscalYear(year)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">FY {year}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Group By */}
          <div>
            <div className="flex items-center mb-4">
              <ChartBarIcon className="h-5 w-5 text-gray-500 mr-2" />
              <h4 className="text-lg font-medium text-gray-900">Group By</h4>
            </div>
            <select
              value={tempFilters.groupBy}
              onChange={(e) => updateTempFilters({ groupBy: e.target.value as DashboardGroupBy })}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {groupByOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Member Status */}
          <div>
            <div className="flex items-center mb-4">
              <UsersIcon className="h-5 w-5 text-gray-500 mr-2" />
              <h4 className="text-lg font-medium text-gray-900">Member Status</h4>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {statusOptions.map(status => (
                <label key={status} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={tempFilters.memberStatuses?.includes(status) || false}
                    onChange={() => toggleStatus(status)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">{status}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Equity Ranges */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Equity Percentage Ranges</h4>
            <div className="space-y-2">
              {equityRangeOptions.map(option => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={tempFilters.equityRanges?.includes(option.value as any) || false}
                    onChange={() => toggleEquityRange(option.value)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Years of Service */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Years of Service</h4>
            <div className="space-y-2">
              {serviceYearOptions.map(option => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={tempFilters.serviceYearRanges?.includes(option.value as any) || false}
                    onChange={() => toggleServiceRange(option.value)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Ranges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Join Date Range */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Join Date Range</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                  <input
                    type="date"
                    value={tempFilters.joinDateRange?.from || ''}
                    onChange={(e) => updateTempFilters({
                      joinDateRange: {
                        from: e.target.value,
                        to: tempFilters.joinDateRange?.to || ''
                      }
                    })}
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <input
                    type="date"
                    value={tempFilters.joinDateRange?.to || ''}
                    onChange={(e) => updateTempFilters({
                      joinDateRange: {
                        from: tempFilters.joinDateRange?.from || '',
                        to: e.target.value
                      }
                    })}
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Hire Date Range */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Hire Date Range</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                  <input
                    type="date"
                    value={tempFilters.hireDateRange?.from || ''}
                    onChange={(e) => updateTempFilters({
                      hireDateRange: {
                        from: e.target.value,
                        to: tempFilters.hireDateRange?.to || ''
                      }
                    })}
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <input
                    type="date"
                    value={tempFilters.hireDateRange?.to || ''}
                    onChange={(e) => updateTempFilters({
                      hireDateRange: {
                        from: tempFilters.hireDateRange?.from || '',
                        to: e.target.value
                      }
                    })}
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            Reset All
          </button>
          <div className="space-x-3">
            <button
              onClick={onToggle}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}