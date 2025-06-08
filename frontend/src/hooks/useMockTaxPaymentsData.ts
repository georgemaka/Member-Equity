import { useQuery } from '@tanstack/react-query'
import { useFiscalYear } from '@/contexts/FiscalYearContext'

export type PaymentType = 'federal' | 'state_ca' | 'state_ny' | 'state_tx' | 'local'

export interface TaxPayment {
  id: string
  memberId: string
  memberName: string
  fiscalYear: number
  paymentType: PaymentType
  quarterlyPayments: {
    q1: { amount: number; dueDate: string; paidDate?: string; status: 'pending' | 'paid' | 'overdue' }
    q2: { amount: number; dueDate: string; paidDate?: string; status: 'pending' | 'paid' | 'overdue' }
    q3: { amount: number; dueDate: string; paidDate?: string; status: 'pending' | 'paid' | 'overdue' }
    q4: { amount: number; dueDate: string; paidDate?: string; status: 'pending' | 'paid' | 'overdue' }
  }
  totalDue: number
  totalPaid: number
  k1Income: number
  notes?: string
}

// Payment type labels for display
export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  federal: 'Federal',
  state_ca: 'California State',
  state_ny: 'New York State',
  state_tx: 'Texas State',
  local: 'Local'
}

// Generate mock tax payment data
const generateMockTaxPayments = (fiscalYear: number): TaxPayment[] => {
  const members = [
    { id: '1', name: 'John Doe', k1Income: 450000, state: 'CA' },
    { id: '2', name: 'Jane Smith', k1Income: 380000, state: 'NY' },
    { id: '3', name: 'Robert Johnson', k1Income: 520000, state: 'CA' },
    { id: '4', name: 'Emily Davis', k1Income: 290000, state: 'TX' },
    { id: '5', name: 'Michael Chen', k1Income: 675000, state: 'CA' },
    { id: '6', name: 'Sarah Wilson', k1Income: 410000, state: 'NY' },
    { id: '7', name: 'David Brown', k1Income: 350000, state: 'TX' },
    { id: '8', name: 'Lisa Anderson', k1Income: 480000, state: 'CA' },
    { id: '9', name: 'James Taylor', k1Income: 320000, state: 'NY' },
    { id: '10', name: 'Maria Garcia', k1Income: 390000, state: 'CA' },
  ]

  const taxPayments: TaxPayment[] = []
  
  members.forEach(member => {
    // Federal tax payment
    const federalTax = member.k1Income * 0.37 // Simplified federal rate
    const federalQuarterly = federalTax / 4
    
    // State tax payment (varies by state)
    const stateTaxRates: Record<string, number> = {
      CA: 0.133, // California top rate
      NY: 0.109, // New York top rate
      TX: 0     // Texas has no state income tax
    }
    const stateTax = member.k1Income * (stateTaxRates[member.state] || 0)
    const stateQuarterly = stateTax / 4

    // Generate payment status based on fiscal year and current date
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1

    const getQuarterStatus = (quarter: number) => {
      if (fiscalYear < currentYear) return 'paid'
      if (fiscalYear > currentYear) return 'pending'
      
      // For current year, check based on quarter
      const quarterDeadlines = [4, 6, 9, 1] // April, June, September, January (next year)
      const quarterMonth = quarterDeadlines[quarter - 1]
      
      if (quarter === 4) {
        // Q4 is due in January of next year
        return 'pending'
      }
      
      if (currentMonth > quarterMonth) {
        // Randomly assign some as paid, some as overdue
        return Math.random() > 0.2 ? 'paid' : 'overdue'
      }
      
      return 'pending'
    }

    // Federal payment
    const q1Status = getQuarterStatus(1)
    const q2Status = getQuarterStatus(2)
    const q3Status = getQuarterStatus(3)
    const q4Status = getQuarterStatus(4)

    const calculatePaid = (status: string, amount: number) => status === 'paid' ? amount : 0

    taxPayments.push({
      id: `tax-federal-${member.id}-${fiscalYear}`,
      memberId: member.id,
      memberName: member.name,
      fiscalYear,
      paymentType: 'federal',
      quarterlyPayments: {
        q1: {
          amount: federalQuarterly,
          dueDate: `${fiscalYear}-04-15`,
          paidDate: q1Status === 'paid' ? `${fiscalYear}-04-10` : undefined,
          status: q1Status as any
        },
        q2: {
          amount: federalQuarterly,
          dueDate: `${fiscalYear}-06-15`,
          paidDate: q2Status === 'paid' ? `${fiscalYear}-06-12` : undefined,
          status: q2Status as any
        },
        q3: {
          amount: federalQuarterly,
          dueDate: `${fiscalYear}-09-15`,
          paidDate: q3Status === 'paid' ? `${fiscalYear}-09-14` : undefined,
          status: q3Status as any
        },
        q4: {
          amount: federalQuarterly,
          dueDate: `${fiscalYear + 1}-01-15`,
          paidDate: q4Status === 'paid' ? `${fiscalYear + 1}-01-10` : undefined,
          status: q4Status as any
        }
      },
      totalDue: federalTax,
      totalPaid: calculatePaid(q1Status, federalQuarterly) + calculatePaid(q2Status, federalQuarterly) + 
                 calculatePaid(q3Status, federalQuarterly) + calculatePaid(q4Status, federalQuarterly),
      k1Income: member.k1Income,
      notes: Math.random() > 0.7 ? 'Extension filed' : undefined
    })

    // State payment (if applicable)
    if (stateTax > 0) {
      const stateType = `state_${member.state.toLowerCase()}` as PaymentType
      
      taxPayments.push({
        id: `tax-${stateType}-${member.id}-${fiscalYear}`,
        memberId: member.id,
        memberName: member.name,
        fiscalYear,
        paymentType: stateType,
        quarterlyPayments: {
          q1: {
            amount: stateQuarterly,
            dueDate: `${fiscalYear}-04-15`,
            paidDate: q1Status === 'paid' ? `${fiscalYear}-04-10` : undefined,
            status: q1Status as any
          },
          q2: {
            amount: stateQuarterly,
            dueDate: `${fiscalYear}-06-15`,
            paidDate: q2Status === 'paid' ? `${fiscalYear}-06-12` : undefined,
            status: q2Status as any
          },
          q3: {
            amount: stateQuarterly,
            dueDate: `${fiscalYear}-09-15`,
            paidDate: q3Status === 'paid' ? `${fiscalYear}-09-14` : undefined,
            status: q3Status as any
          },
          q4: {
            amount: stateQuarterly,
            dueDate: `${fiscalYear + 1}-01-15`,
            paidDate: q4Status === 'paid' ? `${fiscalYear + 1}-01-10` : undefined,
            status: q4Status as any
          }
        },
        totalDue: stateTax,
        totalPaid: calculatePaid(q1Status, stateQuarterly) + calculatePaid(q2Status, stateQuarterly) + 
                   calculatePaid(q3Status, stateQuarterly) + calculatePaid(q4Status, stateQuarterly),
        k1Income: member.k1Income,
        notes: undefined
      })
    }
  })

  return taxPayments
}

