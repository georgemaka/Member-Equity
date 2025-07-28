import { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
  className?: string
  fullWidth?: boolean
}

export default function PageContainer({ 
  children, 
  className = '',
  fullWidth = false 
}: PageContainerProps) {
  return (
    <div 
      className={`
        ${fullWidth 
          ? 'px-4 sm:px-6 lg:px-8' 
          : 'px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto'
        } 
        py-4 sm:py-6 
        ${className}
      `}
    >
      {children}
    </div>
  )
}