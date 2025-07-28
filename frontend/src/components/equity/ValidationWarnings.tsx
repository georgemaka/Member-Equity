import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  XCircle, 
  Info,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationWarningsProps {
  errors: string[];
  warnings: string[];
  totalBefore: number;
  totalAfter: number;
}

type WarningLevel = 'error' | 'warning' | 'info';

interface ParsedWarning {
  level: WarningLevel;
  category: string;
  message: string;
  details?: string;
}

const ValidationWarnings: React.FC<ValidationWarningsProps> = ({
  errors,
  warnings,
  totalBefore,
  totalAfter,
}) => {
  const parseWarning = (warning: string): ParsedWarning => {
    // Parse large change warnings
    if (warning.includes('Large equity change')) {
      const match = warning.match(/of ([-\d.]+)% for (.+)$/);
      if (match) {
        const change = parseFloat(match[1]);
        const member = match[2];
        return {
          level: Math.abs(change) > 20 ? 'error' : 'warning',
          category: 'Large Change',
          message: `${member} has a ${Math.abs(change) > 20 ? 'very large' : 'large'} equity change`,
          details: `${change > 0 ? '+' : ''}${change.toFixed(2)}%`,
        };
      }
    }

    // Parse missing reason warnings
    if (warning.includes('without a reason')) {
      const match = warning.match(/(.+) has equity change of ([-\d.]+)%/);
      if (match) {
        return {
          level: 'warning',
          category: 'Missing Reason',
          message: `${match[1]} has an unexplained change`,
          details: `${parseFloat(match[2]) > 0 ? '+' : ''}${match[2]}%`,
        };
      }
    }

    // Parse inactive member warnings
    if (warning.includes('status') && warning.includes('but is assigned')) {
      return {
        level: 'warning',
        category: 'Inactive Member',
        message: warning,
      };
    }

    // Parse total equity warnings
    if (warning.includes('Total equity')) {
      const match = warning.match(/is ([\d.]+)%.*Difference: ([\d.]+)%/);
      if (match) {
        const total = parseFloat(match[1]);
        const diff = parseFloat(match[2]);
        return {
          level: diff > 1 ? 'error' : 'warning',
          category: 'Total Mismatch',
          message: 'Total equity does not equal 100%',
          details: `${total.toFixed(4)}% (${diff > 0 ? '+' : '-'}${diff.toFixed(4)}%)`,
        };
      }
    }

    // Default parsing
    return {
      level: 'info',
      category: 'Other',
      message: warning,
    };
  };

  const parsedWarnings = warnings.map(parseWarning);
  const warningsByCategory = parsedWarnings.reduce((acc, warning) => {
    if (!acc[warning.category]) {
      acc[warning.category] = [];
    }
    acc[warning.category].push(warning);
    return acc;
  }, {} as Record<string, ParsedWarning[]>);

  const totalDifference = totalAfter - 100;
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;
  const isValid = !hasErrors && Math.abs(totalDifference) <= 1;

  const getIcon = (level: WarningLevel) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Large Change':
        return totalAfter > totalBefore ? 
          <TrendingUp className="h-4 w-4" /> : 
          <TrendingDown className="h-4 w-4" />;
      case 'Inactive Member':
        return <Users className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Overall Status */}
      <Alert className={cn(
        hasErrors ? 'border-red-500 bg-red-50' :
        hasWarnings ? 'border-amber-500 bg-amber-50' :
        'border-green-500 bg-green-50'
      )}>
        <div className="flex items-start gap-2">
          {hasErrors ? (
            <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
          ) : hasWarnings ? (
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          )}
          <div className="flex-1">
            <AlertTitle className={cn(
              hasErrors ? 'text-red-800' :
              hasWarnings ? 'text-amber-800' :
              'text-green-800'
            )}>
              {hasErrors ? 'Validation Failed' :
               hasWarnings ? 'Validation Passed with Warnings' :
               'Validation Passed'}
            </AlertTitle>
            <AlertDescription className={cn(
              'mt-1',
              hasErrors ? 'text-red-700' :
              hasWarnings ? 'text-amber-700' :
              'text-green-700'
            )}>
              {hasErrors ? 
                `Found ${errors.length} error${errors.length > 1 ? 's' : ''} that must be resolved` :
               hasWarnings ?
                `Found ${warnings.length} warning${warnings.length > 1 ? 's' : ''}. Review before proceeding` :
                'All validation checks passed successfully'}
            </AlertDescription>
          </div>
        </div>
      </Alert>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-red-700">Errors</h4>
          <div className="space-y-2">
            {errors.map((error, index) => (
              <Alert key={index} className="border-red-300 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Warnings by Category */}
      {Object.entries(warningsByCategory).map(([category, categoryWarnings]) => (
        <div key={category} className="space-y-2">
          <h4 className="text-sm font-semibold text-amber-700 flex items-center gap-2">
            {getCategoryIcon(category)}
            {category}
            <span className="text-xs font-normal text-gray-500">
              ({categoryWarnings.length})
            </span>
          </h4>
          <div className="space-y-2">
            {categoryWarnings.map((warning, index) => (
              <Alert 
                key={index} 
                className={cn(
                  warning.level === 'error' ? 'border-red-300 bg-red-50' :
                  warning.level === 'warning' ? 'border-amber-300 bg-amber-50' :
                  'border-blue-300 bg-blue-50'
                )}
              >
                <div className="flex items-start gap-2">
                  {getIcon(warning.level)}
                  <div className="flex-1">
                    <AlertDescription className={cn(
                      warning.level === 'error' ? 'text-red-700' :
                      warning.level === 'warning' ? 'text-amber-700' :
                      'text-blue-700'
                    )}>
                      {warning.message}
                      {warning.details && (
                        <span className="ml-2 font-semibold">
                          {warning.details}
                        </span>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </div>
      ))}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
        <div className="space-y-1">
          <div className="text-sm text-gray-500">Total Before</div>
          <div className="text-xl font-semibold">{totalBefore.toFixed(4)}%</div>
        </div>
        <div className="space-y-1">
          <div className="text-sm text-gray-500">Total After</div>
          <div className={cn(
            "text-xl font-semibold",
            Math.abs(totalDifference) < 0.01 ? 'text-green-600' :
            Math.abs(totalDifference) < 1 ? 'text-amber-600' :
            'text-red-600'
          )}>
            {totalAfter.toFixed(4)}%
            {Math.abs(totalDifference) > 0.01 && (
              <span className="text-sm font-normal ml-1">
                ({totalDifference > 0 ? '+' : ''}{totalDifference.toFixed(4)}%)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationWarnings;