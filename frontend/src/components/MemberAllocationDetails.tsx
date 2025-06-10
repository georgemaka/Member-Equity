import { useMockMemberAllocations } from '@/hooks/useMockFinancialsData'
import { useFiscalYear } from '@/contexts/FiscalYearContext'
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  ScaleIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

interface MemberAllocationDetailsProps {
  memberId: string
  memberName?: string
  showTitle?: boolean
  compact?: boolean
}

export default function MemberAllocationDetails({ 
  memberId, 
  memberName,
  showTitle = true,
  compact = false 
}: MemberAllocationDetailsProps) {
  const { currentFiscalYear } = useFiscalYear()
  const { data: allocations, isLoading } = useMockMemberAllocations(currentFiscalYear, memberId)
  
  const currentAllocation = allocations?.[0]

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  if (!currentAllocation) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-gray-500">No allocation data available for FY {currentFiscalYear}</p>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {showTitle && (
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            FY {currentFiscalYear} Allocation
          </h3>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-lg font-bold text-blue-600">
              ${currentAllocation.balanceIncentiveReturn.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Balance Incentive Return</div>
            <div className="text-xs text-blue-400">
              {currentAllocation.effectiveReturnRate.toFixed(2)}% of ${currentAllocation.beginningCapitalBalance.toLocaleString()}
            </div>
          </div>
          
          <div>
            <div className="text-lg font-bold text-purple-600">
              ${currentAllocation.equityBasedAllocation.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Equity-Based Allocation</div>
            <div className="text-xs text-purple-400">
              {currentAllocation.equityPercentage.toFixed(2)}% equity share
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total Allocation:</span>
            <span className="text-lg font-bold text-green-600">
              ${currentAllocation.allocationAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {showTitle && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {memberName ? `${memberName}'s ` : ''}FY {currentFiscalYear} Allocation Details
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Member allocation breakdown based on balance incentive and equity ownership
          </p>
        </div>
      )}

      {/* Allocation Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-900">
                ${currentAllocation.balanceIncentiveReturn.toLocaleString()}
              </div>
              <div className="text-sm text-blue-700">Balance Incentive Return</div>
              <div className="text-xs text-blue-600 mt-1">
                {currentAllocation.effectiveReturnRate.toFixed(2)}% of balance
              </div>
            </div>
            <CurrencyDollarIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-900">
                ${currentAllocation.equityBasedAllocation.toLocaleString()}
              </div>
              <div className="text-sm text-purple-700">Equity-Based Allocation</div>
              <div className="text-xs text-purple-600 mt-1">
                {currentAllocation.equityPercentage.toFixed(2)}% equity share
              </div>
            </div>
            <ChartBarIcon className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Calculation Details */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
          <InformationCircleIcon className="h-4 w-4 mr-2" />
          Calculation Breakdown
        </h4>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Beginning Capital Balance:</span>
            <span className="text-sm font-medium text-gray-900">
              ${currentAllocation.beginningCapitalBalance.toLocaleString()}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">
              Balance Incentive Return:
              <br />
              <span className="text-xs text-blue-600">
                Min(SOFR + 5%, 10%) = {currentAllocation.effectiveReturnRate.toFixed(2)}%
              </span>
            </span>
            <span className="text-sm font-semibold text-blue-600">
              +${currentAllocation.balanceIncentiveReturn.toLocaleString()}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">
              Equity-Based Allocation:
              <br />
              <span className="text-xs text-purple-600">
                {currentAllocation.equityPercentage.toFixed(2)}% of remaining net income
              </span>
            </span>
            <span className="text-sm font-semibold text-purple-600">
              +${currentAllocation.equityBasedAllocation.toLocaleString()}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Distributions During Year:</span>
            <span className="text-sm font-medium text-red-600">
              -${currentAllocation.distributions.toLocaleString()}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-2 bg-green-50 rounded px-2">
            <span className="text-sm font-semibold text-gray-900">Ending Capital Balance:</span>
            <span className="text-lg font-bold text-green-600">
              ${currentAllocation.endingCapitalBalance.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Allocation Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">
            ${currentAllocation.allocationAmount.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Total Allocation</div>
          <div className="flex items-center justify-center mt-1">
            <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-xs text-green-600">
              {((currentAllocation.allocationAmount / currentAllocation.beginningCapitalBalance) * 100).toFixed(1)}% increase
            </span>
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">
            {currentAllocation.equityPercentage.toFixed(2)}%
          </div>
          <div className="text-sm text-gray-500">Equity Ownership</div>
          <div className="flex items-center justify-center mt-1">
            <ScaleIcon className="h-4 w-4 text-gray-500 mr-1" />
            <span className="text-xs text-gray-600">Company ownership</span>
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">
            {currentAllocation.effectiveReturnRate.toFixed(2)}%
          </div>
          <div className="text-sm text-gray-500">Effective Return Rate</div>
          <div className="flex items-center justify-center mt-1">
            <CalendarDaysIcon className="h-4 w-4 text-blue-500 mr-1" />
            <span className="text-xs text-blue-600">Annual rate on balance</span>
          </div>
        </div>
      </div>

      {/* Allocation Date */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>Allocation Date:</span>
          <span>{new Date(currentAllocation.allocationDate).toLocaleDateString()}</span>
        </div>
        {currentAllocation.notes && (
          <div className="mt-2">
            <span className="text-sm text-gray-500">Notes: </span>
            <span className="text-sm text-gray-700">{currentAllocation.notes}</span>
          </div>
        )}
      </div>
    </div>
  )
}