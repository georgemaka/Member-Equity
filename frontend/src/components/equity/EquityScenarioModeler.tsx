import { useState } from 'react'
import { Member } from '@/types/member'
import { useToast } from '@/contexts/ToastContext'
import {
  CalculatorIcon,
  PlayIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  EyeIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

interface EquityScenarioModelerProps {
  members: Member[]
  onScenarioSave: (scenario: EquityScenario) => void
}

interface EquityScenario {
  id: string
  name: string
  description: string
  changes: MemberEquityChange[]
  results: ScenarioResults
  createdAt: string
}

interface MemberEquityChange {
  memberId: string
  memberName: string
  currentEquity: number
  newEquity: number
  reason: string
}

interface ScenarioResults {
  totalEquityBefore: number
  totalEquityAfter: number
  varianceFromTarget: number
  impactedMembers: number
  averageChange: number
  giniCoefficientBefore: number
  giniCoefficientAfter: number
}

export default function EquityScenarioModeler({ members, onScenarioSave }: EquityScenarioModelerProps) {
  const { success } = useToast()
  
  const [activeScenario, setActiveScenario] = useState<EquityScenario | null>(null)
  const [scenarioName, setScenarioName] = useState('')
  const [scenarioDescription, setScenarioDescription] = useState('')
  const [memberChanges, setMemberChanges] = useState<MemberEquityChange[]>([])
  const [isCalculating, setIsCalculating] = useState(false)
  const [savedScenarios, setSavedScenarios] = useState<EquityScenario[]>([])

  const activeMembers = members.filter(m => m.currentStatus?.status === 'active')

  const addMemberChange = (member: Member) => {
    const currentEquity = member.currentEquity?.finalPercentage || member.currentEquity?.estimatedPercentage || 0
    const newChange: MemberEquityChange = {
      memberId: member.id,
      memberName: `${member.firstName} ${member.lastName}`,
      currentEquity,
      newEquity: currentEquity,
      reason: ''
    }
    setMemberChanges(prev => [...prev, newChange])
  }

  const updateMemberChange = (index: number, field: keyof MemberEquityChange, value: string | number) => {
    setMemberChanges(prev => prev.map((change, i) => 
      i === index ? { ...change, [field]: value } : change
    ))
  }

  const removeMemberChange = (index: number) => {
    setMemberChanges(prev => prev.filter((_, i) => i !== index))
  }

  const calculateScenarioResults = (): ScenarioResults => {
    const currentTotal = activeMembers.reduce((sum, m) => 
      sum + (m.currentEquity?.finalPercentage || m.currentEquity?.estimatedPercentage || 0), 0
    )

    const newTotal = currentTotal + memberChanges.reduce((sum, change) => 
      sum + (change.newEquity - change.currentEquity), 0
    )

    const averageChange = memberChanges.length > 0 
      ? memberChanges.reduce((sum, change) => sum + (change.newEquity - change.currentEquity), 0) / memberChanges.length
      : 0

    // Simple Gini coefficient calculation (before)
    const currentEquities = activeMembers.map(m => m.currentEquity?.finalPercentage || m.currentEquity?.estimatedPercentage || 0)
    const giniCoefficientBefore = calculateGini(currentEquities)

    // Gini coefficient after changes
    const newEquities = activeMembers.map(m => {
      const change = memberChanges.find(c => c.memberId === m.id)
      return change ? change.newEquity : (m.currentEquity?.finalPercentage || m.currentEquity?.estimatedPercentage || 0)
    })
    const giniCoefficientAfter = calculateGini(newEquities)

    return {
      totalEquityBefore: currentTotal,
      totalEquityAfter: newTotal,
      varianceFromTarget: newTotal - 100,
      impactedMembers: memberChanges.length,
      averageChange,
      giniCoefficientBefore,
      giniCoefficientAfter
    }
  }

  const calculateGini = (values: number[]): number => {
    if (values.length === 0) return 0
    
    const sortedValues = [...values].sort((a, b) => a - b)
    const n = sortedValues.length
    const mean = sortedValues.reduce((sum, val) => sum + val, 0) / n
    
    let gini = 0
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        gini += Math.abs(sortedValues[i] - sortedValues[j])
      }
    }
    
    return gini / (2 * n * n * mean) || 0
  }

  const runScenario = async () => {
    if (!scenarioName.trim() || memberChanges.length === 0) {
      return
    }

    setIsCalculating(true)
    
    // Simulate calculation time
    setTimeout(() => {
      const results = calculateScenarioResults()
      const newScenario: EquityScenario = {
        id: Date.now().toString(),
        name: scenarioName,
        description: scenarioDescription,
        changes: [...memberChanges],
        results,
        createdAt: new Date().toISOString()
      }

      setActiveScenario(newScenario)
      setIsCalculating(false)
      success('Scenario Calculated', 'Equity scenario has been calculated successfully')
    }, 1500)
  }

  const saveScenario = () => {
    if (activeScenario) {
      setSavedScenarios(prev => [...prev, activeScenario])
      onScenarioSave(activeScenario)
      success('Scenario Saved', 'Equity scenario has been saved successfully')
    }
  }

  const loadScenario = (scenario: EquityScenario) => {
    setScenarioName(scenario.name)
    setScenarioDescription(scenario.description)
    setMemberChanges([...scenario.changes])
    setActiveScenario(scenario)
  }

  const clearScenario = () => {
    setScenarioName('')
    setScenarioDescription('')
    setMemberChanges([])
    setActiveScenario(null)
  }

  const quickScenarios = [
    {
      name: 'Across-the-board 0.1% increase',
      action: () => {
        const changes = activeMembers.slice(0, 10).map(member => ({
          memberId: member.id,
          memberName: `${member.firstName} ${member.lastName}`,
          currentEquity: member.currentEquity?.finalPercentage || member.currentEquity?.estimatedPercentage || 0,
          newEquity: (member.currentEquity?.finalPercentage || member.currentEquity?.estimatedPercentage || 0) + 0.1,
          reason: 'Performance adjustment'
        }))
        setMemberChanges(changes)
        setScenarioName('Performance Adjustment - 0.1%')
        setScenarioDescription('Across-the-board 0.1% equity increase for top performers')
      }
    },
    {
      name: 'Rebalance top 5 members',
      action: () => {
        const topMembers = [...activeMembers]
          .sort((a, b) => 
            (b.currentEquity?.finalPercentage || b.currentEquity?.estimatedPercentage || 0) - 
            (a.currentEquity?.finalPercentage || a.currentEquity?.estimatedPercentage || 0)
          )
          .slice(0, 5)
        
        const changes = topMembers.map((member, index) => ({
          memberId: member.id,
          memberName: `${member.firstName} ${member.lastName}`,
          currentEquity: member.currentEquity?.finalPercentage || member.currentEquity?.estimatedPercentage || 0,
          newEquity: Math.max(0, (member.currentEquity?.finalPercentage || member.currentEquity?.estimatedPercentage || 0) - (index * 0.05)),
          reason: 'Equity rebalancing'
        }))
        setMemberChanges(changes)
        setScenarioName('Top 5 Rebalancing')
        setScenarioDescription('Gradual reduction in equity concentration among top members')
      }
    },
    {
      name: 'New member onboarding',
      action: () => {
        // Simulate adding equity for new members by reducing others slightly
        const changes = activeMembers.slice(0, 8).map(member => ({
          memberId: member.id,
          memberName: `${member.firstName} ${member.lastName}`,
          currentEquity: member.currentEquity?.finalPercentage || member.currentEquity?.estimatedPercentage || 0,
          newEquity: Math.max(0, (member.currentEquity?.finalPercentage || member.currentEquity?.estimatedPercentage || 0) - 0.025),
          reason: 'Dilution for new member allocation'
        }))
        setMemberChanges(changes)
        setScenarioName('New Member Onboarding')
        setScenarioDescription('Equity dilution to accommodate new member with 0.2% allocation')
      }
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <CalculatorIcon className="h-8 w-8 text-indigo-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Equity Scenario Modeler</h2>
            <p className="text-sm text-gray-600">Model potential equity changes and analyze their impact</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={clearScenario}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2 inline" />
            Clear
          </button>
          <button
            onClick={runScenario}
            disabled={isCalculating || !scenarioName.trim() || memberChanges.length === 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isCalculating ? (
              <div className="flex items-center">
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                Calculating...
              </div>
            ) : (
              <div className="flex items-center">
                <PlayIcon className="h-4 w-4 mr-2" />
                Run Scenario
              </div>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Scenario Builder */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scenario Details */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Scenario Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scenario Name</label>
                <input
                  type="text"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="e.g., Q4 2024 Performance Adjustments"
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={scenarioDescription}
                  onChange={(e) => setScenarioDescription(e.target.value)}
                  placeholder="Describe the rationale and expected outcomes..."
                  rows={3}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Quick Scenarios */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Scenarios</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {quickScenarios.map((scenario, index) => (
                <button
                  key={index}
                  onClick={scenario.action}
                  className="p-3 text-left border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors duration-200"
                >
                  <div className="text-sm font-medium text-gray-900">{scenario.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Member Changes */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Equity Changes</h3>
              <div className="flex items-center space-x-2">
                <select
                  onChange={(e) => {
                    const member = activeMembers.find(m => m.id === e.target.value)
                    if (member) addMemberChange(member)
                    e.target.value = ''
                  }}
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                  defaultValue=""
                >
                  <option value="">Add member...</option>
                  {activeMembers
                    .filter(m => !memberChanges.some(c => c.memberId === m.id))
                    .map(member => (
                      <option key={member.id} value={member.id}>
                        {member.firstName} {member.lastName}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {memberChanges.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CalculatorIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No equity changes defined. Add members to start modeling.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {memberChanges.map((change, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-medium text-gray-900">{change.memberName}</div>
                      <button
                        onClick={() => removeMemberChange(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Current %</label>
                        <div className="text-sm text-gray-900">{change.currentEquity.toFixed(2)}%</div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">New %</label>
                        <input
                          type="number"
                          step="0.01"
                          value={change.newEquity}
                          onChange={(e) => updateMemberChange(index, 'newEquity', parseFloat(e.target.value) || 0)}
                          className="block w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Change</label>
                        <div className={`text-sm font-medium ${
                          change.newEquity - change.currentEquity > 0 ? 'text-green-600' :
                          change.newEquity - change.currentEquity < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {change.newEquity - change.currentEquity > 0 ? '+' : ''}
                          {(change.newEquity - change.currentEquity).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Reason</label>
                      <input
                        type="text"
                        value={change.reason}
                        onChange={(e) => updateMemberChange(index, 'reason', e.target.value)}
                        placeholder="Reason for change..."
                        className="block w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {/* Scenario Results */}
          {activeScenario && (
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Results</h3>
                <button
                  onClick={saveScenario}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  <CheckIcon className="h-4 w-4 mr-1 inline" />
                  Save
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Before:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {activeScenario.results.totalEquityBefore.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total After:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {activeScenario.results.totalEquityAfter.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Variance from 100%:</span>
                  <span className={`text-sm font-semibold ${
                    Math.abs(activeScenario.results.varianceFromTarget) < 0.1 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {activeScenario.results.varianceFromTarget > 0 ? '+' : ''}
                    {activeScenario.results.varianceFromTarget.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Impacted Members:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {activeScenario.results.impactedMembers}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Average Change:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {activeScenario.results.averageChange > 0 ? '+' : ''}
                    {activeScenario.results.averageChange.toFixed(3)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Inequality Change:</span>
                  <span className={`text-sm font-semibold ${
                    activeScenario.results.giniCoefficientAfter < activeScenario.results.giniCoefficientBefore ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {activeScenario.results.giniCoefficientAfter < activeScenario.results.giniCoefficientBefore ? '↓' : '↑'}
                    {Math.abs(activeScenario.results.giniCoefficientAfter - activeScenario.results.giniCoefficientBefore).toFixed(3)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Saved Scenarios */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Saved Scenarios</h3>
            {savedScenarios.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <DocumentDuplicateIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No saved scenarios</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedScenarios.map((scenario) => (
                  <div key={scenario.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{scenario.name}</div>
                        <div className="text-xs text-gray-500">
                          {scenario.results.impactedMembers} changes • {scenario.results.varianceFromTarget.toFixed(2)}% variance
                        </div>
                      </div>
                      <button
                        onClick={() => loadScenario(scenario)}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}