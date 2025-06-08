import { useState } from 'react'
import { Member } from '@/types/member'
import { useToast } from '@/contexts/ToastContext'
import {
  ScaleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

interface EquityCalculations {
  totalEquityAllocated: number
  totalCapitalAccounts: number
  averageEquityPerMember: number
  equityConcentration: {
    top10Percent: number
    top25Percent: number
    giniCoefficient: number
  }
  reconciledWithBalanceSheet: boolean
  reconciliationVariance: number
  yearOverYearChange: number
}

interface EquityReconciliationProps {
  calculations: EquityCalculations
  members: Member[]
  fiscalYear: number
}

interface BalanceSheetData {
  totalEquity: number
  retainedEarnings: number
  additionalPaidInCapital: number
  memberCapitalAccounts: number
  lastUpdated: string
}

interface ReconciliationItem {
  id: string
  description: string
  systemAmount: number
  balanceSheetAmount: number
  variance: number
  status: 'matched' | 'variance' | 'missing'
  notes?: string
}

export default function EquityReconciliation({ calculations, members, fiscalYear }: EquityReconciliationProps) {
  const { success, error: showError } = useToast()
  const [isReconciling, setIsReconciling] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'details' | 'adjustments'>('overview')

  // Mock balance sheet data
  const balanceSheetData: BalanceSheetData = {
    totalEquity: 12750000,
    retainedEarnings: 2500000,
    additionalPaidInCapital: 1000000,
    memberCapitalAccounts: 12750000,
    lastUpdated: '2024-12-31'
  }

  // Reconciliation items
  const reconciliationItems: ReconciliationItem[] = [
    {
      id: '1',
      description: 'Total Member Capital Accounts',
      systemAmount: calculations.totalCapitalAccounts,
      balanceSheetAmount: balanceSheetData.memberCapitalAccounts,
      variance: calculations.totalCapitalAccounts - balanceSheetData.memberCapitalAccounts,
      status: Math.abs(calculations.totalCapitalAccounts - balanceSheetData.memberCapitalAccounts) < 10000 ? 'matched' : 'variance'
    },
    {
      id: '2',
      description: 'Active Member Accounts',
      systemAmount: members.filter(m => m.currentStatus?.status === 'active').length,
      balanceSheetAmount: 49,
      variance: members.filter(m => m.currentStatus?.status === 'active').length - 49,
      status: 'variance',
      notes: 'Recent status change not yet reflected in balance sheet'
    },
    {
      id: '3',
      description: 'Total Equity Percentage',
      systemAmount: calculations.totalEquityAllocated,
      balanceSheetAmount: 100,
      variance: calculations.totalEquityAllocated - 100,
      status: Math.abs(calculations.totalEquityAllocated - 100) < 0.1 ? 'matched' : 'variance'
    }
  ]

  const handleReconcile = async () => {
    setIsReconciling(true)
    
    // Mock reconciliation process
    setTimeout(() => {
      setIsReconciling(false)
      success('Reconciliation Complete', 'Balance sheet reconciliation has been updated')
    }, 2000)
  }

  const handleExportReconciliation = () => {
    // Create reconciliation report
    const reportData = [
      ['Reconciliation Report', `FY ${fiscalYear}`, '', ''],
      ['Generated', new Date().toLocaleDateString(), '', ''],
      ['', '', '', ''],
      ['Description', 'System Amount', 'Balance Sheet', 'Variance'],
      ...reconciliationItems.map(item => [
        item.description,
        item.systemAmount.toLocaleString(),
        item.balanceSheetAmount.toLocaleString(),
        item.variance.toLocaleString()
      ])
    ]

    const csvContent = reportData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `equity-reconciliation-fy${fiscalYear}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    success('Export Complete', 'Reconciliation report downloaded successfully')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'matched':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'variance':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      case 'missing':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'matched':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'variance':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'missing':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <ScaleIcon className="h-8 w-8 text-indigo-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Balance Sheet Reconciliation</h2>
            <p className="text-sm text-gray-600">FY {fiscalYear} • Last updated: {balanceSheetData.lastUpdated}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportReconciliation}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            <DocumentTextIcon className="h-4 w-4 mr-2 inline" />
            Export Report
          </button>
          <button
            onClick={handleReconcile}
            disabled={isReconciling}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors duration-200"
          >
            {isReconciling ? (
              <div className="flex items-center">
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                Reconciling...
              </div>
            ) : (
              <div className="flex items-center">
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Reconcile Now
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        {[
          { key: 'overview', label: 'Overview', icon: ChartBarIcon },
          { key: 'details', label: 'Details', icon: DocumentTextIcon },
          { key: 'adjustments', label: 'Adjustments', icon: ScaleIcon }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedTab(tab.key as any)}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
              selectedTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <tab.icon className="h-4 w-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-lg">
              <div className="flex items-center">
                <CurrencyDollarIcon className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    ${(calculations.totalCapitalAccounts / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-sm text-gray-500">System Total</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-lg">
              <div className="flex items-center">
                <DocumentTextIcon className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    ${(balanceSheetData.memberCapitalAccounts / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-sm text-gray-500">Balance Sheet</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-lg">
              <div className="flex items-center">
                <ScaleIcon className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <div className={`text-2xl font-bold ${
                    Math.abs(calculations.reconciliationVariance) < 10000 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${Math.abs(calculations.reconciliationVariance).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">Variance</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-lg">
              <div className="flex items-center">
                {calculations.reconciledWithBalanceSheet ? (
                  <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
                ) : (
                  <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600 mr-3" />
                )}
                <div>
                  <div className={`text-lg font-bold ${
                    calculations.reconciledWithBalanceSheet ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {calculations.reconciledWithBalanceSheet ? 'Reconciled' : 'Variance'}
                  </div>
                  <div className="text-sm text-gray-500">Status</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Summary */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reconciliation Summary</h3>
            <div className="space-y-3">
              {reconciliationItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    {getStatusIcon(item.status)}
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{item.description}</div>
                      {item.notes && (
                        <div className="text-xs text-gray-500">{item.notes}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      Variance: {typeof item.variance === 'number' ? 
                        (item.description.includes('Percentage') ? 
                          `${item.variance.toFixed(2)}%` : 
                          item.variance.toLocaleString()) : 
                        item.variance}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(item.status)}`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Details Tab */}
      {selectedTab === 'details' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Detailed Reconciliation</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    System Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance Sheet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reconciliationItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {typeof item.systemAmount === 'number' ? item.systemAmount.toLocaleString() : item.systemAmount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {typeof item.balanceSheetAmount === 'number' ? item.balanceSheetAmount.toLocaleString() : item.balanceSheetAmount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {typeof item.variance === 'number' ? item.variance.toLocaleString() : item.variance}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjustments Tab */}
      {selectedTab === 'adjustments' && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reconciliation Adjustments</h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Automated Adjustments Available</h4>
              <p className="text-sm text-blue-700 mb-3">
                The system can automatically reconcile minor variances and sync with the balance sheet.
              </p>
              <button
                onClick={handleReconcile}
                disabled={isReconciling}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Apply Auto-Adjustments
              </button>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Manual Review Required</h4>
              <p className="text-sm text-gray-600">
                Some variances require manual review and approval before reconciliation can be completed.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}