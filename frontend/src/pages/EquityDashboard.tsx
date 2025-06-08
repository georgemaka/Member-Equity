import { useState, useMemo } from 'react'
import { useFiscalYear } from '@/contexts/FiscalYearContext'
import { useMockMembersData } from '@/hooks/useMockMembersData'
import { useToast } from '@/contexts/ToastContext'
import EquityDistributionChart from '@/components/equity/EquityDistributionChart'
import EquityTrendChart from '@/components/equity/EquityTrendChart'
import EquityReconciliation from '@/components/equity/EquityReconciliation'
import EquityScenarioModeler from '@/components/equity/EquityScenarioModeler'
import EquityMetrics from '@/components/equity/EquityMetrics'
import EquityQuickActions from '@/components/equity/EquityQuickActions'
import {
  ChartPieIcon,
  ChartBarIcon,
  CalculatorIcon,
  CurrencyDollarIcon,
  ScaleIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
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

export default function EquityDashboard() {
  const { currentFiscalYear, setCurrentFiscalYear } = useFiscalYear()
  const { data: membersData } = useMockMembersData(1, 100) // Get all members
  const { success } = useToast()
  
  const [selectedYear, setSelectedYear] = useState(currentFiscalYear)
  const [comparisonYear, setComparisonYear] = useState(currentFiscalYear - 1)
  const [viewMode, setViewMode] = useState<'overview' | 'reconciliation' | 'scenarios' | 'trends'>('overview')

  // Calculate equity metrics
  const equityCalculations = useMemo<EquityCalculations>(() => {
    if (!membersData?.members) {
      return {
        totalEquityAllocated: 0,
        totalCapitalAccounts: 0,
        averageEquityPerMember: 0,
        equityConcentration: { top10Percent: 0, top25Percent: 0, giniCoefficient: 0 },
        reconciledWithBalanceSheet: false,
        reconciliationVariance: 0,
        yearOverYearChange: 0
      }
    }

    const activeMembers = membersData.members.filter(m => m.currentStatus?.status === 'active')
    const totalEquity = activeMembers.reduce((sum, m) => sum + (m.currentEquity?.finalPercentage || m.currentEquity?.estimatedPercentage || 0), 0)
    const totalCapital = activeMembers.reduce((sum, m) => sum + (m.currentEquity?.capitalBalance || 0), 0)
    
    // Sort by equity percentage for concentration analysis
    const sortedByEquity = [...activeMembers].sort((a, b) => 
      (b.currentEquity?.finalPercentage || b.currentEquity?.estimatedPercentage || 0) - 
      (a.currentEquity?.finalPercentage || a.currentEquity?.estimatedPercentage || 0)
    )
    
    const top10Count = Math.ceil(activeMembers.length * 0.1)
    const top25Count = Math.ceil(activeMembers.length * 0.25)
    
    const top10Equity = sortedByEquity.slice(0, top10Count).reduce((sum, m) => 
      sum + (m.currentEquity?.finalPercentage || m.currentEquity?.estimatedPercentage || 0), 0
    )
    const top25Equity = sortedByEquity.slice(0, top25Count).reduce((sum, m) => 
      sum + (m.currentEquity?.finalPercentage || m.currentEquity?.estimatedPercentage || 0), 0
    )

    // Simple Gini coefficient calculation
    const equityValues = sortedByEquity.map(m => m.currentEquity?.finalPercentage || m.currentEquity?.estimatedPercentage || 0)
    const n = equityValues.length
    let gini = 0
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        gini += Math.abs(equityValues[i] - equityValues[j])
      }
    }
    const giniCoefficient = gini / (2 * n * n * (totalEquity / n))

    // Mock balance sheet reconciliation
    const balanceSheetEquity = 12750000 // Mock balance sheet total
    const reconciliationVariance = Math.abs(totalCapital - balanceSheetEquity)
    const reconciledWithBalanceSheet = reconciliationVariance < 10000 // Within $10k tolerance

    return {
      totalEquityAllocated: totalEquity,
      totalCapitalAccounts: totalCapital,
      averageEquityPerMember: totalEquity / activeMembers.length,
      equityConcentration: {
        top10Percent: (top10Equity / totalEquity) * 100,
        top25Percent: (top25Equity / totalEquity) * 100,
        giniCoefficient: giniCoefficient || 0
      },
      reconciledWithBalanceSheet,
      reconciliationVariance,
      yearOverYearChange: 5.2 // Mock YoY change
    }
  }, [membersData])

  const handleYearChange = (year: number) => {
    setSelectedYear(year)
    setCurrentFiscalYear(year)
  }

  const availableYears = [2025, 2024, 2023, 2022, 2021]

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-green-600 via-green-700 to-green-800 px-6 py-8 mb-8">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex-auto">
              <h1 className="text-3xl font-bold text-white">Equity Dashboard</h1>
              <p className="mt-2 text-green-100">
                Real-time equity calculations, analysis, and reconciliation for FY {selectedYear}
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(Number(e.target.value))}
                className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                {availableYears.map(year => (
                  <option key={year} value={year} className="text-gray-900">FY {year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8">
        <nav className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'overview', label: 'Overview', icon: ChartPieIcon },
            { key: 'trends', label: 'Trends', icon: ArrowTrendingUpIcon },
            { key: 'reconciliation', label: 'Reconciliation', icon: ScaleIcon },
            { key: 'scenarios', label: 'Scenarios', icon: CalculatorIcon }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setViewMode(tab.key as any)}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                viewMode === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Reconciliation Status Banner */}
      <div className={`mb-6 p-4 rounded-lg border ${
        equityCalculations.reconciledWithBalanceSheet
          ? 'bg-green-50 border-green-200'
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-center">
          {equityCalculations.reconciledWithBalanceSheet ? (
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
          ) : (
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-3" />
          )}
          <div>
            <h3 className={`font-medium ${
              equityCalculations.reconciledWithBalanceSheet ? 'text-green-900' : 'text-yellow-900'
            }`}>
              {equityCalculations.reconciledWithBalanceSheet 
                ? 'Balance Sheet Reconciled' 
                : 'Reconciliation Variance Detected'
              }
            </h3>
            <p className={`text-sm ${
              equityCalculations.reconciledWithBalanceSheet ? 'text-green-700' : 'text-yellow-700'
            }`}>
              {equityCalculations.reconciledWithBalanceSheet 
                ? 'Capital accounts match balance sheet within tolerance'
                : `Variance of $${equityCalculations.reconciliationVariance.toLocaleString()} detected`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Content based on selected view */}
      {viewMode === 'overview' && (
        <div className="space-y-8">
          {/* Key Metrics */}
          <EquityMetrics calculations={equityCalculations} members={membersData?.members || []} />
          
          {/* Quick Actions */}
          <EquityQuickActions
            onRecalculate={() => {
              // Trigger recalculation logic
              success('Recalculation Complete', 'All equity values have been updated')
            }}
          />
          
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <EquityDistributionChart members={membersData?.members || []} />
            <EquityTrendChart 
              currentYear={selectedYear} 
              comparisonYear={comparisonYear}
              onComparisonYearChange={setComparisonYear}
            />
          </div>
        </div>
      )}

      {viewMode === 'trends' && (
        <EquityTrendChart 
          currentYear={selectedYear} 
          comparisonYear={comparisonYear}
          onComparisonYearChange={setComparisonYear}
          expanded={true}
        />
      )}

      {viewMode === 'reconciliation' && (
        <EquityReconciliation 
          calculations={equityCalculations}
          members={membersData?.members || []}
          fiscalYear={selectedYear}
        />
      )}

      {viewMode === 'scenarios' && (
        <EquityScenarioModeler 
          members={membersData?.members || []}
          onScenarioSave={(scenario) => {
            console.log('Saving scenario:', scenario)
            success('Scenario Saved', 'Equity scenario has been saved successfully')
          }}
        />
      )}
    </div>
  )
}