export function useMockTaxPaymentsData() {
  const { currentFiscalYear } = useFiscalYear()
  
  return useQuery({
    queryKey: ['taxPayments', currentFiscalYear],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const taxPayments = generateMockTaxPayments(currentFiscalYear)
      
      // Calculate summary statistics
      const totalMembers = taxPayments.length
      const totalDue = taxPayments.reduce((sum, payment) => sum + payment.totalDue, 0)
      const totalPaid = taxPayments.reduce((sum, payment) => sum + payment.totalPaid, 0)
      const totalOutstanding = totalDue - totalPaid
      
      const overduePayments = taxPayments.filter(payment => {
        const quarters = ['q1', 'q2', 'q3', 'q4'] as const
        return quarters.some(q => payment.quarterlyPayments[q].status === 'overdue')
      }).length
      
      const compliantMembers = taxPayments.filter(payment => {
        const quarters = ['q1', 'q2', 'q3', 'q4'] as const
        return !quarters.some(q => payment.quarterlyPayments[q].status === 'overdue')
      }).length
      
      return {
        taxPayments,
        summary: {
          totalMembers,
          totalDue,
          totalPaid,
          totalOutstanding,
          overduePayments,
          compliantMembers,
          complianceRate: (compliantMembers / totalMembers) * 100
        }
      }
    },
    refetchOnWindowFocus: false,
  })
}