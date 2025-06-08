// Validation utility functions
import { useState } from 'react'

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
  email?: boolean
  phone?: boolean
  numeric?: boolean
  percentage?: boolean
  positiveNumber?: boolean
}

export interface ValidationSchema {
  [field: string]: ValidationRule
}

export function validateSingleField(value: any, rule: ValidationRule, fieldName: string): string | null {
  // Required validation
  if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return `${fieldName} is required`
  }

  // Skip other validations if field is empty and not required
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return null
  }

  const stringValue = String(value).trim()

  // Min length validation
  if (rule.minLength && stringValue.length < rule.minLength) {
    return `${fieldName} must be at least ${rule.minLength} characters`
  }

  // Max length validation
  if (rule.maxLength && stringValue.length > rule.maxLength) {
    return `${fieldName} must be no more than ${rule.maxLength} characters`
  }

  // Email validation
  if (rule.email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(stringValue)) {
      return `${fieldName} must be a valid email address`
    }
  }

  // Phone validation
  if (rule.phone) {
    const phonePattern = /^[\+]?[\d\s\-\(\)\.]{10,}$/
    if (!phonePattern.test(stringValue.replace(/\s/g, ''))) {
      return `${fieldName} must be a valid phone number`
    }
  }

  // Numeric validation
  if (rule.numeric) {
    if (isNaN(Number(stringValue))) {
      return `${fieldName} must be a valid number`
    }
  }

  // Percentage validation
  if (rule.percentage) {
    const num = Number(stringValue)
    if (isNaN(num) || num < 0 || num > 100) {
      return `${fieldName} must be a percentage between 0 and 100`
    }
  }

  // Positive number validation
  if (rule.positiveNumber) {
    const num = Number(stringValue)
    if (isNaN(num) || num < 0) {
      return `${fieldName} must be a positive number`
    }
  }

  // Pattern validation
  if (rule.pattern && !rule.pattern.test(stringValue)) {
    return `${fieldName} format is invalid`
  }

  // Custom validation
  if (rule.custom) {
    const customError = rule.custom(value)
    if (customError) {
      return customError
    }
  }

  return null
}

export function validateSchema(data: Record<string, any>, schema: ValidationSchema): ValidationResult {
  const errors: Record<string, string> = {}

  for (const [field, rule] of Object.entries(schema)) {
    const error = validateSingleField(data[field], rule, field)
    if (error) {
      errors[field] = error
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Common validation schemas
export const memberValidationSchema: ValidationSchema = {
  firstName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s'-]+$/
  },
  lastName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s'-]+$/
  },
  email: {
    required: true,
    email: true,
    maxLength: 100
  },
  phone: {
    phone: true
  },
  jobTitle: {
    maxLength: 100
  },
  joinDate: {
    required: true,
    custom: (value) => {
      if (!value) return null
      const date = new Date(value)
      const today = new Date()
      if (date > today) {
        return 'Join date cannot be in the future'
      }
      if (date < new Date('1900-01-01')) {
        return 'Join date cannot be before 1900'
      }
      return null
    }
  },
  hireDate: {
    custom: (value) => {
      if (!value) return null
      const date = new Date(value)
      const today = new Date()
      if (date > today) {
        return 'Hire date cannot be in the future'
      }
      if (date < new Date('1900-01-01')) {
        return 'Hire date cannot be before 1900'
      }
      return null
    }
  },
  address: {
    maxLength: 200
  },
  city: {
    maxLength: 100,
    pattern: /^[a-zA-Z\s'-]+$/
  },
  state: {
    maxLength: 50,
    pattern: /^[a-zA-Z\s'-]+$/
  },
  zipCode: {
    pattern: /^\d{5}(-\d{4})?$/
  }
}

export const equityValidationSchema: ValidationSchema = {
  estimatedPercentage: {
    required: true,
    percentage: true,
    custom: (value) => {
      const num = Number(value)
      if (num > 0 && num < 0.01) {
        return 'Percentage must be at least 0.01%'
      }
      return null
    }
  },
  finalPercentage: {
    percentage: true,
    custom: (value) => {
      if (!value) return null
      const num = Number(value)
      if (num > 0 && num < 0.01) {
        return 'Percentage must be at least 0.01%'
      }
      return null
    }
  },
  capitalBalance: {
    positiveNumber: true
  }
}

export const taxPaymentValidationSchema: ValidationSchema = {
  amount: {
    required: true,
    positiveNumber: true,
    custom: (value) => {
      const num = Number(value)
      if (num > 10000000) {
        return 'Amount seems unusually large. Please verify.'
      }
      return null
    }
  },
  paymentDate: {
    required: true,
    custom: (value) => {
      if (!value) return null
      const date = new Date(value)
      const today = new Date()
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(today.getFullYear() - 1)
      
      if (date > today) {
        return 'Payment date cannot be in the future'
      }
      if (date < oneYearAgo) {
        return 'Payment date cannot be more than one year ago'
      }
      return null
    }
  },
  paymentType: {
    required: true
  },
  notes: {
    maxLength: 500
  }
}

// Real-time validation hook
export function useFormValidation(schema: ValidationSchema) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validateFieldValue = (field: string, value: any) => {
    const rule = schema[field]
    if (!rule) return

    const error = validateSingleField(value, rule, field)
    setErrors(prev => ({
      ...prev,
      [field]: error || ''
    }))
  }

  const touchField = (field: string) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }))
  }

  const validateAll = (data: Record<string, any>) => {
    const result = validateSchema(data, schema)
    setErrors(result.errors)
    
    // Mark all fields as touched
    const allTouched = Object.keys(schema).reduce((acc, field) => {
      acc[field] = true
      return acc
    }, {} as Record<string, boolean>)
    setTouched(allTouched)
    
    return result
  }

  const clearErrors = () => {
    setErrors({})
    setTouched({})
  }

  const getFieldError = (field: string) => {
    return touched[field] ? errors[field] : ''
  }

  return {
    errors,
    touched,
    validateField: validateFieldValue,
    touchField,
    validateAll,
    clearErrors,
    getFieldError,
    hasErrors: Object.values(errors).some(error => error !== '')
  }
}

// Helper function to format validation errors for display
export function formatValidationError(error: string): string {
  return error.charAt(0).toUpperCase() + error.slice(1)
}

// Helper to check if form is valid for submission
export function isFormReady(data: Record<string, any>, schema: ValidationSchema): boolean {
  const result = validateSchema(data, schema)
  return result.isValid
}