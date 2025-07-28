import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Member, StatusHistory } from '@/types/member'
import { memberApi } from '@/services/memberApi'
import { 
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  BanknotesIcon,
  ChartPieIcon,
  ClockIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

interface MemberDetailsModalProps {
  member: Member | null
  isOpen: boolean
  onClose: () => void
}

export default function MemberDetailsModal({ member, isOpen, onClose }: MemberDetailsModalProps) {
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  useEffect(() => {
    if (member && isOpen) {
      setIsLoadingHistory(true)
      memberApi.getStatusHistory(member.id)
        .then(history => setStatusHistory(history))
        .catch(console.error)
        .finally(() => setIsLoadingHistory(false))
    }
  }, [member, isOpen])

  if (!member) return null

  const joinDate = new Date(member.joinDate)
  const yearsOfService = ((new Date().getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 365)).toFixed(1)

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      retired: 'bg-blue-100 text-blue-800',
      resigned: 'bg-yellow-100 text-yellow-800',
      terminated: 'bg-red-100 text-red-800',
      deceased: 'bg-gray-100 text-gray-800',
      suspended: 'bg-orange-100 text-orange-800',
      probationary: 'bg-purple-100 text-purple-800'
    }
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="div" className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Member Details</h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </Dialog.Title>

                <div className="space-y-6">
                  {/* Member Header */}
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                      {member.firstName[0]}{member.lastName[0]}
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900">
                        {member.firstName} {member.lastName}
                      </h4>
                      {member.jobTitle && (
                        <p className="text-sm text-gray-500">{member.jobTitle}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          getStatusColor(member.status || 'active')
                        }`}>
                          {(member.status || 'active').toUpperCase()}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Contact Information</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-900">{member.email}</span>
                      </div>
                      {member.phone && (
                        <div className="flex items-center space-x-3">
                          <PhoneIcon className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-900">{member.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Equity Information */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Equity & Financial</h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-indigo-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-1">
                          <ChartPieIcon className="h-4 w-4 text-indigo-600" />
                          <span className="text-xs text-indigo-600 font-medium">Equity %</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                          {parseFloat(member.equityPercentage || '0').toFixed(2)}%
                        </p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-1">
                          <ClockIcon className="h-4 w-4 text-purple-600" />
                          <span className="text-xs text-purple-600 font-medium">Years of Service</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                          {yearsOfService}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Employment Information */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Employment Details</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Join Date</p>
                          <p className="text-sm text-gray-900">{joinDate.toLocaleDateString()}</p>
                        </div>
                      </div>
                      {member.retirementDate && (
                        <div className="flex items-center space-x-3">
                          <CalendarIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Retirement Date</p>
                            <p className="text-sm text-gray-900">
                              {new Date(member.retirementDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Address Information */}
                  {member.address && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-3">Address</h5>
                      <p className="text-sm text-gray-900">
                        {member.address.street}<br />
                        {member.address.city}, {member.address.state} {member.address.zipCode}<br />
                        {member.address.country}
                      </p>
                    </div>
                  )}

                  {/* Status History */}
                  {statusHistory.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-3">Status Change History</h5>
                      <div className="space-y-2">
                        {statusHistory.slice(0, 5).map((history) => (
                          <div key={history.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(history.previousStatus)}`}>
                                  {history.previousStatus.toUpperCase()}
                                </span>
                                <ArrowRightIcon className="h-3 w-3 text-gray-400" />
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(history.newStatus)}`}>
                                  {history.newStatus.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-900 mt-1">{history.reason}</p>
                              {history.notes && (
                                <p className="text-xs text-gray-500 mt-1">{history.notes}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(history.effectiveDate).toLocaleDateString()}
                                {history.fiscalYear && ` - FY ${history.fiscalYear}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Equity History */}
                  {member.equityHistory && member.equityHistory.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-3">Recent Equity Changes</h5>
                      <div className="space-y-2">
                        {member.equityHistory.slice(0, 3).map((event) => (
                          <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{event.eventType}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(event.effectiveDate).toLocaleDateString()} - {event.reason}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                {event.previousPercentage ? `${event.previousPercentage}% → ` : ''}
                                {event.newPercentage}%
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}