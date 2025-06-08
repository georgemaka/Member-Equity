import { useQuery } from '@tanstack/react-query'
import { useFiscalYear } from '@/contexts/FiscalYearContext'

export type AuditAction = 
  | 'member_created' 
  | 'member_updated' 
  | 'member_deleted'
  | 'equity_updated'
  | 'status_changed'
  | 'distribution_created'
  | 'distribution_approved'
  | 'tax_payment_recorded'
  | 'login'
  | 'logout'
  | 'export_generated'

export interface AuditEntry {
  id: string
  timestamp: string
  userId: string
  userName: string
  userRole: string
  action: AuditAction
  entityType: string
  entityId: string
  entityName?: string
  description: string
  changes?: Record<string, { from: any; to: any }>
  ipAddress: string
  userAgent: string
  fiscalYear: number
}

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  member_created: 'Member Created',
  member_updated: 'Member Updated',
  member_deleted: 'Member Deleted',
  equity_updated: 'Equity Updated',
  status_changed: 'Status Changed',
  distribution_created: 'Distribution Created',
  distribution_approved: 'Distribution Approved',
  tax_payment_recorded: 'Tax Payment Recorded',
  login: 'User Login',
  logout: 'User Logout',
  export_generated: 'Export Generated'
}

// Generate mock audit trail data
const generateMockAuditEntries = (fiscalYear: number): AuditEntry[] => {
  const entries: AuditEntry[] = []
  const users = [
    { id: '1', name: 'John Admin', role: 'Administrator' },
    { id: '2', name: 'Jane CFO', role: 'CFO' },
    { id: '3', name: 'Mike Controller', role: 'Controller' },
    { id: '4', name: 'Sarah Analyst', role: 'Analyst' }
  ]

  const members = [
    { id: '1', name: 'John Doe' },
    { id: '2', name: 'Jane Smith' },
    { id: '3', name: 'Robert Johnson' },
    { id: '4', name: 'Emily Davis' },
    { id: '5', name: 'Michael Chen' }
  ]

  // Generate entries for the past 30 days
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  for (let i = 0; i < 150; i++) {
    const timestamp = new Date(
      thirtyDaysAgo.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000
    )
    
    const user = users[Math.floor(Math.random() * users.length)]
    const member = members[Math.floor(Math.random() * members.length)]
    
    // Generate different types of audit entries
    const actionTypes: AuditAction[] = [
      'member_updated', 'equity_updated', 'status_changed', 
      'distribution_created', 'tax_payment_recorded', 'login',
      'export_generated'
    ]
    
    const action = actionTypes[Math.floor(Math.random() * actionTypes.length)]
    
    let entry: AuditEntry = {
      id: `audit-${i + 1}`,
      timestamp: timestamp.toISOString(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      entityType: '',
      entityId: '',
      description: '',
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      fiscalYear
    }

    switch (action) {
      case 'member_updated':
        entry = {
          ...entry,
          entityType: 'member',
          entityId: member.id,
          entityName: member.name,
          description: `Updated member information for ${member.name}`,
          changes: {
            email: { from: 'old@example.com', to: 'new@example.com' },
            phoneNumber: { from: '(555) 123-4567', to: '(555) 987-6543' }
          }
        }
        break

      case 'equity_updated':
        const oldPercentage = (Math.random() * 10 + 1).toFixed(2)
        const newPercentage = (Math.random() * 10 + 1).toFixed(2)
        entry = {
          ...entry,
          entityType: 'equity',
          entityId: member.id,
          entityName: member.name,
          description: `Updated equity percentage for ${member.name}`,
          changes: {
            equityPercentage: { from: `${oldPercentage}%`, to: `${newPercentage}%` }
          }
        }
        break

      case 'status_changed':
        const statuses = ['active', 'inactive', 'retired']
        const oldStatus = statuses[Math.floor(Math.random() * statuses.length)]
        const newStatus = statuses[Math.floor(Math.random() * statuses.length)]
        entry = {
          ...entry,
          entityType: 'member',
          entityId: member.id,
          entityName: member.name,
          description: `Changed status for ${member.name} from ${oldStatus} to ${newStatus}`,
          changes: {
            status: { from: oldStatus, to: newStatus }
          }
        }
        break

      case 'distribution_created':
        const distributionAmount = Math.floor(Math.random() * 1000000 + 100000)
        entry = {
          ...entry,
          entityType: 'distribution',
          entityId: `dist-${Math.floor(Math.random() * 1000)}`,
          description: `Created new distribution for $${distributionAmount.toLocaleString()}`,
          changes: {
            totalAmount: { from: null, to: distributionAmount },
            status: { from: null, to: 'draft' }
          }
        }
        break

      case 'tax_payment_recorded':
        const taxAmount = Math.floor(Math.random() * 50000 + 5000)
        entry = {
          ...entry,
          entityType: 'tax_payment',
          entityId: `tax-${Math.floor(Math.random() * 1000)}`,
          entityName: member.name,
          description: `Recorded tax payment of $${taxAmount.toLocaleString()} for ${member.name}`,
          changes: {
            amount: { from: null, to: taxAmount },
            status: { from: 'pending', to: 'paid' }
          }
        }
        break

      case 'login':
        entry = {
          ...entry,
          entityType: 'session',
          entityId: `session-${Math.floor(Math.random() * 10000)}`,
          description: `User logged in from ${entry.ipAddress}`
        }
        break

      case 'export_generated':
        const exportTypes = ['members', 'distributions', 'tax_payments', 'equity_report']
        const exportType = exportTypes[Math.floor(Math.random() * exportTypes.length)]
        entry = {
          ...entry,
          entityType: 'export',
          entityId: `export-${Math.floor(Math.random() * 1000)}`,
          description: `Generated ${exportType} export for FY ${fiscalYear}`
        }
        break
    }

    entries.push(entry)
  }

  // Sort by timestamp descending (most recent first)
  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function useMockAuditTrailData(page: number = 1, limit: number = 50) {
  const { currentFiscalYear } = useFiscalYear()
  
  return useQuery({
    queryKey: ['auditTrail', currentFiscalYear, page, limit],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const allEntries = generateMockAuditEntries(currentFiscalYear)
      
      // Paginate results
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const entries = allEntries.slice(startIndex, endIndex)
      
      // Calculate summary statistics
      const last24Hours = allEntries.filter(entry => {
        const entryTime = new Date(entry.timestamp)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
        return entryTime > yesterday
      }).length

      const uniqueUsers = new Set(allEntries.map(e => e.userId)).size
      
      const actionCounts = allEntries.reduce((acc, entry) => {
        acc[entry.action] = (acc[entry.action] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const topActions = Object.entries(actionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([action, count]) => ({
          action: action as AuditAction,
          count,
          label: AUDIT_ACTION_LABELS[action as AuditAction]
        }))
      
      return {
        entries,
        pagination: {
          page,
          limit,
          total: allEntries.length,
          totalPages: Math.ceil(allEntries.length / limit),
          hasNextPage: endIndex < allEntries.length,
          hasPreviousPage: page > 1
        },
        summary: {
          totalEntries: allEntries.length,
          last24Hours,
          uniqueUsers,
          topActions
        }
      }
    },
    refetchOnWindowFocus: false,
  })
}