import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface ErrorMessageProps {
  title?: string
  message: string
  onRetry?: () => void
}

export default function ErrorMessage({ 
  title = 'Error', 
  message, 
  onRetry 
}: ErrorMessageProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
        <p className="text-gray-600 mb-4">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full bg-sukut-600 text-white px-4 py-2 rounded-md hover:bg-sukut-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}