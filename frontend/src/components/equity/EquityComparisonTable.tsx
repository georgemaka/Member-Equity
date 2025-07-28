import React, { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Minus, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EquityUpdate {
  memberId: string;
  firstName: string;
  lastName: string;
  email: string;
  currentEquity: number;
  newEquity: number;
  change: number;
  changeReason?: string;
}

interface EquityComparisonTableProps {
  updates: EquityUpdate[];
  showWarnings?: boolean;
}

const EquityComparisonTable: React.FC<EquityComparisonTableProps> = ({
  updates,
  showWarnings = true,
}) => {
  const sortedUpdates = useMemo(() => {
    return [...updates].sort((a, b) => {
      // Sort by absolute change amount (largest first)
      return Math.abs(b.change) - Math.abs(a.change);
    });
  }, [updates]);

  const totals = useMemo(() => {
    return updates.reduce(
      (acc, update) => ({
        currentTotal: acc.currentTotal + update.currentEquity,
        newTotal: acc.newTotal + update.newEquity,
        changeTotal: acc.changeTotal + update.change,
      }),
      { currentTotal: 0, newTotal: 0, changeTotal: 0 }
    );
  }, [updates]);

  const getChangeIcon = (change: number) => {
    if (Math.abs(change) < 0.01) return <Minus className="h-4 w-4 text-gray-400" />;
    if (change > 0) return <ArrowUp className="h-4 w-4 text-green-600" />;
    return <ArrowDown className="h-4 w-4 text-red-600" />;
  };

  const getChangeBadge = (change: number) => {
    const absChange = Math.abs(change);
    if (absChange < 0.01) {
      return <Badge variant="secondary">No Change</Badge>;
    }
    
    const variant = change > 0 ? 'default' : 'destructive';
    const isLarge = absChange > 10;
    
    return (
      <Badge variant={variant} className={cn(isLarge && 'font-bold')}>
        {change > 0 ? '+' : ''}{change.toFixed(4)}%
        {isLarge && showWarnings && (
          <AlertTriangle className="ml-1 h-3 w-3" />
        )}
      </Badge>
    );
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(4)}%`;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead className="text-right">Current Equity</TableHead>
              <TableHead className="text-right">New Equity</TableHead>
              <TableHead className="text-center">Change</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUpdates.map((update) => (
              <TableRow 
                key={update.memberId}
                className={cn(
                  Math.abs(update.change) > 10 && showWarnings && 'bg-yellow-50'
                )}
              >
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {update.firstName} {update.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{update.email}</div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatPercentage(update.currentEquity)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatPercentage(update.newEquity)}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    {getChangeIcon(update.change)}
                    {getChangeBadge(update.change)}
                  </div>
                </TableCell>
                <TableCell>
                  {update.changeReason || (
                    Math.abs(update.change) > 0.01 && showWarnings ? (
                      <span className="text-amber-600 text-sm flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        No reason provided
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )
                  )}
                </TableCell>
              </TableRow>
            ))}
            
            {/* Totals Row */}
            <TableRow className="bg-gray-50 font-semibold">
              <TableCell>Total</TableCell>
              <TableCell className="text-right font-mono">
                {formatPercentage(totals.currentTotal)}
              </TableCell>
              <TableCell className="text-right font-mono">
                <span className={cn(
                  Math.abs(totals.newTotal - 100) > 0.01 && 'text-amber-600'
                )}>
                  {formatPercentage(totals.newTotal)}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-2">
                  {getChangeIcon(totals.changeTotal)}
                  <span>{totals.changeTotal > 0 ? '+' : ''}{totals.changeTotal.toFixed(4)}%</span>
                </div>
              </TableCell>
              <TableCell>
                {Math.abs(totals.newTotal - 100) > 0.01 && showWarnings && (
                  <span className="text-amber-600 text-sm flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Total not 100%
                  </span>
                )}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500">Total Members</div>
          <div className="text-2xl font-semibold">{updates.length}</div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500">Changes</div>
          <div className="text-2xl font-semibold">
            {updates.filter(u => Math.abs(u.change) > 0.01).length}
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500">Increases</div>
          <div className="text-2xl font-semibold text-green-600">
            {updates.filter(u => u.change > 0.01).length}
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500">Decreases</div>
          <div className="text-2xl font-semibold text-red-600">
            {updates.filter(u => u.change < -0.01).length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquityComparisonTable;