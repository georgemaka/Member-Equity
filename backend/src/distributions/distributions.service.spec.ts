import { Test, TestingModule } from '@nestjs/testing';
import { DistributionsService } from './distributions.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { BadRequestException } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { DistributionStatus } from '@prisma/client';

describe('DistributionsService', () => {
  let service: DistributionsService;
  let prisma: PrismaService;
  let eventBus: EventBusService;

  const mockPrismaService = {
    distribution: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    companyProfit: {
      findUnique: jest.fn(),
    },
    member: {
      findMany: jest.fn(),
    },
    memberDistribution: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockEventBusService = {
    publish: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DistributionsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventBusService, useValue: mockEventBusService },
      ],
    }).compile();

    service = module.get<DistributionsService>(DistributionsService);
    prisma = module.get<PrismaService>(PrismaService);
    eventBus = module.get<EventBusService>(EventBusService);

    jest.clearAllMocks();
  });

  describe('calculateDistribution', () => {
    const mockProfit = {
      id: 'profit-1',
      companyId: 'company-1',
      distributableAmount: new Decimal('100000'),
    };

    const mockMembers = [
      {
        id: 'member-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        equityPercentage: new Decimal('40'),
      },
      {
        id: 'member-2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        equityPercentage: new Decimal('35'),
      },
      {
        id: 'member-3',
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob@example.com',
        equityPercentage: new Decimal('25'),
      },
    ];

    it('should calculate distribution correctly with exact percentages', async () => {
      mockPrismaService.companyProfit.findUnique.mockResolvedValue(mockProfit);
      mockPrismaService.member.findMany.mockResolvedValue(mockMembers);

      const result = await service.calculateDistribution('company-1', 'profit-1');

      expect(result.totalAmount).toBe('100000.00');
      expect(result.memberCount).toBe(3);
      expect(result.distributions).toHaveLength(3);

      // Verify John's distribution (40% of $100,000 = $40,000)
      const johnDist = result.distributions.find(d => d.memberId === 'member-1');
      expect(johnDist).toEqual({
        memberId: 'member-1',
        amount: '40000.00',
        taxWithholding: '0.00', // Tax withholding removed
        netAmount: '40000.00',
        member: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          equityPercentage: '40.0000',
        },
      });

      // Verify Jane's distribution (35% of $100,000 = $35,000)
      const janeDist = result.distributions.find(d => d.memberId === 'member-2');
      expect(janeDist).toEqual({
        memberId: 'member-2',
        amount: '35000.00',
        taxWithholding: '0.00', // Tax withholding removed
        netAmount: '35000.00',
        member: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          equityPercentage: '35.0000',
        },
      });

      // Verify Bob's distribution (25% of $100,000 = $25,000)
      const bobDist = result.distributions.find(d => d.memberId === 'member-3');
      expect(bobDist).toEqual({
        memberId: 'member-3',
        amount: '25000.00',
        taxWithholding: '0.00', // Tax withholding removed
        netAmount: '25000.00',
        member: {
          firstName: 'Bob',
          lastName: 'Johnson',
          email: 'bob@example.com',
          equityPercentage: '25.0000',
        },
      });

      // Verify total equals original amount
      expect(result.totalCalculated).toBe('100000.00');
    });

    it('should handle custom distribution amount', async () => {
      mockPrismaService.companyProfit.findUnique.mockResolvedValue(mockProfit);
      mockPrismaService.member.findMany.mockResolvedValue([mockMembers[0]]); // Just John

      const result = await service.calculateDistribution(
        'company-1',
        'profit-1',
        '50000', // Custom amount instead of full distributable
      );

      expect(result.totalAmount).toBe('50000.00');
      expect(result.distributions[0].amount).toBe('50000.00'); // John gets 100% since he's the only member
    });

    it('should handle decimal precision correctly', async () => {
      mockPrismaService.companyProfit.findUnique.mockResolvedValue({
        ...mockProfit,
        distributableAmount: new Decimal('10000'),
      });

      // Members with equity that doesn't divide evenly
      const unevenMembers = [
        {
          id: 'member-1',
          firstName: 'Alice',
          lastName: 'Test',
          email: 'alice@example.com',
          equityPercentage: new Decimal('33.33'),
          },
        {
          id: 'member-2',
          firstName: 'Bob',
          lastName: 'Test',
          email: 'bob@example.com',
          equityPercentage: new Decimal('33.33'),
          },
        {
          id: 'member-3',
          firstName: 'Charlie',
          lastName: 'Test',
          email: 'charlie@example.com',
          equityPercentage: new Decimal('33.34'),
          },
      ];

      mockPrismaService.member.findMany.mockResolvedValue(unevenMembers);

      const result = await service.calculateDistribution('company-1', 'profit-1');

      // Verify rounding is handled correctly
      const alice = result.distributions.find(d => d.memberId === 'member-1');
      const bob = result.distributions.find(d => d.memberId === 'member-2');
      const charlie = result.distributions.find(d => d.memberId === 'member-3');

      expect(alice.amount).toBe('3333.00'); // 33.33% of 10000, rounded down
      expect(bob.amount).toBe('3333.00'); // 33.33% of 10000, rounded down
      expect(charlie.amount).toBe('3334.00'); // 33.34% of 10000

      // Total should be within acceptable rounding tolerance
      const totalCalc = new Decimal(alice.amount)
        .plus(bob.amount)
        .plus(charlie.amount);
      expect(totalCalc.toString()).toBe('10000');
    });

    it('should throw BadRequestException when profit not found', async () => {
      mockPrismaService.companyProfit.findUnique.mockResolvedValue(null);

      await expect(
        service.calculateDistribution('company-1', 'non-existent'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when profit belongs to different company', async () => {
      mockPrismaService.companyProfit.findUnique.mockResolvedValue({
        ...mockProfit,
        companyId: 'different-company',
      });

      await expect(
        service.calculateDistribution('company-1', 'profit-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when distribution calculation has large error', async () => {
      mockPrismaService.companyProfit.findUnique.mockResolvedValue(mockProfit);
      
      // Create members whose equity doesn't add up properly (simulating data corruption)
      const corruptMembers = [
        {
          id: 'member-1',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          equityPercentage: new Decimal('0.0001'), // Very small percentage
          },
      ];

      mockPrismaService.member.findMany.mockResolvedValue(corruptMembers);

      await expect(
        service.calculateDistribution('company-1', 'profit-1'),
      ).rejects.toThrow(/Distribution calculation error/);
    });
  });

  describe('createDistribution', () => {
    it('should create distribution with member distributions', async () => {
      const mockProfit = {
        id: 'profit-1',
        companyId: 'company-1',
        distributableAmount: new Decimal('50000'),
      };

      const mockMembers = [
        {
          id: 'member-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          equityPercentage: new Decimal('60'),
          },
        {
          id: 'member-2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          equityPercentage: new Decimal('40'),
          },
      ];

      mockPrismaService.companyProfit.findUnique.mockResolvedValue(mockProfit);
      mockPrismaService.member.findMany.mockResolvedValue(mockMembers);

      const mockDistribution = {
        id: 'dist-1',
        companyId: 'company-1',
        companyProfitId: 'profit-1',
        totalAmount: new Decimal('50000'),
        status: DistributionStatus.APPROVED,
      };

      mockPrismaService.distribution.create.mockResolvedValue(mockDistribution);

      const result = await service.createDistribution(
        'company-1',
        'profit-1',
        'user-123',
      );

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.distribution.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          companyId: 'company-1',
          companyProfitId: 'profit-1',
          totalAmount: new Decimal('50000'),
          status: DistributionStatus.APPROVED,
          approvedBy: 'user-123',
        }),
      });

      expect(mockEventBusService.publish).toHaveBeenCalledWith({
        eventType: 'distribution.created',
        aggregateId: 'dist-1',
        data: expect.objectContaining({
          distributionId: 'dist-1',
          companyId: 'company-1',
          totalAmount: '50000.00',
          memberCount: 2,
        }),
      });
    });
  });
});