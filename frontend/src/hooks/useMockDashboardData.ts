import { useMemo } from 'react'
import { DashboardData, ExecutiveSummary, MemberSummary, GroupAnalysis } from '@/types/dashboard'
import { useFiscalYear } from '@/contexts/FiscalYearContext'

// Mock data generator
export function useMockDashboardData() {
  const { currentFiscalYear } = useFiscalYear()

  const mockData = useMemo<DashboardData>(() => {
    // Mock Executive Summary with requested KPIs
    const executiveSummary: ExecutiveSummary = {
      fiscalYear: currentFiscalYear,
      // Primary KPIs requested
      activeMembers: 42,
      retiredMembers: 8,
      totalDistributions: 1200000,
      taxDistributions: 850000, // Tax payments made on behalf of members
      totalEquityPercentage: 100,
      // Additional context metrics
      totalMembers: 50,
      totalCapitalAccounts: 12500000,
      averageCapitalPerMember: 277777,
      averageEquityPerMember: 2.22,
      memberRetentionRate: 95.5,
      newJoinersThisYear: 3,
      departuresThisYear: 2,
      averageYearsOfService: 8.5
    }

    // Mock Member Summaries
    const memberSummaries: MemberSummary[] = [
      {
        member: {
          id: '1',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@sukut.com',
          phone: '(555) 123-4567',
          jobTitle: 'Senior Project Manager',
          joinDate: '2018-03-15',
          hireDate: '2017-01-10',
          companyId: 'sukut-1',
          createdAt: '2018-03-15T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
          isActive: true,
          currentEquity: {
            id: 'eq1',
            memberId: '1',
            fiscalYear: currentFiscalYear,
            estimatedPercentage: 2.5,
            finalPercentage: 2.4,
            capitalBalance: 300000,
            isFinalized: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-15T00:00:00Z'
          },
          currentStatus: {
            id: 'st1',
            memberId: '1',
            fiscalYear: currentFiscalYear,
            status: 'active',
            effectiveDate: '2024-01-01',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        },
        yearsOfService: 6.8,
        currentEquityPercentage: 2.4,
        currentCapitalBalance: 300000,
        totalTaxPaymentsThisYear: 18000,
        totalDistributionsThisYear: 25000,
        recentActivity: []
      },
      {
        member: {
          id: '2',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@sukut.com',
          phone: '(555) 234-5678',
          jobTitle: 'Executive Vice President',
          joinDate: '2015-06-01',
          hireDate: '2014-09-15',
          companyId: 'sukut-1',
          createdAt: '2015-06-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
          isActive: true,
          currentEquity: {
            id: 'eq2',
            memberId: '2',
            fiscalYear: currentFiscalYear,
            estimatedPercentage: 8.5,
            finalPercentage: 8.2,
            capitalBalance: 1025000,
            isFinalized: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-15T00:00:00Z'
          },
          currentStatus: {
            id: 'st2',
            memberId: '2',
            fiscalYear: currentFiscalYear,
            status: 'active',
            effectiveDate: '2024-01-01',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        },
        yearsOfService: 9.5,
        currentEquityPercentage: 8.2,
        currentCapitalBalance: 1025000,
        totalTaxPaymentsThisYear: 65000,
        totalDistributionsThisYear: 85000,
        recentActivity: []
      },
      {
        member: {
          id: '3',
          firstName: 'Michael',
          lastName: 'Chen',
          email: 'michael.chen@sukut.com',
          phone: '(555) 345-6789',
          jobTitle: 'Operations Manager',
          joinDate: '2020-09-15',
          hireDate: '2020-03-01',
          companyId: 'sukut-1',
          createdAt: '2020-09-15T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
          isActive: true,
          currentEquity: {
            id: 'eq3',
            memberId: '3',
            fiscalYear: currentFiscalYear,
            estimatedPercentage: 1.2,
            finalPercentage: 1.1,
            capitalBalance: 137500,
            isFinalized: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-15T00:00:00Z'
          },
          currentStatus: {
            id: 'st3',
            memberId: '3',
            fiscalYear: currentFiscalYear,
            status: 'active',
            effectiveDate: '2024-01-01',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        },
        yearsOfService: 3.3,
        currentEquityPercentage: 1.1,
        currentCapitalBalance: 137500,
        totalTaxPaymentsThisYear: 8800,
        totalDistributionsThisYear: 12000,
        recentActivity: []
      },
      {
        member: {
          id: '4',
          firstName: 'Lisa',
          lastName: 'Rodriguez',
          email: 'lisa.rodriguez@sukut.com',
          phone: '(555) 456-7890',
          jobTitle: 'Chief Financial Officer',
          joinDate: '2012-01-15',
          hireDate: '2011-08-01',
          companyId: 'sukut-1',
          createdAt: '2012-01-15T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
          isActive: true,
          currentEquity: {
            id: 'eq4',
            memberId: '4',
            fiscalYear: currentFiscalYear,
            estimatedPercentage: 12.5,
            finalPercentage: 12.3,
            capitalBalance: 1537500,
            isFinalized: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-15T00:00:00Z'
          },
          currentStatus: {
            id: 'st4',
            memberId: '4',
            fiscalYear: currentFiscalYear,
            status: 'active',
            effectiveDate: '2024-01-01',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        },
        yearsOfService: 12.8,
        currentEquityPercentage: 12.3,
        currentCapitalBalance: 1537500,
        totalTaxPaymentsThisYear: 98000,
        totalDistributionsThisYear: 125000,
        recentActivity: []
      },
      {
        member: {
          id: '5',
          firstName: 'David',
          lastName: 'Wilson',
          email: 'david.wilson@sukut.com',
          phone: '(555) 567-8901',
          jobTitle: 'Project Coordinator',
          joinDate: '2022-04-01',
          hireDate: '2021-11-15',
          companyId: 'sukut-1',
          createdAt: '2022-04-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
          isActive: true,
          currentEquity: {
            id: 'eq5',
            memberId: '5',
            fiscalYear: currentFiscalYear,
            estimatedPercentage: 0.8,
            finalPercentage: 0.75,
            capitalBalance: 93750,
            isFinalized: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-15T00:00:00Z'
          },
          currentStatus: {
            id: 'st5',
            memberId: '5',
            fiscalYear: currentFiscalYear,
            status: 'active',
            effectiveDate: '2024-01-01',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        },
        yearsOfService: 1.8,
        currentEquityPercentage: 0.75,
        currentCapitalBalance: 93750,
        totalTaxPaymentsThisYear: 6000,
        totalDistributionsThisYear: 8000,
        recentActivity: []
      }
    ]

    // Mock Group Analyses
    const groupAnalyses: GroupAnalysis[] = []

    // Mock recent activities
    const recentActivities = [
      {
        id: '1',
        type: 'equity_adjustment' as const,
        date: new Date().toISOString(),
        description: 'Equity percentage updated for Q4 review',
        details: {}
      },
      {
        id: '2',
        type: 'tax_payment' as const,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        description: 'Q4 estimated tax payment processed',
        amount: 25000,
        details: {}
      }
    ]

    // Mock upcoming deadlines
    const upcomingDeadlines = [
      {
        type: 'tax_payment',
        description: 'Q1 2024 Estimated Tax Payment Due',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high' as const
      },
      {
        type: 'board_meeting',
        description: 'Board Meeting - Equity Review',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'medium' as const
      }
    ]

    return {
      executiveSummary,
      memberSummaries,
      groupAnalyses,
      recentActivities,
      upcomingDeadlines
    }
  }, [currentFiscalYear])

  return {
    data: mockData,
    isLoading: false,
    error: null
  }
}