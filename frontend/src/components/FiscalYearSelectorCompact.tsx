import { Fragment } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { useFiscalYear } from '@/contexts/FiscalYearContext'
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline'

interface FiscalYearSelectorCompactProps {
  showLabel?: boolean
  className?: string
}

export default function FiscalYearSelectorCompact({ 
  showLabel = true, 
  className = '' 
}: FiscalYearSelectorCompactProps) {
  const { currentFiscalYear, setCurrentFiscalYear, availableYears, isCurrentYear } = useFiscalYear()

  return (
    <div className={`flex items-center ${className}`}>
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 mr-2">FY:</span>
      )}
      <Listbox value={currentFiscalYear} onChange={setCurrentFiscalYear}>
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-pointer rounded-md bg-white py-1.5 pl-3 pr-8 text-left shadow-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sukut-500 focus:border-sukut-500 text-sm hover:border-gray-400 transition-colors">
            <span className="block truncate font-medium">
              {currentFiscalYear}
              {isCurrentYear && (
                <span className="ml-1 text-xs text-green-600">(Current)</span>
              )}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronDownIcon className="h-4 w-4 text-gray-400" />
            </span>
          </Listbox.Button>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full min-w-[120px] overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {availableYears.map((year) => (
                <Listbox.Option
                  key={year}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 pl-8 pr-4 ${
                      active ? 'bg-sukut-50 text-sukut-900' : 'text-gray-900'
                    }`
                  }
                  value={year}
                >
                  {({ selected }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                        {year}
                        {year === new Date().getFullYear() && (
                          <span className="ml-1 text-xs text-green-600">(Current)</span>
                        )}
                      </span>
                      {selected && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-sukut-600">
                          <CheckIcon className="h-4 w-4" />
                        </span>
                      )}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  )
}