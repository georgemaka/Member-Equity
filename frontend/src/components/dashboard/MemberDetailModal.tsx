import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/services/dashboardApi'
import { MemberDetailDashboard } from '@/types/dashboard'
import { useFiscalYear } from '@/contexts/FiscalYearContext'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import {
  XMarkIcon,
  UserIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon as XMarkIconSmall
} from '@heroicons/react/24/outline'

interface MemberDetailModalProps {
  memberId: string | null
  isOpen: boolean
  onClose: () => void
}

interface SectionProps {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  defaultExpanded?: boolean
}

function Section({ title, icon: Icon, children, defaultExpanded = true }: SectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-t-lg flex items-center justify-between transition-colors duration-150"
      >
        <div className="flex items-center">
          <Icon className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDownIcon className="h-4 w-4 text-gray-500" />
        )}
      </button>
      {isExpanded && (
        <div className="p-4 bg-white">
          {children}
        </div>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
      ))}
    </div>
  )
}

export default function MemberDetailModal({ memberId, isOpen, onClose }: MemberDetailModalProps) {
  useEscapeKey(onClose, isOpen)
  const { currentFiscalYear } = useFiscalYear()
  const [isEditing, setIsEditing] = useState(false)
  const [editedMember, setEditedMember] = useState<any>(null)

  // Use mock data for now - in production this would fetch real data
  const { data: memberDetail, isLoading, error } = useQuery<MemberDetailDashboard>({
    queryKey: ['member-detail', memberId],
    queryFn: () => {
      if (!memberId) return Promise.reject('No member ID')
      
      // Mock member detail data
      return Promise.resolve({
        member: {
          id: memberId,
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@sukut.com',
          phone: '(555) 123-4567',
          address: '123 Main Street',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          jobTitle: 'Senior Project Manager',
          joinDate: '2018-03-15',
          hireDate: '2017-01-10',
          companyId: 'sukut-1',
          createdAt: '2018-03-15T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
          isActive: true,
          currentEquity: {
            id: 'eq1',
            memberId: memberId,
            fiscalYear: currentFiscalYear,
            estimatedPercentage: 2.5,
            finalPercentage: 2.4,
            capitalBalance: 300000,
            isFinalized: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-15T00:00:00Z'
          },
          currentStatus: {
            id: 'st1',
            memberId: memberId,
            fiscalYear: currentFiscalYear,
            status: 'active',
            effectiveDate: '2024-01-01',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        },
        memberSummary: {
          member: {} as any, // Will be populated from member above
          yearsOfService: 6.8,
          currentEquityPercentage: 2.4,
          currentCapitalBalance: 300000,
          totalTaxPaymentsThisYear: 18000,
          totalDistributionsThisYear: 25000,
          recentActivity: []
        },
        equityHistory: [
          {
            fiscalYear: currentFiscalYear,
            estimatedPercentage: 2.5,
            finalPercentage: 2.4,
            capitalBalance: 300000,
            allocationAmount: 15000
          },
          {
            fiscalYear: currentFiscalYear - 1,
            estimatedPercentage: 2.2,
            finalPercentage: 2.1,
            capitalBalance: 285000,
            allocationAmount: 12000
          }
        ],
        statusHistory: [
          {
            fiscalYear: currentFiscalYear,
            status: 'active',
            effectiveDate: '2024-01-01',
            reason: 'Annual review'
          },
          {
            fiscalYear: currentFiscalYear - 1,
            status: 'active',
            effectiveDate: '2023-01-01'
          }
        ],
        taxPaymentHistory: [
          {
            id: 'tax1',
            memberId: memberId,
            fiscalYear: currentFiscalYear,
            paymentType: 'quarterly_estimated',
            amount: 4500,
            paymentDate: '2024-03-15',
            quarter: 1,
            notes: 'Q1 estimated payment',
            createdAt: '2024-03-15T00:00:00Z',
            updatedAt: '2024-03-15T00:00:00Z'
          },
          {
            id: 'tax2',
            memberId: memberId,
            fiscalYear: currentFiscalYear,
            paymentType: 'quarterly_estimated',
            amount: 4200,
            paymentDate: '2023-12-15',
            quarter: 4,
            notes: 'Q4 estimated payment',
            createdAt: '2023-12-15T00:00:00Z',
            updatedAt: '2023-12-15T00:00:00Z'
          }
        ],
        distributionHistory: [
          {
            id: 'dist1',
            fiscalYear: currentFiscalYear,
            amount: 25000,
            date: '2024-02-01',
            type: 'annual_distribution'
          }
        ],
        allocationHistory: [],
        performanceMetrics: {
          capitalGrowthRate: 8.5,
          equityProgressionRate: 0.15,
          averageAnnualAllocation: 13500,
          totalContributions: 45000
        },
        comparisonToPeers: {
          equityPercentile: 75,
          capitalPercentile: 68,
          serviceYearsPercentile: 82
        }
      } as MemberDetailDashboard)
    },
    enabled: isOpen && !!memberId,
  })

  const handleEdit = () => {
    if (memberDetail) {
      setEditedMember({ ...memberDetail.member })
      setIsEditing(true)
    }
  }

  const handleSave = () => {
    // In production, this would save to the backend
    console.log('Saving member data:', editedMember)
    setIsEditing(false)
    // Would refetch data here
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedMember(null)
  }

  const handleInputChange = (field: string, value: string) => {
    setEditedMember((prev: any) => ({
      ...prev,
      [field]: value
    }))
  }

  if (!isOpen || !memberId) return null

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
              <UserIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              {memberDetail ? (
                <>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {memberDetail.member.firstName} {memberDetail.member.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{memberDetail.member.jobTitle}</p>
                </>
              ) : (
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                >
                  <XMarkIconSmall className="h-4 w-4 mr-2" />
                  Cancel
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {isLoading && <LoadingSkeleton />}
          
          {error && (
            <div className="text-center py-8">
              <p className="text-red-600">Failed to load member details: {(error as Error).message}</p>
            </div>
          )}

          {memberDetail && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <ChartBarIcon className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <div className="text-2xl font-bold text-blue-900">
                        {memberDetail.memberSummary.currentEquityPercentage.toFixed(2)}%
                      </div>
                      <div className="text-sm text-blue-600">Current Equity</div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <div className="text-2xl font-bold text-green-900">
                        ${memberDetail.memberSummary.currentCapitalBalance.toLocaleString()}
                      </div>
                      <div className="text-sm text-green-600">Capital Balance</div>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <ClockIcon className="h-8 w-8 text-purple-600 mr-3" />
                    <div>
                      <div className="text-2xl font-bold text-purple-900">
                        {memberDetail.memberSummary.yearsOfService.toFixed(1)}
                      </div>
                      <div className="text-sm text-purple-600">Years of Service</div>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <ArrowTrendingUpIcon className="h-8 w-8 text-orange-600 mr-3" />
                    <div>
                      <div className="text-2xl font-bold text-orange-900">
                        {memberDetail.performanceMetrics.capitalGrowthRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-orange-600">Capital Growth</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Member Information */}
              <Section title="Member Information" icon={UserIcon}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">First Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedMember?.firstName || ''}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{memberDetail.member.firstName}</div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Last Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedMember?.lastName || ''}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{memberDetail.member.lastName}</div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editedMember?.email || ''}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{memberDetail.member.email}</div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editedMember?.phone || ''}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{memberDetail.member.phone || 'N/A'}</div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Job Title</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedMember?.jobTitle || ''}
                          onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{memberDetail.member.jobTitle || 'N/A'}</div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Join Date</label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editedMember?.joinDate?.split('T')[0] || ''}
                          onChange={(e) => handleInputChange('joinDate', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">
                          {new Date(memberDetail.member.joinDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Hire Date</label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editedMember?.hireDate?.split('T')[0] || ''}
                          onChange={(e) => handleInputChange('hireDate', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">
                          {memberDetail.member.hireDate ? new Date(memberDetail.member.hireDate).toLocaleDateString() : 'N/A'}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Address</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedMember?.address || ''}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Street Address"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">
                          {memberDetail.member.address || 'N/A'}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-sm font-medium text-gray-500">City</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedMember?.city || ''}
                            onChange={(e) => handleInputChange('city', e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        ) : (
                          <div className="text-sm text-gray-900">{memberDetail.member.city || 'N/A'}</div>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">State</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedMember?.state || ''}
                            onChange={(e) => handleInputChange('state', e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        ) : (
                          <div className="text-sm text-gray-900">{memberDetail.member.state || 'N/A'}</div>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Zip Code</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedMember?.zipCode || ''}
                            onChange={(e) => handleInputChange('zipCode', e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        ) : (
                          <div className="text-sm text-gray-900">{memberDetail.member.zipCode || 'N/A'}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Section>

              {/* Equity History */}
              <Section title="Equity History" icon={ChartBarIcon}>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fiscal Year
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estimated %
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Final %
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Capital Balance
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Allocation
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {memberDetail.equityHistory.map((equity) => (
                        <tr key={equity.fiscalYear} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            FY {equity.fiscalYear}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {equity.estimatedPercentage.toFixed(2)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {equity.finalPercentage ? `${equity.finalPercentage.toFixed(2)}%` : 'Pending'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${equity.capitalBalance.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {equity.allocationAmount ? `$${equity.allocationAmount.toLocaleString()}` : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>

              {/* Status History */}
              <Section title="Status History" icon={CalendarDaysIcon}>
                <div className="space-y-3">
                  {memberDetail.statusHistory.map((status) => (
                    <div key={`${status.fiscalYear}-${status.effectiveDate}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          status.status === 'active' ? 'bg-green-100 text-green-800' :
                          status.status === 'retired' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                        </span>
                        <span className="ml-3 text-sm text-gray-900">FY {status.fiscalYear}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(status.effectiveDate).toLocaleDateString()}
                        {status.reason && ` • ${status.reason}`}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Tax Payments */}
              <Section title="Tax Payment History" icon={BanknotesIcon}>
                <div className="space-y-3">
                  {memberDetail.taxPaymentHistory.slice(0, 5).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{payment.paymentType.replace('_', ' ')}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(payment.paymentDate).toLocaleDateString()}
                          {payment.quarter && ` • Q${payment.quarter}`}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        ${payment.amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                  {memberDetail.taxPaymentHistory.length > 5 && (
                    <div className="text-sm text-gray-500 text-center">
                      And {memberDetail.taxPaymentHistory.length - 5} more payments...
                    </div>
                  )}
                </div>
              </Section>

              {/* Performance Metrics */}
              <Section title="Performance Metrics" icon={ArrowTrendingUpIcon}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Capital Growth Rate</label>
                      <div className="text-lg font-semibold text-gray-900">
                        {memberDetail.performanceMetrics.capitalGrowthRate.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Equity Progression Rate</label>
                      <div className="text-lg font-semibold text-gray-900">
                        {memberDetail.performanceMetrics.equityProgressionRate.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Average Annual Allocation</label>
                      <div className="text-lg font-semibold text-gray-900">
                        ${memberDetail.performanceMetrics.averageAnnualAllocation.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Total Contributions</label>
                      <div className="text-lg font-semibold text-gray-900">
                        ${memberDetail.performanceMetrics.totalContributions.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </Section>

              {/* Peer Comparison */}
              <Section title="Peer Comparison" icon={DocumentTextIcon}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-900">
                      {memberDetail.comparisonToPeers.equityPercentile}%
                    </div>
                    <div className="text-sm text-blue-600">Equity Percentile</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-900">
                      {memberDetail.comparisonToPeers.capitalPercentile}%
                    </div>
                    <div className="text-sm text-green-600">Capital Percentile</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-900">
                      {memberDetail.comparisonToPeers.serviceYearsPercentile}%
                    </div>
                    <div className="text-sm text-purple-600">Service Years Percentile</div>
                  </div>
                </div>
              </Section>
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}