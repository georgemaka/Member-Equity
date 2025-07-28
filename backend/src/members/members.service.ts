import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { MemberCreatedEvent, MemberEquityChangedEvent, MemberRetiredEvent } from '../events/domain-events';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto, UpdateEquityDto } from './dto/update-member.dto';
import { UpdateMemberStatusDto } from './dto/update-status.dto';
import { BulkEquityUpdateDto } from './dto/bulk-equity-update.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Decimal } from 'decimal.js';

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  async create(companyId: string, createMemberDto: CreateMemberDto) {
    // Check if email already exists
    const existingMember = await this.prisma.member.findUnique({
      where: { email: createMemberDto.email },
    });

    if (existingMember) {
      throw new ConflictException('Member with this email already exists');
    }

    // Validate equity total won't exceed 100%
    const currentTotal = await this.getCurrentEquityTotal(companyId);
    const newTotal = currentTotal.plus(new Decimal(createMemberDto.equityPercentage));
    
    if (newTotal.greaterThan(100)) {
      throw new BadRequestException(
        `Cannot add member: total equity would be ${newTotal.toFixed(2)}% (current: ${currentTotal.toFixed(2)}%, adding: ${createMemberDto.equityPercentage}%)`
      );
    }

    // Create member and equity event in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const member = await tx.member.create({
        data: {
          ...createMemberDto,
          companyId,
          joinDate: new Date(createMemberDto.joinDate),
          equityPercentage: new Decimal(createMemberDto.equityPercentage),
        },
      });

      // Create initial equity event
      await tx.equityEvent.create({
        data: {
          memberId: member.id,
          eventType: 'INITIAL_GRANT',
          newPercentage: new Decimal(createMemberDto.equityPercentage),
          effectiveDate: new Date(createMemberDto.joinDate),
          reason: 'Initial equity grant',
        },
      });

      return member;
    });

    // Publish domain event
    await this.eventBus.publish(
      new MemberCreatedEvent(result.id, {
        companyId,
        firstName: createMemberDto.firstName,
        lastName: createMemberDto.lastName,
        email: createMemberDto.email,
        equityPercentage: new Decimal(createMemberDto.equityPercentage).toNumber(),
        joinDate: new Date(createMemberDto.joinDate),
      }),
    );

    return result;
  }

  async findAll(companyId: string, pagination: PaginationDto) {
    const [members, total] = await Promise.all([
      this.prisma.member.findMany({
        where: { companyId },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
        include: {
          equityHistory: {
            orderBy: { effectiveDate: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.member.count({
        where: { companyId },
      }),
    ]);

    // Transform members to match frontend expectations
    const formattedMembers = members.map(member => {
      // Get the most recent equity data
      const latestEquity = member.equityHistory?.[0];
      const currentYear = new Date().getFullYear();
      
      return {
        ...member,
        equityPercentage: Number(member.equityPercentage) || 0, // Convert Decimal to number
        status: member.status.toLowerCase(),
        // Add currentStatus object for frontend compatibility
        currentStatus: {
          id: `status-${member.id}`,
          memberId: member.id,
          fiscalYear: currentYear,
          status: member.status.toLowerCase(),
          effectiveDate: member.updatedAt.toISOString(),
          createdAt: member.updatedAt.toISOString(),
          updatedAt: member.updatedAt.toISOString(),
        },
        // Add currentEquity based on the member's equity percentage
        currentEquity: {
          id: `equity-${member.id}-${currentYear}`,
          memberId: member.id,
          fiscalYear: currentYear,
          estimatedPercentage: Number(member.equityPercentage) || 0,
          finalPercentage: Number(member.equityPercentage) || 0,
          capitalBalance: 0, // TODO: Calculate from balance history
          isFinalized: false,
          createdAt: member.createdAt.toISOString(),
          updatedAt: member.updatedAt.toISOString(),
        },
        // Add legacy fields for compatibility
        isActive: member.status === 'ACTIVE',
      };
    });

    return {
      data: formattedMembers,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  async findOne(id: string) {
    const member = await this.prisma.member.findUnique({
      where: { id },
      include: {
        equityHistory: {
          orderBy: { effectiveDate: 'desc' },
        },
        memberDistributions: {
          include: {
            distribution: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        balanceHistory: {
          orderBy: { effectiveDate: 'desc' },
        },
        statusHistory: {
          orderBy: { effectiveDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Transform member to match frontend expectations
    const currentYear = new Date().getFullYear();
    
    return {
      ...member,
      equityPercentage: Number(member.equityPercentage) || 0, // Convert Decimal to number
      status: member.status.toLowerCase(),
      // Add currentStatus object for frontend compatibility
      currentStatus: {
        id: `status-${member.id}`,
        memberId: member.id,
        fiscalYear: currentYear,
        status: member.status.toLowerCase(),
        effectiveDate: member.updatedAt.toISOString(),
        createdAt: member.updatedAt.toISOString(),
        updatedAt: member.updatedAt.toISOString(),
      },
      // Add currentEquity based on the member's equity percentage
      currentEquity: {
        id: `equity-${member.id}-${currentYear}`,
        memberId: member.id,
        fiscalYear: currentYear,
        estimatedPercentage: Number(member.equityPercentage) || 0,
        finalPercentage: Number(member.equityPercentage) || 0,
        capitalBalance: 0, // TODO: Calculate from balance history
        isFinalized: false,
        createdAt: member.createdAt.toISOString(),
        updatedAt: member.updatedAt.toISOString(),
      },
      // Transform status history
      statusHistory: member.statusHistory.map(history => ({
        ...history,
        previousStatus: history.previousStatus.toLowerCase(),
        newStatus: history.newStatus.toLowerCase(),
      })),
      // Add legacy fields for compatibility
      isActive: member.status === 'ACTIVE',
    };
  }

  async update(id: string, updateMemberDto: UpdateMemberDto) {
    const member = await this.prisma.member.findUnique({
      where: { id },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Transform the DTO to handle Decimal types properly
    const updateData: any = { ...updateMemberDto };

    const updatedMember = await this.prisma.member.update({
      where: { id },
      data: updateData,
    });

    // Transform member to match frontend expectations
    const currentYear = new Date().getFullYear();
    
    return {
      ...updatedMember,
      equityPercentage: Number(updatedMember.equityPercentage) || 0, // Convert Decimal to number
      status: updatedMember.status.toLowerCase(),
      currentStatus: {
        id: `status-${updatedMember.id}`,
        memberId: updatedMember.id,
        status: updatedMember.status.toLowerCase(),
        fiscalYear: currentYear,
        effectiveDate: updatedMember.updatedAt.toISOString(),
        createdAt: updatedMember.updatedAt.toISOString(),
        updatedAt: updatedMember.updatedAt.toISOString(),
      },
      // Add currentEquity based on the member's equity percentage
      currentEquity: {
        id: `equity-${updatedMember.id}-${currentYear}`,
        memberId: updatedMember.id,
        fiscalYear: currentYear,
        estimatedPercentage: Number(updatedMember.equityPercentage) || 0,
        finalPercentage: Number(updatedMember.equityPercentage) || 0,
        capitalBalance: 0, // TODO: Calculate from balance history
        isFinalized: false,
        createdAt: updatedMember.createdAt.toISOString(),
        updatedAt: updatedMember.updatedAt.toISOString(),
      },
      isActive: updatedMember.status === 'ACTIVE',
    };
  }

  async updateEquity(id: string, updateEquityDto: UpdateEquityDto) {
    const member = await this.prisma.member.findUnique({
      where: { id },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Validate new equity total won't exceed 100%
    const currentTotal = await this.getCurrentEquityTotal(member.companyId);
    const memberCurrent = new Decimal(member.equityPercentage.toString());
    const newTotal = currentTotal.minus(memberCurrent).plus(new Decimal(updateEquityDto.newPercentage));
    
    if (newTotal.greaterThan(100)) {
      throw new BadRequestException(
        `Cannot update equity: total would be ${newTotal.toFixed(2)}%`
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Update member equity percentage
      const updatedMember = await tx.member.update({
        where: { id },
        data: {
          equityPercentage: updateEquityDto.newPercentage,
        },
      });

      // Create equity event
      await tx.equityEvent.create({
        data: {
          memberId: id,
          eventType: 'PERCENTAGE_CHANGE',
          previousPercentage: member.equityPercentage,
          newPercentage: updateEquityDto.newPercentage,
          effectiveDate: new Date(updateEquityDto.effectiveDate),
          reason: updateEquityDto.reason,
        },
      });

      return updatedMember;
    });

    // Publish domain event
    await this.eventBus.publish(
      new MemberEquityChangedEvent(id, {
        previousPercentage: new Decimal(member.equityPercentage.toString()),
        newPercentage: updateEquityDto.newPercentage,
        effectiveDate: new Date(updateEquityDto.effectiveDate),
        reason: updateEquityDto.reason,
      }),
    );

    return result;
  }

  async retire(id: string, retirementDate: Date, reason: string) {
    const member = await this.prisma.member.findUnique({
      where: { id },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Update member status and retirement date
      const updatedMember = await tx.member.update({
        where: { id },
        data: {
          status: 'RETIRED',
          retirementDate,
        },
      });

      // Create retirement equity event
      await tx.equityEvent.create({
        data: {
          memberId: id,
          eventType: 'RETIREMENT',
          previousPercentage: member.equityPercentage,
          newPercentage: new Decimal(0),
          effectiveDate: retirementDate,
          reason,
        },
      });

      return updatedMember;
    });

    // Publish domain event
    await this.eventBus.publish(
      new MemberRetiredEvent(id, {
        retirementDate,
        finalEquityPercentage: new Decimal(member.equityPercentage.toString()),
        reason,
      }),
    );

    return result;
  }

  async getEquityHistory(id: string, year?: number) {
    const where: any = { memberId: id };
    
    if (year) {
      where.effectiveDate = {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      };
    }

    return this.prisma.equityEvent.findMany({
      where,
      orderBy: { effectiveDate: 'desc' },
    });
  }

  async getBalanceHistory(id: string, year?: number) {
    const where: any = { memberId: id };
    
    if (year) {
      where.effectiveDate = {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      };
    }

    return this.prisma.balanceHistory.findMany({
      where,
      orderBy: { effectiveDate: 'desc' },
    });
  }

  async getStatusHistory(id: string, limit?: number) {
    const member = await this.prisma.member.findUnique({
      where: { id },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const statusHistory = await this.prisma.statusHistory.findMany({
      where: { memberId: id },
      orderBy: { effectiveDate: 'desc' },
      take: limit || 20,
    });

    // Transform status history to match frontend expectations
    return statusHistory.map(history => ({
      ...history,
      previousStatus: history.previousStatus.toLowerCase(),
      newStatus: history.newStatus.toLowerCase(),
    }));
  }

  private async getCurrentEquityTotal(companyId: string): Promise<Decimal> {
    const members = await this.prisma.member.findMany({
      where: {
        companyId,
        status: 'ACTIVE',
      },
      select: {
        equityPercentage: true,
      },
    });

    return members.reduce(
      (total, member) => total.plus(new Decimal(member.equityPercentage.toString())),
      new Decimal(0)
    );
  }

  async validateEquityTotal(companyId: string): Promise<{ isValid: boolean; total: string; members: number }> {
    const total = await this.getCurrentEquityTotal(companyId);
    const memberCount = await this.prisma.member.count({
      where: {
        companyId,
        status: 'ACTIVE',
      },
    });

    return {
      isValid: total.equals(100),
      total: total.toFixed(4),
      members: memberCount,
    };
  }

  async updateStatus(id: string, updateStatusDto: UpdateMemberStatusDto) {
    const member = await this.prisma.member.findUnique({
      where: { id },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Convert lowercase status to uppercase for Prisma enum
    const newStatus = updateStatusDto.status.toUpperCase() as any;
    const previousStatus = member.status;

    // Use transaction to ensure consistency
    const result = await this.prisma.$transaction(async (tx) => {
      // Update member status
      const updatedMember = await tx.member.update({
        where: { id },
        data: {
          status: newStatus,
        },
        include: {
          equityHistory: {
            orderBy: { effectiveDate: 'desc' },
          },
          memberDistributions: {
            include: {
              distribution: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          balanceHistory: {
            orderBy: { effectiveDate: 'desc' },
          },
          statusHistory: {
            orderBy: { effectiveDate: 'desc' },
            take: 10,
          },
        },
      });

      // Create status history record
      await tx.statusHistory.create({
        data: {
          memberId: id,
          previousStatus: previousStatus,
          newStatus: newStatus,
          effectiveDate: new Date(updateStatusDto.effectiveDate),
          fiscalYear: updateStatusDto.fiscalYear,
          reason: updateStatusDto.reason,
          notes: updateStatusDto.notes,
          changedBy: 'dev-user-1', // TODO: Get from auth context
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: 'dev-user-1', // TODO: Get from auth context
          action: 'UPDATE_MEMBER_STATUS',
          resourceType: 'Member',
          resourceId: id,
          previousData: { status: previousStatus },
          newData: { 
            status: newStatus,
            reason: updateStatusDto.reason,
            notes: updateStatusDto.notes,
            effectiveDate: updateStatusDto.effectiveDate,
          },
        },
      });

      return updatedMember;
    });
    
    // Transform member to match frontend expectations
    const currentYear = updateStatusDto.fiscalYear || new Date().getFullYear();
    
    return {
      ...result,
      equityPercentage: Number(result.equityPercentage) || 0, // Convert Decimal to number
      status: result.status.toLowerCase(),
      // Add currentStatus object for frontend compatibility
      currentStatus: {
        id: `status-${result.id}`,
        memberId: result.id,
        fiscalYear: currentYear,
        status: result.status.toLowerCase(),
        effectiveDate: updateStatusDto.effectiveDate,
        reason: updateStatusDto.reason,
        notes: updateStatusDto.notes,
        createdAt: result.updatedAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
      },
      // Add currentEquity based on the member's equity percentage
      currentEquity: {
        id: `equity-${result.id}-${currentYear}`,
        memberId: result.id,
        fiscalYear: currentYear,
        estimatedPercentage: Number(result.equityPercentage) || 0,
        finalPercentage: Number(result.equityPercentage) || 0,
        capitalBalance: 0, // TODO: Calculate from balance history
        isFinalized: false,
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
      },
      // Transform status history
      statusHistory: result.statusHistory.map(history => ({
        ...history,
        previousStatus: history.previousStatus.toLowerCase(),
        newStatus: history.newStatus.toLowerCase(),
      })),
      // Add legacy fields for compatibility
      isActive: result.status === 'ACTIVE',
    };
  }

  async bulkUpdateEquity(companyId: string, bulkUpdateDto: BulkEquityUpdateDto) {
    const { updates, fiscalYear, reason } = bulkUpdateDto;

    // Validate all members exist and belong to the company
    const memberIds = updates.map(u => u.memberId);
    const members = await this.prisma.member.findMany({
      where: {
        id: { in: memberIds },
        companyId,
      },
    });

    if (members.length !== memberIds.length) {
      throw new NotFoundException('One or more members not found');
    }

    // Validate total equity percentage
    const totalFinalEquity = updates.reduce(
      (sum, update) => sum + update.finalPercentage,
      0
    );

    if (Math.abs(totalFinalEquity - 100) > 0.01) {
      throw new BadRequestException(
        `Total final equity must equal 100%. Current total: ${totalFinalEquity.toFixed(2)}%`
      );
    }

    // Perform bulk update in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const updatePromises = updates.map(async (update) => {
        // Update member equity
        const updatedMember = await tx.member.update({
          where: { id: update.memberId },
          data: {
            equityPercentage: new Decimal(update.finalPercentage),
          },
        });

        // Create equity event
        await tx.equityEvent.create({
          data: {
            memberId: update.memberId,
            eventType: 'ADJUSTMENT',
            previousPercentage: new Decimal(update.estimatedPercentage),
            newPercentage: new Decimal(update.finalPercentage),
            effectiveDate: new Date(`${fiscalYear}-12-31`),
            reason: reason,
            metadata: {
              fiscalYear,
              capitalBalance: update.capitalBalance,
              bulkUpdate: true,
            },
          },
        });

        // Note: MemberYearlyEquity table doesn't exist yet
        // This will be implemented when the Equity module is complete

        return updatedMember;
      });

      return Promise.all(updatePromises);
    });

    // Emit events for each update
    for (const update of updates) {
      await this.eventBus.publish(
        new MemberEquityChangedEvent(
          update.memberId,
          {
            previousPercentage: new Decimal(update.estimatedPercentage),
            newPercentage: new Decimal(update.finalPercentage),
            effectiveDate: new Date(`${fiscalYear}-12-31`),
            reason: reason,
          }
        )
      );
    }

    return {
      success: true,
      updatedCount: result.length,
      message: `Successfully updated equity for ${result.length} members`,
    };
  }
}