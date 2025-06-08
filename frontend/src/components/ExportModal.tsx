import { useState } from 'react'
import { XMarkIcon, DocumentArrowDownIcon, TableCellsIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/contexts/ToastContext'
import * as XLSX from 'xlsx'

interface ExportModalProps {
  data: any[]
  isOpen: boolean
  onClose: () => void
  title?: string
  filename?: string
}

interface ExportField {
  key: string
  label: string
  selected: boolean
  format?: (value: any) => string
}

export default function ExportModal({ 
  data, 
  isOpen, 
  onClose, 
  title = "Export Data",
  filename = "export"
}: ExportModalProps) {
  const { success } = useToast()
  
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('excel')
  const [includeHeaders, setIncludeHeaders] = useState(true)
  const [fields, setFields] = useState<ExportField[]>([
    { key: 'name', label: 'Full Name', selected: true, format: (member) => `${member.member.firstName} ${member.member.lastName}` },
    { key: 'email', label: 'Email', selected: true, format: (member) => member.member.email },
    { key: 'phone', label: 'Phone', selected: true, format: (member) => member.member.phone || '' },
    { key: 'jobTitle', label: 'Job Title', selected: true, format: (member) => member.member.jobTitle || '' },
    { key: 'status', label: 'Status', selected: true, format: (member) => member.member.currentStatus?.status || 'active' },
    { key: 'joinDate', label: 'Join Date', selected: true, format: (member) => new Date(member.member.joinDate).toLocaleDateString() },
    { key: 'hireDate', label: 'Hire Date', selected: false, format: (member) => member.member.hireDate ? new Date(member.member.hireDate).toLocaleDateString() : '' },
    { key: 'yearsOfService', label: 'Years of Service', selected: true, format: (member) => member.yearsOfService.toFixed(1) },
    { key: 'equityPercentage', label: 'Current Equity %', selected: true, format: (member) => member.currentEquityPercentage.toFixed(2) },
    { key: 'capitalBalance', label: 'Capital Balance', selected: true, format: (member) => member.currentCapitalBalance.toLocaleString() },
    { key: 'taxPayments', label: 'Tax Payments This Year', selected: false, format: (member) => member.totalTaxPaymentsThisYear.toLocaleString() },
    { key: 'distributions', label: 'Distributions This Year', selected: false, format: (member) => member.totalDistributionsThisYear.toLocaleString() },
    { key: 'address', label: 'Address', selected: false, format: (member) => member.member.address || '' },
    { key: 'city', label: 'City', selected: false, format: (member) => member.member.city || '' },
    { key: 'state', label: 'State', selected: false, format: (member) => member.member.state || '' },
    { key: 'zipCode', label: 'Zip Code', selected: false, format: (member) => member.member.zipCode || '' }
  ])

  const handleFieldToggle = (index: number) => {
    setFields(prev => prev.map((field, i) => 
      i === index ? { ...field, selected: !field.selected } : field
    ))
  }

  const handleSelectAll = () => {
    const allSelected = fields.every(field => field.selected)
    setFields(prev => prev.map(field => ({ ...field, selected: !allSelected })))
  }

  const generateCSV = () => {
    const selectedFields = fields.filter(field => field.selected)
    const headers = selectedFields.map(field => field.label)
    const rows = data.map(item => 
      selectedFields.map(field => {
        const value = field.format ? field.format(item) : item[field.key]
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      })
    )

    const csvContent = [
      includeHeaders ? headers.join(',') : null,
      ...rows.map(row => row.join(','))
    ].filter(Boolean).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const generateExcel = () => {
    const selectedFields = fields.filter(field => field.selected)
    const headers = selectedFields.map(field => field.label)
    const rows = data.map(item => 
      selectedFields.map(field => {
        const value = field.format ? field.format(item) : item[field.key]
        return value
      })
    )

    const worksheetData = includeHeaders ? [headers, ...rows] : rows
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    
    // Auto-size columns
    const colWidths = selectedFields.map((field, index) => {
      const maxLength = Math.max(
        field.label.length,
        ...rows.map(row => String(row[index] || '').length)
      )
      return { wch: Math.min(maxLength + 2, 50) }
    })
    worksheet['!cols'] = colWidths

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Members')
    
    XLSX.writeFile(workbook, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const generatePDF = () => {
    // For now, just show an alert. In production, you'd use a PDF library like jsPDF
    alert('PDF export coming soon! Please use Excel or CSV for now.')
  }

  const handleExport = () => {
    const selectedFields = fields.filter(field => field.selected)
    if (selectedFields.length === 0) {
      alert('Please select at least one field to export')
      return
    }

    switch (exportFormat) {
      case 'csv':
        generateCSV()
        break
      case 'excel':
        generateExcel()
        break
      case 'pdf':
        generatePDF()
        break
    }

    success('Export Complete', `${data.length} records exported as ${exportFormat.toUpperCase()}`)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <DocumentArrowDownIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">{data.length} records available for export</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Export Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setExportFormat('csv')}
                className={`p-4 border rounded-lg text-center transition-all duration-200 ${
                  exportFormat === 'csv'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <DocumentTextIcon className="h-8 w-8 mx-auto mb-2" />
                <div className="font-medium">CSV</div>
                <div className="text-xs text-gray-500">Comma separated</div>
              </button>
              
              <button
                onClick={() => setExportFormat('excel')}
                className={`p-4 border rounded-lg text-center transition-all duration-200 ${
                  exportFormat === 'excel'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <TableCellsIcon className="h-8 w-8 mx-auto mb-2" />
                <div className="font-medium">Excel</div>
                <div className="text-xs text-gray-500">Spreadsheet format</div>
              </button>
              
              <button
                onClick={() => setExportFormat('pdf')}
                className={`p-4 border rounded-lg text-center transition-all duration-200 ${
                  exportFormat === 'pdf'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <DocumentArrowDownIcon className="h-8 w-8 mx-auto mb-2" />
                <div className="font-medium">PDF</div>
                <div className="text-xs text-gray-500">Printable format</div>
              </button>
            </div>
          </div>

          {/* Export Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Export Options</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeHeaders}
                  onChange={(e) => setIncludeHeaders(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Include column headers</span>
              </label>
            </div>
          </div>

          {/* Field Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Select Fields to Export</label>
              <button
                onClick={handleSelectAll}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                {fields.every(field => field.selected) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-3">
                {fields.map((field, index) => (
                  <label key={field.key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={field.selected}
                      onChange={() => handleFieldToggle(index)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{field.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Export {data.length} Records
          </button>
        </div>
      </div>
    </div>
  )
}