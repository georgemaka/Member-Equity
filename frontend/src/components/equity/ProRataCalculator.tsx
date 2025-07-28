import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calculator, Info, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Member {
  memberId: string;
  firstName: string;
  lastName: string;
  currentEquity: number;
  newEquity: number;
}

interface ProRataCalculatorProps {
  unallocated: number;
  members: Member[];
  onApply: (adjustments: any) => void;
}

interface ProRataAllocation {
  memberId: string;
  memberName: string;
  originalPercentage: number;
  additionalAllocation: number;
  finalPercentage: number;
}

const ProRataCalculator: React.FC<ProRataCalculatorProps> = ({
  unallocated,
  members,
  onApply,
}) => {
  const [excludedMembers, setExcludedMembers] = useState<Set<string>>(new Set());
  const [showCalculation, setShowCalculation] = useState(false);

  const eligibleMembers = useMemo(() => {
    return members.filter(m => !excludedMembers.has(m.memberId));
  }, [members, excludedMembers]);

  const calculations = useMemo((): ProRataAllocation[] => {
    if (Math.abs(unallocated) < 0.01) return [];

    const totalEligibleEquity = eligibleMembers.reduce(
      (sum, m) => sum + m.newEquity,
      0
    );

    if (totalEligibleEquity === 0) {
      // Equal distribution if all eligible members have 0 equity
      const equalShare = unallocated / eligibleMembers.length;
      return members.map(m => ({
        memberId: m.memberId,
        memberName: `${m.firstName} ${m.lastName}`,
        originalPercentage: m.newEquity,
        additionalAllocation: excludedMembers.has(m.memberId) ? 0 : equalShare,
        finalPercentage: m.newEquity + (excludedMembers.has(m.memberId) ? 0 : equalShare),
      }));
    }

    // Pro-rata distribution based on current equity
    let totalAllocated = 0;
    const allocations = members.map((member, index) => {
      const isExcluded = excludedMembers.has(member.memberId);
      let additionalAllocation = 0;

      if (!isExcluded) {
        const proRataShare = (member.newEquity / totalEligibleEquity) * unallocated;
        
        // Handle rounding for the last eligible member
        const isLastEligible = index === members.length - 1 || 
          members.slice(index + 1).every(m => excludedMembers.has(m.memberId));
        
        if (isLastEligible && !isExcluded) {
          additionalAllocation = unallocated - totalAllocated;
        } else {
          additionalAllocation = Math.round(proRataShare * 10000) / 10000;
          totalAllocated += additionalAllocation;
        }
      }

      return {
        memberId: member.memberId,
        memberName: `${member.firstName} ${member.lastName}`,
        originalPercentage: member.newEquity,
        additionalAllocation,
        finalPercentage: member.newEquity + additionalAllocation,
      };
    });

    return allocations;
  }, [members, unallocated, eligibleMembers, excludedMembers]);

  const totalAfterAdjustment = useMemo(() => {
    return calculations.reduce((sum, calc) => sum + calc.finalPercentage, 0);
  }, [calculations]);

  const toggleMemberExclusion = (memberId: string) => {
    const newExcluded = new Set(excludedMembers);
    if (newExcluded.has(memberId)) {
      newExcluded.delete(memberId);
    } else {
      newExcluded.add(memberId);
    }
    setExcludedMembers(newExcluded);
  };

  const handleApply = () => {
    const adjusted = members.map(member => {
      const calculation = calculations.find(c => c.memberId === member.memberId);
      return {
        ...member,
        newEquity: calculation?.finalPercentage || member.newEquity,
      };
    });

    onApply({
      original: members,
      adjusted,
      allocations: calculations,
      unallocated,
    });
  };

  if (Math.abs(unallocated) < 0.01) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Pro-Rata Distribution Calculator
        </CardTitle>
        <CardDescription>
          Distribute the {unallocated > 0 ? 'unallocated' : 'excess'} {Math.abs(unallocated).toFixed(4)}% 
          proportionally among eligible members
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {unallocated > 0 ? (
              <>
                The total equity is currently {(100 - unallocated).toFixed(4)}%, 
                leaving {unallocated.toFixed(4)}% unallocated. 
                This calculator will distribute it proportionally based on current equity holdings.
              </>
            ) : (
              <>
                The total equity is currently {(100 - unallocated).toFixed(4)}%, 
                which is {Math.abs(unallocated).toFixed(4)}% over 100%. 
                This calculator will reduce equity proportionally.
              </>
            )}
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Select Members to Include</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCalculation(!showCalculation)}
            >
              {showCalculation ? 'Hide' : 'Show'} Calculation
            </Button>
          </div>

          <div className="border rounded-lg max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Include</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead className="text-right">Current %</TableHead>
                  <TableHead className="text-right">Additional %</TableHead>
                  <TableHead className="text-right">Final %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculations.map((calc) => (
                  <TableRow key={calc.memberId}>
                    <TableCell>
                      <Checkbox
                        checked={!excludedMembers.has(calc.memberId)}
                        onCheckedChange={() => toggleMemberExclusion(calc.memberId)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{calc.memberName}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {calc.originalPercentage.toFixed(4)}%
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      <span className={cn(
                        calc.additionalAllocation > 0 ? 'text-green-600' : 
                        calc.additionalAllocation < 0 ? 'text-red-600' : 
                        'text-gray-400'
                      )}>
                        {calc.additionalAllocation > 0 && '+'}
                        {calc.additionalAllocation.toFixed(4)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">
                      {calc.finalPercentage.toFixed(4)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {showCalculation && (
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-sm">Calculation Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <strong>Total Eligible Equity:</strong> {
                  eligibleMembers.reduce((sum, m) => sum + m.newEquity, 0).toFixed(4)
                }%
              </p>
              <p>
                <strong>Unallocated Amount:</strong> {unallocated.toFixed(4)}%
              </p>
              <p>
                <strong>Distribution Method:</strong> Pro-rata based on current equity percentage
              </p>
              <div className="mt-2 p-2 bg-white rounded border font-mono text-xs">
                Additional Allocation = (Member Equity / Total Eligible Equity) × Unallocated Amount
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm">
            <span className="text-gray-500">Total after adjustment:</span>
            <span className={cn(
              'ml-2 font-semibold',
              Math.abs(totalAfterAdjustment - 100) < 0.01 ? 'text-green-600' : 'text-amber-600'
            )}>
              {totalAfterAdjustment.toFixed(4)}%
            </span>
          </div>
          
          <Button 
            onClick={handleApply}
            disabled={eligibleMembers.length === 0}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Apply Pro-Rata Distribution
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProRataCalculator;