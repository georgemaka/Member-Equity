import React, { ReactNode } from 'react'
import CompactFiscalYearSelector from './CompactFiscalYearSelector'
import { CalendarIcon } from '@heroicons/react/24/outline'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  showFiscalYear?: boolean
  breadcrumbs?: Array<{ label: string; href?: string }>
}

export default function PageHeader({ 
  title, 
  subtitle, 
  actions, 
  showFiscalYear = false,
  breadcrumbs 
}: PageHeaderProps) {
  return (
    <div className="mb-6">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="text-sm mb-2" aria-label="Breadcrumb">
          <ol className="list-none p-0 inline-flex">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && <span className="mx-2 text-gray-400">/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="text-gray-500 hover:text-gray-700">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-gray-500">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Main header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>

        {/* Fiscal Year Selector and Actions */}
        <div className="flex items-center space-x-3">
          {showFiscalYear && (
            <div className="flex items-center bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200">
              <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
              <CompactFiscalYearSelector showLabel={true} />
            </div>
          )}
          {actions}
        </div>
      </div>
    </div>
  )
}