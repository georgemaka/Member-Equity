import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

export interface ProRataAllocation {
  memberId: string;
  originalPercentage: number;
  additionalAllocation: number;
  finalPercentage: number;
}

@Injectable()
export class ProRataDistributionService {
  /**
   * Calculate pro-rata distribution of unallocated equity
   * @param members Array of members with their current equity percentages
   * @param unallocatedPercentage The percentage to distribute
   * @param excludeMemberIds Member IDs to exclude from receiving additional allocation
   * @returns Array of members with their pro-rata allocations
   */
  calculateProRataDistribution(
    members: Array<{ id: string; equityPercentage: Decimal }>,
    unallocatedPercentage: number,
    excludeMemberIds: string[] = []
  ): ProRataAllocation[] {
    // Filter eligible members (those not excluded)
    const eligibleMembers = members.filter(
      member => !excludeMemberIds.includes(member.id)
    );

    if (eligibleMembers.length === 0) {
      throw new Error('No eligible members for pro-rata distribution');
    }

    // Calculate total current equity of eligible members
    const totalEligibleEquity = eligibleMembers.reduce(
      (sum, member) => sum + parseFloat(member.equityPercentage.toString()),
      0
    );

    if (totalEligibleEquity === 0) {
      // If all eligible members have 0 equity, distribute equally
      const equalShare = unallocatedPercentage / eligibleMembers.length;
      
      return members.map(member => ({
        memberId: member.id,
        originalPercentage: parseFloat(member.equityPercentage.toString()),
        additionalAllocation: excludeMemberIds.includes(member.id) ? 0 : equalShare,
        finalPercentage: parseFloat(member.equityPercentage.toString()) + 
          (excludeMemberIds.includes(member.id) ? 0 : equalShare),
      }));
    }

    // Calculate pro-rata allocations
    const allocations: ProRataAllocation[] = [];
    let totalAllocated = 0;

    members.forEach((member, index) => {
      const originalPercentage = parseFloat(member.equityPercentage.toString());
      let additionalAllocation = 0;

      if (!excludeMemberIds.includes(member.id)) {
        // Calculate pro-rata share based on current equity percentage
        const proRataShare = (originalPercentage / totalEligibleEquity) * unallocatedPercentage;
        
        // For the last eligible member, allocate any remaining amount due to rounding
        const isLastEligible = index === members.length - 1 || 
          members.slice(index + 1).every(m => excludeMemberIds.includes(m.id));
        
        if (isLastEligible && !excludeMemberIds.includes(member.id)) {
          additionalAllocation = unallocatedPercentage - totalAllocated;
        } else {
          additionalAllocation = Math.round(proRataShare * 10000) / 10000; // Round to 4 decimal places
          totalAllocated += additionalAllocation;
        }
      }

      allocations.push({
        memberId: member.id,
        originalPercentage,
        additionalAllocation,
        finalPercentage: originalPercentage + additionalAllocation,
      });
    });

    return allocations;
  }

  /**
   * Calculate adjustments needed when a member's equity is reduced
   * @param members All members with their equity
   * @param reducedMemberId The member whose equity is being reduced
   * @param reductionAmount The amount of reduction
   * @returns Pro-rata allocations for remaining members
   */
  calculateReductionReallocation(
    members: Array<{ id: string; equityPercentage: Decimal }>,
    reducedMemberId: string,
    reductionAmount: number
  ): ProRataAllocation[] {
    return this.calculateProRataDistribution(
      members,
      reductionAmount,
      [reducedMemberId]
    );
  }

  /**
   * Validate that total equity equals 100% within tolerance
   * @param allocations The allocations to validate
   * @param tolerance Acceptable deviation from 100% (default 0.01%)
   * @returns Validation result with total and any deviation
   */
  validateTotalEquity(
    allocations: ProRataAllocation[],
    tolerance = 0.01
  ): { isValid: boolean; total: number; deviation: number } {
    const total = allocations.reduce(
      (sum, allocation) => sum + allocation.finalPercentage,
      0
    );
    
    const deviation = Math.abs(100 - total);
    
    return {
      isValid: deviation <= tolerance,
      total,
      deviation,
    };
  }

  /**
   * Adjust allocations to ensure exactly 100% total
   * @param allocations The allocations to adjust
   * @returns Adjusted allocations that sum to exactly 100%
   */
  adjustToExactTotal(allocations: ProRataAllocation[]): ProRataAllocation[] {
    const total = allocations.reduce(
      (sum, allocation) => sum + allocation.finalPercentage,
      0
    );
    
    const difference = 100 - total;
    
    if (Math.abs(difference) < 0.0001) {
      return allocations; // Already close enough
    }

    // Find the member with the largest allocation to absorb the difference
    const largestAllocationIndex = allocations.reduce(
      (maxIndex, allocation, index) => 
        allocation.finalPercentage > allocations[maxIndex].finalPercentage ? index : maxIndex,
      0
    );

    // Create a copy and adjust
    const adjusted = allocations.map((allocation, index) => ({
      ...allocation,
      finalPercentage: index === largestAllocationIndex
        ? allocation.finalPercentage + difference
        : allocation.finalPercentage,
    }));

    return adjusted;
  }
}