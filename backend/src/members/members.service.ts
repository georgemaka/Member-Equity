import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { MemberCreatedEvent, MemberEquityChangedEvent, MemberRetiredEvent } from '../events/domain-events';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto, UpdateEquityDto } from './dto/update-member.dto';
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
          taxWithholdingPercentage: new Decimal(createMemberDto.taxWithholdingPercentage || 0),
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

    return {
      data: members,
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
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }

  async update(id: string, updateMemberDto: UpdateMemberDto) {
    const member = await this.prisma.member.findUnique({
      where: { id },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return this.prisma.member.update({
      where: { id },
      data: updateMemberDto,
    });
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
}