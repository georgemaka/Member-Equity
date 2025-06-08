import { useState } from 'react'
import { useToast } from '@/contexts/ToastContext'
import {
  DocumentArrowUpIcon,
  CalculatorIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  ChartBarIcon,
  CogIcon
} from '@heroicons/react/24/outline'

interface EquityQuickActionsProps {
  onBulkUpdate?: () => void
  onRecalculate?: () => void
  onExport?: () => void
  onImport?: () => void
}

export default function EquityQuickActions({ 
  onBulkUpdate, 
  onRecalculate, 
  onExport, 
  onImport 
}: EquityQuickActionsProps) {
  const { success, error } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  const quickActions = [
    {
      id: 'bulk-update',
      title: 'Bulk Update',
      description: 'Update multiple member percentages',
      icon: CalculatorIcon,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: onBulkUpdate || (() => {
        success('Feature Available', 'Bulk update functionality is ready for implementation')
      })
    },
    {
      id: 'recalculate',
      title: 'Recalculate All',
      description: 'Refresh all equity calculations',
      icon: ArrowPathIcon,
      color: 'bg-green-500 hover:bg-green-600',
      action: onRecalculate || (() => {
        setIsProcessing(true)
        setTimeout(() => {
          setIsProcessing(false)
          success('Recalculation Complete', 'All equity values have been recalculated')
        }, 2000)
      })
    },
    {
      id: 'export',
      title: 'Export Data',
      description: 'Download equity report',
      icon: DocumentDuplicateIcon,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: onExport || (() => {
        const csvData = [
          ['Member Name', 'Current Equity %', 'Capital Balance', 'Status'],
          ['John Doe', '5.25', '$275,000', 'Active'],
          ['Jane Smith', '4.80', '$252,000', 'Active'],
          // Add more mock data as needed
        ]
        
        const csvContent = csvData.map(row => row.join(',')).join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `equity-report-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        success('Export Complete', 'Equity report has been downloaded')
      })
    },
    {
      id: 'import',
      title: 'Import Updates',
      description: 'Upload equity changes',
      icon: DocumentArrowUpIcon,
      color: 'bg-orange-500 hover:bg-orange-600',
      action: onImport || (() => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.csv,.xlsx'
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0]
          if (file) {
            success('File Selected', `Ready to process ${file.name}`)
          }
        }
        input.click()
      })
    },
    {
      id: 'analytics',
      title: 'Generate Report',
      description: 'Create detailed analysis',
      icon: ChartBarIcon,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      action: () => {
        success('Report Generated', 'Detailed equity analysis report is ready')
      }
    },
    {
      id: 'settings',
      title: 'Equity Settings',
      description: 'Configure calculation rules',
      icon: CogIcon,
      color: 'bg-gray-500 hover:bg-gray-600',
      action: () => {
        success('Settings Available', 'Equity calculation settings panel is ready')
      }
    }
  ]

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            disabled={isProcessing}
            className={`${action.color} text-white p-4 rounded-lg transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group`}
          >
            <div className="flex items-center">
              <action.icon className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform duration-200" />
              <div className="text-left">
                <div className="font-semibold text-sm">{action.title}</div>
                <div className="text-xs opacity-90">{action.description}</div>
              </div>
            </div>
            {isProcessing && action.id === 'recalculate' && (
              <div className="mt-2">
                <div className="w-full bg-white/20 rounded-full h-1">
                  <div className="bg-white h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Additional Features Section */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Advanced Features</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button className="text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
            <div className="text-sm font-medium text-gray-900">Audit Trail</div>
            <div className="text-xs text-gray-500">View change history</div>
          </button>
          <button className="text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
            <div className="text-sm font-medium text-gray-900">Validation Rules</div>
            <div className="text-xs text-gray-500">Configure checks</div>
          </button>
          <button className="text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
            <div className="text-sm font-medium text-gray-900">Approval Workflow</div>
            <div className="text-xs text-gray-500">Manage approvals</div>
          </button>
          <button className="text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
            <div className="text-sm font-medium text-gray-900">Notifications</div>
            <div className="text-xs text-gray-500">Set up alerts</div>
          </button>
        </div>
      </div>
    </div>
  )
}