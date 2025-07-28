import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EventBusService } from '../../events/event-bus.service';
import { 
  BoardApproval, 
  BoardApprovalStatus, 
  BoardApprovalType,
  EquityEventType,
  Prisma 
} from '@prisma/client';
import { BulkEquityUpdateDto, MemberEquityUpdateDto } from '../dto/bulk-equity-update.dto';
import { ProRataDistributionService } from './pro-rata-distribution.service';
import { Decimal } from '@prisma/client/runtime/library';

export interface BoardApprovalValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  totalBefore: number;
  totalAfter: number;
  largeChanges: Array<{
    memberId: string;
    memberName: string;
    changePercentage: number;
  }>;
}

@Injectable()
export class BoardApprovalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
    private readonly proRataService: ProRataDistributionService,
  ) {}

  async createBoardApproval(
    companyId: string,
    dto: BulkEquityUpdateDto,
    submittedBy: string
  ): Promise<{ approval: BoardApproval; validation: BoardApprovalValidation }> {
    // Validate the equity updates
    const validation = await this.validateEquityUpdates(companyId, dto.updates);
    
    if (!validation.isValid && !dto.forceApply) {
      throw new BadRequestException({
        message: 'Validation failed',
        validation,
      });
    }

    // Create board approval and equity updates in a transaction
    const approval = await this.prisma.$transaction(async (tx) => {
      // Create board approval
      const boardApproval = await tx.boardApproval.create({
        data: {
          companyId,
          title: dto.boardApprovalTitle,
          description: dto.boardApprovalDescription,
          approvalType: dto.boardApprovalType,
          approvalDate: new Date(dto.boardApprovalDate),
          effectiveDate: new Date(dto.effectiveDate),
          status: BoardApprovalStatus.DRAFT,
          totalEquityBefore: validation.totalBefore,
          totalEquityAfter: validation.totalAfter,
          documentUrls: dto.documentUrls || [],
          metadata: {
            fiscalYear: new Date(dto.effectiveDate).getFullYear(),
            warnings: validation.warnings,
            forceApplied: dto.forceApply || false,
          },
          submittedBy,
          notes: dto.notes,
        },
      });

      // Create equity update records
      const equityUpdates = await Promise.all(
        dto.updates.map(async (update) => {
          const member = await tx.member.findUnique({
            where: { id: update.memberId },
          });

          if (!member) {
            throw new NotFoundException(`Member ${update.memberId} not found`);
          }

          const previousPercentage = parseFloat(member.equityPercentage.toString());
          const changePercentage = update.newEquityPercentage - previousPercentage;

          return tx.equityUpdate.create({
            data: {
              boardApprovalId: boardApproval.id,
              memberId: update.memberId,
              previousPercentage: member.equityPercentage,
              newPercentage: update.newEquityPercentage,
              changePercentage,
              changeReason: update.changeReason,
              warnings: this.getMemberWarnings(member, update, changePercentage),
            },
          });
        })
      );

      return boardApproval;
    });

    // Emit event
    await this.eventBus.emit('board.approval.created', {
      approvalId: approval.id,
      companyId,
      submittedBy,
      totalMembers: dto.updates.length,
      effectiveDate: approval.effectiveDate,
    });

    return { approval, validation };
  }

  async validateEquityUpdates(
    companyId: string,
    updates: MemberEquityUpdateDto[]
  ): Promise<BoardApprovalValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const largeChanges: BoardApprovalValidation['largeChanges'] = [];

    // Get all members
    const members = await this.prisma.member.findMany({
      where: { companyId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        equityPercentage: true,
        status: true,
      },
    });

    const memberMap = new Map(members.map(m => [m.id, m]));
    const updateMap = new Map(updates.map(u => [u.memberId, u]));

    let totalBefore = 0;
    let totalAfter = 0;

    // Validate each update
    for (const update of updates) {
      const member = memberMap.get(update.memberId);
      
      if (!member) {
        errors.push(`Member ${update.memberId} not found`);
        continue;
      }

      const currentEquity = parseFloat(member.equityPercentage.toString());
      totalBefore += currentEquity;
      totalAfter += update.newEquityPercentage;

      // Check for invalid values
      if (update.newEquityPercentage < 0 || update.newEquityPercentage > 100) {
        errors.push(
          `Invalid equity percentage ${update.newEquityPercentage} for ${member.firstName} ${member.lastName}`
        );
      }

      // Check for large changes
      const changePercentage = update.newEquityPercentage - currentEquity;
      if (Math.abs(changePercentage) > 10) {
        largeChanges.push({
          memberId: member.id,
          memberName: `${member.firstName} ${member.lastName}`,
          changePercentage,
        });
        warnings.push(
          `Large equity change of ${changePercentage.toFixed(4)}% for ${member.firstName} ${member.lastName}`
        );
      }

      // Check for changes without reason
      if (Math.abs(changePercentage) > 0.01 && !update.changeReason) {
        warnings.push(
          `No reason provided for equity change of ${changePercentage.toFixed(4)}% for ${member.firstName} ${member.lastName}`
        );
      }

      // Check inactive members with equity
      if (member.status !== 'ACTIVE' && member.status !== 'PROBATIONARY' && update.newEquityPercentage > 0) {
        warnings.push(
          `${member.firstName} ${member.lastName} has status ${member.status} but is assigned ${update.newEquityPercentage}% equity`
        );
      }
    }

    // Check for missing active members
    const activeMemberIds = members
      .filter(m => m.status === 'ACTIVE' || m.status === 'PROBATIONARY')
      .map(m => m.id);
    
    const missingMembers = activeMemberIds.filter(id => !updateMap.has(id));
    if (missingMembers.length > 0) {
      missingMembers.forEach(id => {
        const member = memberMap.get(id)!;
        totalBefore += parseFloat(member.equityPercentage.toString());
        warnings.push(
          `Active member ${member.firstName} ${member.lastName} not included in update`
        );
      });
    }

    // Check total equity
    const totalDifference = Math.abs(totalAfter - 100);
    if (totalDifference > 0.01) {
      warnings.push(
        `Total equity after update is ${totalAfter.toFixed(4)}%, not 100%. Difference: ${totalDifference.toFixed(4)}%`
      );
      
      if (totalDifference > 1) {
        errors.push(`Total equity deviation too large: ${totalDifference.toFixed(4)}%`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalBefore,
      totalAfter,
      largeChanges,
    };
  }

  async approveBoardApproval(
    approvalId: string,
    approvedBy: string
  ): Promise<BoardApproval> {
    const approval = await this.prisma.boardApproval.findUnique({
      where: { id: approvalId },
      include: { updates: true },
    });

    if (!approval) {
      throw new NotFoundException('Board approval not found');
    }

    if (approval.status !== BoardApprovalStatus.DRAFT && 
        approval.status !== BoardApprovalStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Board approval cannot be approved in current status');
    }

    const updatedApproval = await this.prisma.boardApproval.update({
      where: { id: approvalId },
      data: {
        status: BoardApprovalStatus.APPROVED,
        approvedBy,
        approvedAt: new Date(),
      },
    });

    await this.eventBus.emit('board.approval.approved', {
      approvalId,
      approvedBy,
      effectiveDate: approval.effectiveDate,
    });

    return updatedApproval;
  }

  async applyBoardApproval(approvalId: string): Promise<void> {
    const approval = await this.prisma.boardApproval.findUnique({
      where: { id: approvalId },
      include: { updates: true },
    });

    if (!approval) {
      throw new NotFoundException('Board approval not found');
    }

    if (approval.status !== BoardApprovalStatus.APPROVED) {
      throw new BadRequestException('Board approval must be approved before applying');
    }

    // Apply all equity updates in a transaction
    await this.prisma.$transaction(async (tx) => {
      for (const update of approval.updates) {
        // Update member equity
        await tx.member.update({
          where: { id: update.memberId },
          data: { equityPercentage: update.newPercentage },
        });

        // Create equity event
        await tx.equityEvent.create({
          data: {
            memberId: update.memberId,
            eventType: EquityEventType.BOARD_APPROVED_UPDATE,
            previousPercentage: update.previousPercentage,
            newPercentage: update.newPercentage,
            effectiveDate: approval.effectiveDate,
            reason: update.changeReason || approval.title,
            boardApprovalId: approval.id,
            metadata: {
              approvalType: approval.approvalType,
              changePercentage: update.changePercentage,
            },
          },
        });
      }

      // Update approval status
      await tx.boardApproval.update({
        where: { id: approvalId },
        data: { status: BoardApprovalStatus.APPLIED },
      });
    });

    await this.eventBus.emit('board.approval.applied', {
      approvalId,
      updatesCount: approval.updates.length,
      effectiveDate: approval.effectiveDate,
    });
  }

  async calculateProRataAdjustment(
    companyId: string,
    excludeMemberIds: string[] = []
  ): Promise<any> {
    const members = await this.prisma.member.findMany({
      where: {
        companyId,
        status: { in: ['ACTIVE', 'PROBATIONARY'] },
      },
    });

    const totalEquity = members.reduce(
      (sum, m) => sum + parseFloat(m.equityPercentage.toString()),
      0
    );

    const unallocated = 100 - totalEquity;
    
    if (Math.abs(unallocated) < 0.01) {
      return {
        unallocated: 0,
        allocations: [],
        message: 'No unallocated equity to distribute',
      };
    }

    const allocations = this.proRataService.calculateProRataDistribution(
      members,
      unallocated,
      excludeMemberIds
    );

    return {
      unallocated,
      allocations,
      adjusted: this.proRataService.adjustToExactTotal(allocations),
    };
  }

  private getMemberWarnings(
    member: any,
    update: MemberEquityUpdateDto,
    changePercentage: number
  ): string[] {
    const warnings: string[] = [];

    if (Math.abs(changePercentage) > 10) {
      warnings.push(`Large change: ${changePercentage.toFixed(4)}%`);
    }

    if (member.status !== 'ACTIVE' && member.status !== 'PROBATIONARY' && update.newEquityPercentage > 0) {
      warnings.push(`Member status is ${member.status}`);
    }

    if (Math.abs(changePercentage) > 0.01 && !update.changeReason) {
      warnings.push('No reason provided for change');
    }

    return warnings;
  }
}