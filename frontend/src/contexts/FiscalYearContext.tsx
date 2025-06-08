import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

interface FiscalYearContextType {
  currentFiscalYear: number
  setCurrentFiscalYear: (year: number) => void
  availableYears: number[]
  isCurrentYear: boolean
}

const FiscalYearContext = createContext<FiscalYearContextType | null>(null)

export function FiscalYearProvider({ children }: { children: ReactNode }) {
  // Fiscal year runs November to October
  // FY 2024 = Nov 1, 2023 to Oct 31, 2024
  const getCurrentFiscalYear = () => {
    const now = new Date()
    const currentMonth = now.getMonth() // 0-11
    const currentYear = now.getFullYear()
    
    // If we're in Nov or Dec, we're in the next fiscal year
    if (currentMonth >= 10) { // November (10) or December (11)
      return currentYear + 1
    } else {
      return currentYear
    }
  }

  const currentFY = getCurrentFiscalYear()
  const [currentFiscalYear, setCurrentFiscalYear] = useState(currentFY)
  
  // Generate available years (current FY and past 10 FYs)
  const availableYears = Array.from(
    { length: 11 }, 
    (_, index) => currentFY - index
  )

  const isCurrentYear = currentFiscalYear === currentFY

  return (
    <FiscalYearContext.Provider value={{
      currentFiscalYear,
      setCurrentFiscalYear,
      availableYears,
      isCurrentYear
    }}>
      {children}
    </FiscalYearContext.Provider>
  )
}

export function useFiscalYear() {
  const context = useContext(FiscalYearContext)
  if (!context) {
    throw new Error('useFiscalYear must be used within FiscalYearProvider')
  }
  return context
}