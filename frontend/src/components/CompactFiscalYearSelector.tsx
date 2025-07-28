import { useFiscalYear } from '@/contexts/FiscalYearContext'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

interface CompactFiscalYearSelectorProps {
  showLabel?: boolean
  className?: string
}

export default function CompactFiscalYearSelector({ 
  showLabel = true, 
  className = '' 
}: CompactFiscalYearSelectorProps) {
  const { currentFiscalYear, availableYears, setCurrentFiscalYear } = useFiscalYear()

  return (
    <div className={`flex items-center ${className}`}>
      {showLabel && (
        <span className="text-sm font-medium text-gray-500 mr-2">FY</span>
      )}
      <div className="relative">
        <select
          value={currentFiscalYear}
          onChange={(e) => setCurrentFiscalYear(Number(e.target.value))}
          className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sukut-500 cursor-pointer"
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronDownIcon className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      {currentFiscalYear === new Date().getFullYear() && (
        <span className="ml-2 text-xs text-green-600 font-medium">Current</span>
      )}
    </div>
  )
}