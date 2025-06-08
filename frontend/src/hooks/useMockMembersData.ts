import { useMemo } from 'react'
import { PaginatedMembers, Member } from '@/types/member'
import { useFiscalYear } from '@/contexts/FiscalYearContext'

export function useMockMembersData(page: number = 1, limit: number = 10) {
  const { currentFiscalYear } = useFiscalYear()

  const mockData = useMemo<PaginatedMembers>(() => {
    // Generate mock members
    const mockMembers: Member[] = [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@sukut.com',
        phone: '(555) 123-4567',
        address: '123 Main Street',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90210',
        jobTitle: 'Senior Project Manager',
        socialSecurityNumber: 'xxx-xx-1234',
        taxId: 'T001',
        employeeId: 'E001',
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
      {
        id: '2',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@sukut.com',
        phone: '(555) 234-5678',
        address: '456 Oak Avenue',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90211',
        jobTitle: 'Executive Vice President',
        socialSecurityNumber: 'xxx-xx-5678',
        taxId: 'T002',
        employeeId: 'E002',
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
      {
        id: '3',
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'michael.chen@sukut.com',
        phone: '(555) 345-6789',
        address: '789 Pine Street',
        city: 'Beverly Hills',
        state: 'CA',
        zipCode: '90212',
        jobTitle: 'Operations Manager',
        socialSecurityNumber: 'xxx-xx-9012',
        taxId: 'T003',
        employeeId: 'E003',
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
      {
        id: '4',
        firstName: 'Lisa',
        lastName: 'Rodriguez',
        email: 'lisa.rodriguez@sukut.com',
        phone: '(555) 456-7890',
        address: '321 Elm Drive',
        city: 'Santa Monica',
        state: 'CA',
        zipCode: '90213',
        jobTitle: 'Chief Financial Officer',
        socialSecurityNumber: 'xxx-xx-3456',
        taxId: 'T004',
        employeeId: 'E004',
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
      {
        id: '5',
        firstName: 'David',
        lastName: 'Wilson',
        email: 'david.wilson@sukut.com',
        phone: '(555) 567-8901',
        address: '654 Maple Court',
        city: 'Culver City',
        state: 'CA',
        zipCode: '90214',
        jobTitle: 'Project Coordinator',
        socialSecurityNumber: 'xxx-xx-7890',
        taxId: 'T005',
        employeeId: 'E005',
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
      {
        id: '6',
        firstName: 'Robert',
        lastName: 'Thompson',
        email: 'robert.thompson@sukut.com',
        phone: '(555) 678-9012',
        address: '987 Cedar Lane',
        city: 'Manhattan Beach',
        state: 'CA',
        zipCode: '90215',
        jobTitle: 'Senior Engineer',
        socialSecurityNumber: 'xxx-xx-2345',
        taxId: 'T006',
        employeeId: 'E006',
        joinDate: '2010-08-20',
        hireDate: '2009-05-15',
        companyId: 'sukut-1',
        createdAt: '2010-08-20T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
        isActive: false,
        currentEquity: {
          id: 'eq6',
          memberId: '6',
          fiscalYear: currentFiscalYear,
          estimatedPercentage: 0,
          finalPercentage: 0,
          capitalBalance: 750000,
          isFinalized: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        currentStatus: {
          id: 'st6',
          memberId: '6',
          fiscalYear: currentFiscalYear,
          status: 'retired',
          effectiveDate: '2023-12-31',
          createdAt: '2023-12-31T00:00:00Z',
          updatedAt: '2023-12-31T00:00:00Z'
        }
      }
    ]

    // Apply pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedMembers = mockMembers.slice(startIndex, endIndex)

    return {
      members: paginatedMembers,
      total: mockMembers.length,
      page,
      limit,
      totalPages: Math.ceil(mockMembers.length / limit)
    }
  }, [currentFiscalYear, page, limit])

  return {
    data: mockData,
    isLoading: false,
    error: null
  }
}