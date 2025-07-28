import * as React from "react"

// This is a simplified version that uses the existing toast context
import { useToast as useToastContext } from "@/contexts/ToastContext"

export function useToast() {
  const { success, error, info } = useToastContext()
  
  return {
    toast: ({ title, description, variant = "default" }: {
      title: string
      description?: string
      variant?: "default" | "destructive"
    }) => {
      if (variant === "destructive") {
        error(title, description || "")
      } else {
        success(title, description || "")
      }
    },
    success,
    error,
    info,
  }
}