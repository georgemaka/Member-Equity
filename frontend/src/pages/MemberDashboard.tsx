import { useState } from 'react'
import { useMockAuth } from '@/contexts/MockAuthContext'
import { useMockMembersData } from '@/hooks/useMockMembersData'
import { useMockDistributionsData } from '@/hooks/useMockDistributionsData'
import { useMockTaxPaymentsData } from '@/hooks/useMockTaxPaymentsData'
import PageContainer from '@/components/PageContainer'
import { 
  ChartPieIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  DocumentTextIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

export default function MemberDashboard() {
  const [currentYear] = useState(2024)
  
  // Get member data (in real app, would filter by user.memberId)
  const { data: membersData } = useMockMembersData(1, 100)
  const { data: distributionsData } = useMockDistributionsData()
  const { data: taxData } = useMockTaxPaymentsData()

  // Find current member's data
  const currentMember = membersData?.data?.[0] // Mock - would use user.memberId to find actual member

  // Filter data for current member
  const memberDistributions = distributionsData?.distributions?.filter((d: any) => 
    d.distributions.some((dist: any) => dist.memberId === currentMember?.id)
  ).slice(0, 5) || []

  const memberTaxPayments = taxData?.taxPayments?.filter((t: any) => t.memberId === currentMember?.id) || []

  if (!currentMember) {
    return (
      <PageContainer fullWidth>
        <div className="text-center py-12">
          <InformationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Member Profile Not Found</h3>
          <p className="text-sm text-gray-500">
            Unable to locate your member profile. Please contact an administrator.
          </p>
        </div>
      </PageContainer>
    )
  }

  const currentEquity = currentMember.currentEquity
  const estimatedValue = (currentEquity?.estimatedPercentage || 0) * 1000000 // Mock company value

  return (
    <PageContainer fullWidth>
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-sukut-600 via-sukut-700 to-sukut-800 px-6 py-8 mb-8">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex-auto">
              <h1 className="text-3xl font-bold text-white">
                Welcome, {currentMember.firstName}
              </h1>
              <p className="mt-2 text-sukut-100">
                Your personal equity dashboard for fiscal year {currentYear}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Info Card */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-500">Full Name</label>
            <p className="text-lg text-gray-900">{currentMember.firstName} {currentMember.lastName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="text-lg text-gray-900">{currentMember.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Job Title</label>
            <p className="text-lg text-gray-900">{currentMember.jobTitle || 'Not specified'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Member Since</label>
            <p className="text-lg text-gray-900">{new Date(currentMember.joinDate).toLocaleDateString()}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Current Status</label>
            <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${
              currentMember.currentStatus?.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {currentMember.currentStatus?.status || 'Active'}
            </span>
          </div>
        </div>
      </div>

      {/* Equity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Equity Percentage */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <ChartPieIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="ml-4 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Estimated Equity %</dt>
                <dd className="text-2xl font-bold text-gray-900">
                  {(currentEquity?.estimatedPercentage || 0).toFixed(3)}%
                </dd>
              </dl>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(currentEquity?.estimatedPercentage || 0, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Estimated Value */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <CurrencyDollarIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="ml-4 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Estimated Value</dt>
                <dd className="text-2xl font-bold text-gray-900">
                  ${estimatedValue.toLocaleString()}
                </dd>
              </dl>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Based on estimated company valuation
          </p>
        </div>

        {/* Capital Account */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">$</span>
              </div>
            </div>
            <div className="ml-4 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Capital Balance</dt>
                <dd className="text-2xl font-bold text-gray-900">
                  ${(currentEquity?.capitalBalance || 0).toLocaleString()}
                </dd>
              </dl>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Current capital account balance
          </p>
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Distributions */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Distributions</h3>
            <BanknotesIcon className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {memberDistributions.length > 0 ? (
              memberDistributions.map((dist: any) => {
                const memberDist = dist.distributions.find((d: any) => d.memberId === currentMember?.id)
                return (
                  <div key={dist.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{dist.distributionName}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <span>{dist.type.charAt(0).toUpperCase() + dist.type.slice(1)} Distribution</span>
                        <span className="mx-1">•</span>
                        <span>{new Date(dist.distributionDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ${memberDist?.distributionAmount.toLocaleString() || '0'}
                      </p>
                      <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                        dist.status === 'completed' ? 'bg-green-100 text-green-600' :
                        dist.status === 'processing' ? 'bg-blue-100 text-blue-600' :
                        dist.status === 'approved' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {dist.status}
                      </span>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No distributions found</p>
            )}
          </div>
        </div>

        {/* Tax Information */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tax Information</h3>
            <DocumentTextIcon className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {memberTaxPayments.length > 0 ? (
              memberTaxPayments.slice(0, 4).map((tax: any) => (
                <div key={tax.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {tax.paymentType.charAt(0).toUpperCase() + tax.paymentType.slice(1)} Tax
                    </p>
                    <p className="text-xs text-gray-500">FY {tax.fiscalYear}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ${tax.totalDue.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Paid: ${tax.totalPaid.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No tax information available</p>
            )}
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-1 mr-3" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-2">Important Information</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Equity percentages are estimates and subject to board approval</li>
              <li>• Final equity calculations are performed at year-end</li>
              <li>• Contact administration for questions about your equity or distributions</li>
              <li>• Tax information is preliminary and subject to final K-1 statements</li>
            </ul>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}