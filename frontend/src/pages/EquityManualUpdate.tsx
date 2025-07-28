import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { memberApi } from '@/services/memberApi'
import { Member } from '@/types/member'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'

interface EquityUpdate {
  memberId: string
  currentPercentage: number
  newPercentage: number
  hasChanges: boolean
}

export default function EquityManualUpdate() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [updates, setUpdates] = useState<Record<string, EquityUpdate>>({})
  const [notes, setNotes] = useState('')

  const { data: membersData, isLoading } = useQuery({
    queryKey: ['members', { page: 1, limit: 100 }],
    queryFn: () => memberApi.getMembers({ page: 1, limit: 100 })
  })

  const createBulkUpdateMutation = useMutation({
    mutationFn: (data: { updates: any[], notes: string }) => 
      memberApi.createBulkEquityUpdate(data.updates, data.notes),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Equity update created successfully',
      })
      queryClient.invalidateQueries({ queryKey: ['members'] })
      navigate('/equity')
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create equity update',
        variant: 'destructive',
      })
    }
  })

  const handlePercentageChange = (memberId: string, value: string) => {
    const newPercentage = parseFloat(value) || 0
    const member = membersData?.data.find(m => m.id === memberId)
    const currentPercentage = parseFloat(member?.equityPercentage || '0')
    
    setUpdates(prev => ({
      ...prev,
      [memberId]: {
        memberId,
        currentPercentage,
        newPercentage,
        hasChanges: newPercentage !== currentPercentage
      }
    }))
  }

  const activeMembers = membersData?.data.filter(m => 
    m.equityPercentage && parseFloat(m.equityPercentage) > 0
  ) || []
  
  const totalCurrent = activeMembers.reduce((sum, member) => 
    sum + parseFloat(member.equityPercentage || '0'), 0) || 0

  const totalNew = activeMembers.reduce((sum, member) => {
    const update = updates[member.id]
    return sum + (update?.newPercentage ?? parseFloat(member.equityPercentage || '0'))
  }, 0) || 0

  const changedMembers = Object.values(updates).filter(u => u.hasChanges)
  const hasChanges = changedMembers.length > 0

  const handleSubmit = () => {
    if (!hasChanges) return

    const updateData = changedMembers.map(update => ({
      memberId: update.memberId,
      estimatedPercentage: update.newPercentage,
      capitalBalance: 0
    }))

    createBulkUpdateMutation.mutate({ updates: updateData, notes })
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/equity')}
          className="mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Equity Dashboard
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900">Manual Equity Update</h1>
        <p className="mt-2 text-gray-600">Manually adjust member equity percentages</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Current Total</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{totalCurrent.toFixed(2)}%</p>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">New Total</h3>
          <p className={`mt-2 text-3xl font-bold ${
            Math.abs(totalNew - 100) < 0.01 ? 'text-green-600' : 'text-yellow-600'
          }`}>
            {totalNew.toFixed(2)}%
          </p>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Changes</h3>
          <p className="mt-2 text-3xl font-bold text-blue-600">{changedMembers.length}</p>
        </Card>
      </div>

      {/* Warnings */}
      {Math.abs(totalNew - 100) > 0.01 && (
        <Alert className="mb-6">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <div className="ml-3">
            <h3 className="text-sm font-medium">Total does not equal 100%</h3>
            <p className="mt-1 text-sm text-gray-600">
              The new total is {totalNew.toFixed(2)}%. Consider using pro-rata distribution to allocate the difference.
            </p>
          </div>
        </Alert>
      )}

      {/* Members Table */}
      <Card className="mb-8">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  New %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Change
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeMembers.map(member => {
                const update = updates[member.id]
                const currentPercent = parseFloat(member.equityPercentage || '0')
                const newPercent = update?.newPercentage ?? currentPercent
                const change = newPercent - currentPercent
                const hasChange = Math.abs(change) > 0.001
                
                return (
                  <tr key={member.id} className={hasChange ? 'bg-yellow-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {member.firstName} {member.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{member.jobTitle}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {currentPercent.toFixed(3)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Input
                        type="number"
                        step="0.001"
                        value={newPercent}
                        onChange={(e) => handlePercentageChange(member.id, e.target.value)}
                        className="w-24"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {hasChange && (
                        <Badge variant={change > 0 ? 'default' : 'secondary'}>
                          {change > 0 ? '+' : ''}{change.toFixed(3)}%
                        </Badge>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Notes Section */}
      <Card className="p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Board Approval Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter notes about this equity update (e.g., board meeting date, approval details)..."
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={() => navigate('/equity')}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!hasChanges || createBulkUpdateMutation.isPending}
        >
          {createBulkUpdateMutation.isPending ? 'Creating...' : 'Create Update'}
        </Button>
      </div>
    </div>
  )
}