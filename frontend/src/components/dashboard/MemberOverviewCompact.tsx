import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MemberSummary } from '@/types/dashboard'
import { MemberStatus } from '@/types/member'
import {
  UserIcon,
  ChartBarIcon,
  ArrowRightIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

interface MemberOverviewCompactProps {
  members: MemberSummary[]
  onMemberSelect: (memberId: string) => void
  loading?: boolean
  limit?: number
}

const statusColors: Record<MemberStatus, string> = {
  active: 'bg-green-100 text-green-800',
  retired: 'bg-blue-100 text-blue-800',
  resigned: 'bg-gray-100 text-gray-800',
  terminated: 'bg-red-100 text-red-800',
  deceased: 'bg-gray-100 text-gray-800',
  suspended: 'bg-yellow-100 text-yellow-800',
  probationary: 'bg-orange-100 text-orange-800'
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-16 bg-gray-100 rounded-lg"></div>
        </div>
      ))}
    </div>
  )
}

export default function MemberOverviewCompact({
  members,
  onMemberSelect,
  loading,
  limit = 10
}: MemberOverviewCompactProps) {
  const navigate = useNavigate()
  const [hoveredMember, setHoveredMember] = useState<string | null>(null)

  // Sort members by equity percentage and take top N
  const topMembers = [...members]
    .sort((a, b) => b.currentEquityPercentage - a.currentEquityPercentage)
    .slice(0, limit)

  const totalEquity = topMembers.reduce((sum, m) => sum + m.currentEquityPercentage, 0)
  const remainingMembers = members.length - limit
  const remainingEquity = (100 - totalEquity).toFixed(2)

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-4">
      {/* Header with View All */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <ChartBarIcon className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">
            Top {limit} Members by Equity
          </span>
        </div>
        <button
          onClick={() => navigate('/members')}
          className="text-sm text-sukut-600 hover:text-sukut-700 font-medium flex items-center group"
        >
          View All Members
          <ArrowRightIcon className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* Compact Member List */}
      <div className="space-y-2">
        {topMembers.map((member) => {
          const status = member.member.currentStatus?.status || 'active'
          const isHovered = hoveredMember === member.member.id

          return (
            <div
              key={member.member.id}
              className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                isHovered 
                  ? 'border-sukut-300 bg-sukut-50 shadow-sm' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onMouseEnter={() => setHoveredMember(member.member.id)}
              onMouseLeave={() => setHoveredMember(null)}
              onClick={() => onMemberSelect(member.member.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-indigo-600" />
                    </div>
                  </div>

                  {/* Member Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {member.member.firstName} {member.member.lastName}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[status]}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{member.member.jobTitle}</p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center space-x-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {member.currentEquityPercentage.toFixed(2)}%
                    </p>
                    <p className="text-xs text-gray-500">Equity</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      ${(member.currentCapitalBalance / 1000).toFixed(0)}K
                    </p>
                    <p className="text-xs text-gray-500">Capital</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onMemberSelect(member.member.id)
                    }}
                    className="p-1 text-gray-400 hover:text-sukut-600 transition-colors"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {/* Remaining Members Summary */}
        {remainingMembers > 0 && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{remainingMembers}</span> other members
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">{remainingEquity}%</span> equity
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-200">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">{members.length}</p>
          <p className="text-xs text-gray-500">Total Members</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">
            ${(members.reduce((sum, m) => sum + m.currentCapitalBalance, 0) / 1000000).toFixed(1)}M
          </p>
          <p className="text-xs text-gray-500">Total Capital</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">
            {members.filter(m => m.member.currentStatus?.status === 'active').length}
          </p>
          <p className="text-xs text-gray-500">Active</p>
        </div>
      </div>
    </div>
  )
}