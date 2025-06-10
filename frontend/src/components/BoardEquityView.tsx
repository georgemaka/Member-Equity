import { useState, useEffect } from 'react'
import { Member, BulkEquityUpdateDto } from '@/types/member'
import { useFiscalYear } from '@/contexts/FiscalYearContext'
import { useToast } from '@/contexts/ToastContext'
import { useMockMembersData } from '@/hooks/useMockMembersData'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { 
  PencilIcon, 
  CheckIcon,
  XMarkIcon,
  UsersIcon
} from '@heroicons/react/24/outline'

interface BoardEquityViewProps {
  isOpen: boolean
  onClose: () => void
}

interface MemberEquityUpdate {
  memberId: string
  estimatedPercentage: number
  finalPercentage: number
  capitalBalance: number
  isEditing: boolean
  hasChanges: boolean
}

export default function BoardEquityView({ isOpen, onClose }: BoardEquityViewProps) {
  const { currentFiscalYear } = useFiscalYear()
  const { success, error: showError } = useToast()
  
  const [memberUpdates, setMemberUpdates] = useState<Record<string, MemberEquityUpdate>>({})
  const [bulkUpdateReason, setBulkUpdateReason] = useState('')

  // Use mock data instead of API call
  const { data: membersData, isLoading } = useMockMembersData(1, 100)

  // Add ESC key handling
  useEscapeKey(onClose, isOpen)

  // Mock bulk update function
  const submitBulkUpdate = async (_data: BulkEquityUpdateDto) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      success('Equity Updated', 'Member equity percentages updated successfully')
      resetUpdates()
    } catch (error) {
      showError('Update Failed', 'Failed to update member equity')
    }
  }

  useEffect(() => {
    if (membersData?.data) {
      const updates: Record<string, MemberEquityUpdate> = {}
      membersData.data.forEach((member: Member) => {
        if (member.currentEquity) {
          updates[member.id] = {
            memberId: member.id,
            estimatedPercentage: member.currentEquity.estimatedPercentage,
            finalPercentage: member.currentEquity.finalPercentage || member.currentEquity.estimatedPercentage,
            capitalBalance: member.currentEquity.capitalBalance,
            isEditing: false,
            hasChanges: false
          }
        }
      })
      setMemberUpdates(updates)
    }
  }, [membersData])

  const updateMemberEquity = (memberId: string, field: keyof MemberEquityUpdate, value: number) => {
    setMemberUpdates(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [field]: value,
        hasChanges: true
      }
    }))
  }

  const toggleEdit = (memberId: string) => {
    setMemberUpdates(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        isEditing: !prev[memberId].isEditing
      }
    }))
  }

  const resetMemberChanges = (memberId: string) => {
    const member = membersData?.data.find((m: Member) => m.id === memberId)
    if (member?.currentEquity) {
      setMemberUpdates(prev => ({
        ...prev,
        [memberId]: {
          ...prev[memberId],
          estimatedPercentage: member.currentEquity!.estimatedPercentage,
          finalPercentage: member.currentEquity!.finalPercentage || member.currentEquity!.estimatedPercentage,
          capitalBalance: member.currentEquity!.capitalBalance,
          isEditing: false,
          hasChanges: false
        }
      }))
    }
  }

  const resetUpdates = () => {
    setMemberUpdates({})
    setBulkUpdateReason('')
  }

  const hasAnyChanges = Object.values(memberUpdates).some(update => update.hasChanges)
  const totalEstimated = Object.values(memberUpdates).reduce((sum, update) => sum + update.estimatedPercentage, 0)
  const totalFinal = Object.values(memberUpdates).reduce((sum, update) => sum + update.finalPercentage, 0)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-sukut-600 to-sukut-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <UsersIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Board Meeting - Equity Review</h3>
              <p className="text-sukut-100">FY {currentFiscalYear} Member Equity Percentages</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors duration-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Summary Bar */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{totalEstimated.toFixed(2)}%</div>
              <div className="text-sm text-gray-500">Total Estimated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{totalFinal.toFixed(2)}%</div>
              <div className="text-sm text-gray-500">Total Final</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${hasAnyChanges ? 'text-orange-600' : 'text-green-600'}`}>
                {Object.values(memberUpdates).filter(u => u.hasChanges).length}
              </div>
              <div className="text-sm text-gray-500">Pending Changes</div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sukut-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading member data...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Title
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
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {membersData?.data?.map((member: Member) => {
                      const update = memberUpdates[member.id]
                      if (!update) return null

                      return (
                        <tr key={member.id} className={`${update.hasChanges ? 'bg-orange-50' : 'hover:bg-gray-50'}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {member.firstName} {member.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{member.email}</div>
                              </div>
                              {update.hasChanges && (
                                <div className="ml-2">
                                  <PencilIcon className="h-4 w-4 text-orange-500" />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {member.jobTitle || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {update.isEditing ? (
                              <input
                                type="number"
                                step="0.0001"
                                min="0"
                                max="100"
                                value={update.estimatedPercentage}
                                onChange={(e) => updateMemberEquity(member.id, 'estimatedPercentage', parseFloat(e.target.value) || 0)}
                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-sukut-500"
                              />
                            ) : (
                              <span className="text-sm text-gray-900">{update.estimatedPercentage}%</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {update.isEditing ? (
                              <input
                                type="number"
                                step="0.0001"
                                min="0"
                                max="100"
                                value={update.finalPercentage}
                                onChange={(e) => updateMemberEquity(member.id, 'finalPercentage', parseFloat(e.target.value) || 0)}
                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-sukut-500"
                              />
                            ) : (
                              <span className="text-sm text-gray-900">{update.finalPercentage}%</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {update.isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={update.capitalBalance}
                                onChange={(e) => updateMemberEquity(member.id, 'capitalBalance', parseFloat(e.target.value) || 0)}
                                className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-sukut-500"
                              />
                            ) : (
                              <span className="text-sm text-gray-900">${update.capitalBalance.toLocaleString()}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              member.currentEquity?.isFinalized
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {member.currentEquity?.isFinalized ? 'Finalized' : 'Draft'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex space-x-2">
                              {update.isEditing ? (
                                <>
                                  <button
                                    onClick={() => toggleEdit(member.id)}
                                    className="p-1 text-green-600 hover:text-green-700"
                                    title="Save changes"
                                  >
                                    <CheckIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => resetMemberChanges(member.id)}
                                    className="p-1 text-gray-600 hover:text-gray-700"
                                    title="Cancel changes"
                                  >
                                    <XMarkIcon className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => toggleEdit(member.id)}
                                  className="p-1 text-sukut-600 hover:text-sukut-700"
                                  title="Edit equity"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bulk Update Section */}
              {hasAnyChanges && (
                <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h4 className="text-lg font-medium text-orange-800 mb-3">Save Changes</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason for equity changes *
                      </label>
                      <textarea
                        value={bulkUpdateReason}
                        onChange={(e) => setBulkUpdateReason(e.target.value)}
                        placeholder="e.g., Board meeting FY 2024 final equity allocation"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sukut-500"
                        rows={2}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={resetUpdates}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Cancel All Changes
                      </button>
                      <button
                        onClick={() => submitBulkUpdate({
                          updates: Object.values(memberUpdates)
                            .filter(u => u.hasChanges)
                            .map(u => ({
                              memberId: u.memberId,
                              estimatedPercentage: u.estimatedPercentage,
                              finalPercentage: u.finalPercentage,
                              capitalBalance: u.capitalBalance
                            })),
                          reason: bulkUpdateReason,
                          fiscalYear: currentFiscalYear
                        })}
                        disabled={!bulkUpdateReason.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-sukut-600 border border-transparent rounded-md hover:bg-sukut-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Save {Object.values(memberUpdates).filter(u => u.hasChanges).length} Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}