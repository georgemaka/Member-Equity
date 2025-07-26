import { Test, TestingModule } from '@nestjs/testing';
import { MembersService } from './members.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateEquityDto } from './dto/update-member.dto';

describe('MembersService', () => {
  let service: MembersService;
  let prisma: PrismaService;
  let eventBus: EventBusService;

  const mockPrismaService = {
    member: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    equityEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    balanceHistory: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockEventBusService = {
    publish: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventBusService, useValue: mockEventBusService },
      ],
    }).compile();

    service = module.get<MembersService>(MembersService);
    prisma = module.get<PrismaService>(PrismaService);
    eventBus = module.get<EventBusService>(EventBusService);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createMemberDto: CreateMemberDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      equityPercentage: new Decimal(10.5),
      taxWithholdingPercentage: new Decimal(24),
      joinDate: '2024-01-01',
      address: { 
        street: '123 Main St', 
        city: 'Test City',
        state: 'CA',
        zipCode: '12345',
        country: 'USA'
      },
    };

    it('should create a member successfully when equity total is valid', async () => {
      // Mock existing members to have 70% total equity
      mockPrismaService.member.findUnique.mockResolvedValue(null);
      mockPrismaService.member.findMany.mockResolvedValue([
        { equityPercentage: new Decimal('40') },
        { equityPercentage: new Decimal('30') },
      ]);

      const mockCreatedMember = {
        id: 'member-123',
        ...createMemberDto,
        companyId: 'company-1',
        equityPercentage: new Decimal(createMemberDto.equityPercentage),
        taxWithholdingPercentage: new Decimal(createMemberDto.taxWithholdingPercentage),
        joinDate: new Date(createMemberDto.joinDate),
      };

      mockPrismaService.member.create.mockResolvedValue(mockCreatedMember);

      const result = await service.create('company-1', createMemberDto);

      expect(result).toEqual(mockCreatedMember);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockEventBusService.publish).toHaveBeenCalled();
    });

    it('should throw ConflictException when email already exists', async () => {
      mockPrismaService.member.findUnique.mockResolvedValue({
        id: 'existing-member',
        email: createMemberDto.email,
      });

      await expect(service.create('company-1', createMemberDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrismaService.member.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when equity total exceeds 100%', async () => {
      mockPrismaService.member.findUnique.mockResolvedValue(null);
      // Mock existing members to have 95% total equity
      mockPrismaService.member.findMany.mockResolvedValue([
        { equityPercentage: new Decimal('50') },
        { equityPercentage: new Decimal('45') },
      ]);

      await expect(service.create('company-1', createMemberDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.member.create).not.toHaveBeenCalled();
    });
  });

  describe('updateEquity', () => {
    const updateEquityDto: UpdateEquityDto = {
      newPercentage: new Decimal(15),
      effectiveDate: '2024-02-01',
      reason: 'Annual equity adjustment',
    };

    it('should update member equity successfully', async () => {
      const existingMember = {
        id: 'member-123',
        companyId: 'company-1',
        equityPercentage: new Decimal('10'),
        status: 'ACTIVE',
      };

      mockPrismaService.member.findUnique.mockResolvedValue(existingMember);
      
      // Mock other members to have 80% total (excluding current member)
      mockPrismaService.member.findMany.mockResolvedValue([
        { equityPercentage: new Decimal('50') },
        { equityPercentage: new Decimal('30') },
        { equityPercentage: new Decimal('10') }, // Current member
      ]);

      const updatedMember = {
        ...existingMember,
        equityPercentage: new Decimal(updateEquityDto.newPercentage),
      };

      mockPrismaService.member.update.mockResolvedValue(updatedMember);

      const result = await service.updateEquity('member-123', updateEquityDto);

      expect(result).toEqual(updatedMember);
      expect(mockEventBusService.publish).toHaveBeenCalled();
    });

    it('should throw NotFoundException when member does not exist', async () => {
      mockPrismaService.member.findUnique.mockResolvedValue(null);

      await expect(
        service.updateEquity('non-existent', updateEquityDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when new equity total exceeds 100%', async () => {
      const existingMember = {
        id: 'member-123',
        companyId: 'company-1',
        equityPercentage: new Decimal('10'),
        status: 'ACTIVE',
      };

      mockPrismaService.member.findUnique.mockResolvedValue(existingMember);
      
      // Mock other members to have 90% total (including current member)
      mockPrismaService.member.findMany.mockResolvedValue([
        { equityPercentage: new Decimal('50') },
        { equityPercentage: new Decimal('30') },
        { equityPercentage: new Decimal('10') }, // Current member
      ]);

      const largeEquityDto = { ...updateEquityDto, newPercentage: new Decimal(25) };

      await expect(
        service.updateEquity('member-123', largeEquityDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateEquityTotal', () => {
    it('should return valid when equity totals exactly 100%', async () => {
      mockPrismaService.member.findMany.mockResolvedValue([
        { equityPercentage: new Decimal('40.5') },
        { equityPercentage: new Decimal('30.25') },
        { equityPercentage: new Decimal('29.25') },
      ]);
      mockPrismaService.member.count.mockResolvedValue(3);

      const result = await service.validateEquityTotal('company-1');

      expect(result).toEqual({
        isValid: true,
        total: '100.0000',
        members: 3,
      });
    });

    it('should return invalid when equity total is not 100%', async () => {
      mockPrismaService.member.findMany.mockResolvedValue([
        { equityPercentage: new Decimal('40') },
        { equityPercentage: new Decimal('30') },
        { equityPercentage: new Decimal('25') },
      ]);
      mockPrismaService.member.count.mockResolvedValue(3);

      const result = await service.validateEquityTotal('company-1');

      expect(result).toEqual({
        isValid: false,
        total: '95.0000',
        members: 3,
      });
    });
  });

  describe('retire', () => {
    it('should retire a member successfully', async () => {
      const existingMember = {
        id: 'member-123',
        companyId: 'company-1',
        equityPercentage: new Decimal('15'),
        status: 'ACTIVE',
      };

      mockPrismaService.member.findUnique.mockResolvedValue(existingMember);

      const retiredMember = {
        ...existingMember,
        status: 'RETIRED',
        retirementDate: new Date('2024-12-31'),
      };

      mockPrismaService.member.update.mockResolvedValue(retiredMember);

      const result = await service.retire(
        'member-123',
        new Date('2024-12-31'),
        'Voluntary retirement',
      );

      expect(result).toEqual(retiredMember);
      expect(mockPrismaService.equityEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'RETIREMENT',
          previousPercentage: existingMember.equityPercentage,
          newPercentage: new Decimal(0),
        }),
      });
      expect(mockEventBusService.publish).toHaveBeenCalled();
    });

    it('should throw NotFoundException when member does not exist', async () => {
      mockPrismaService.member.findUnique.mockResolvedValue(null);

      await expect(
        service.retire('non-existent', new Date(), 'Test'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated members', async () => {
      const mockMembers = [
        { id: '1', firstName: 'John', equityPercentage: new Decimal('50') },
        { id: '2', firstName: 'Jane', equityPercentage: new Decimal('50') },
      ];

      mockPrismaService.member.findMany.mockResolvedValue(mockMembers);
      mockPrismaService.member.count.mockResolvedValue(10);

      const pagination = { page: 1, limit: 2, skip: 0, take: 2 };
      const result = await service.findAll('company-1', pagination);

      expect(result).toEqual({
        data: mockMembers,
        total: 10,
        page: 1,
        limit: 2,
        totalPages: 5,
      });
    });
  });
});