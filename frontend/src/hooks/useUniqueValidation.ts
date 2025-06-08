import { useMockMembersData } from './useMockMembersData'

export function useUniqueValidation() {
  // Get all members for uniqueness checking
  const { data: membersData } = useMockMembersData(1, 1000) // Get all members
  const members = membersData?.data || []

  const validateUniqueField = (field: 'email' | 'socialSecurityNumber' | 'taxId' | 'employeeId', value: string, excludeMemberId?: string): string | null => {
    if (!value || value.trim() === '') {
      return null // Skip validation for empty values
    }

    const normalizedValue = value.trim().toLowerCase()
    const existingMember = members.find(member => {
      if (excludeMemberId && member.id === excludeMemberId) {
        return false // Skip the member being edited
      }
      
      const memberValue = member[field]?.toLowerCase()
      
      return memberValue === normalizedValue
    })

    if (existingMember) {
      const fieldName = {
        email: 'Email address',
        socialSecurityNumber: 'Social Security Number', 
        taxId: 'Tax ID',
        employeeId: 'Employee ID'
      }[field]
      
      return `${fieldName} "${value}" is already in use by ${existingMember.firstName} ${existingMember.lastName}`
    }

    return null
  }

  return {
    validateUniqueEmail: (value: string, excludeMemberId?: string) => 
      validateUniqueField('email', value, excludeMemberId),
    validateUniqueSSN: (value: string, excludeMemberId?: string) => 
      validateUniqueField('socialSecurityNumber', value, excludeMemberId),
    validateUniqueTaxId: (value: string, excludeMemberId?: string) => 
      validateUniqueField('taxId', value, excludeMemberId),
    validateUniqueEmployeeId: (value: string, excludeMemberId?: string) => 
      validateUniqueField('employeeId', value, excludeMemberId),
  }
}