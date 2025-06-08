import { Fragment } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { useFiscalYear } from '@/contexts/FiscalYearContext'
import { ChevronDownIcon, CheckIcon, CalendarIcon } from '@heroicons/react/24/outline'

export default function FiscalYearSelector() {
  const { currentFiscalYear, setCurrentFiscalYear, availableYears, isCurrentYear } = useFiscalYear()

  return (
    <div className="relative">
      <Listbox value={currentFiscalYear} onChange={setCurrentFiscalYear}>
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sukut-500 focus:border-sukut-500 transition-all duration-200 hover:border-gray-300">
            <div className="flex items-center">
              <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
              <span className="block truncate font-medium text-gray-900">
                FY {currentFiscalYear}
              </span>
              {isCurrentYear && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  Current
                </span>
              )}
            </div>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none border border-gray-200">
              {availableYears.map((year) => (
                <Listbox.Option
                  key={year}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 pl-10 pr-4 transition-colors duration-150 ${
                      active ? 'bg-sukut-50 text-sukut-900' : 'text-gray-900'
                    }`
                  }
                  value={year}
                >
                  {({ selected }) => (
                    <>
                      <div className="flex items-center justify-between">
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          FY {year}
                        </span>
                        {year === new Date().getFullYear() && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Current
                          </span>
                        )}
                      </div>
                      {selected && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sukut-600">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
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