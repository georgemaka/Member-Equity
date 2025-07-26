import { Test, TestingModule } from '@nestjs/testing';
import { EventStoreService } from './event-store.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { MemberCreatedEvent } from './domain-events/member.events';
import { Decimal } from 'decimal.js';

describe('EventStoreService', () => {
  let service: EventStoreService;
  let prisma: PrismaService;

  const mockPrismaService = {
    eventStore: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventStoreService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<EventStoreService>(EventStoreService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('saveEvent', () => {
    it('should save a domain event to the event store', async () => {
      const event = new MemberCreatedEvent(
        'member-123',
        {
          companyId: 'company-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          equityPercentage: new Decimal('10.5'),
          joinDate: new Date('2024-01-01'),
        },
        { userId: 'user-123' },
      );

      await service.saveEvent(event);

      expect(mockPrismaService.eventStore.create).toHaveBeenCalledWith({
        data: {
          aggregateId: 'member-123',
          aggregateType: 'Member',
          eventType: 'MemberCreated',
          eventVersion: 1,
          eventData: {
            companyId: 'company-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            equityPercentage: '10.5',
            joinDate: '2024-01-01T00:00:00.000Z',
          },
          metadata: expect.objectContaining({
            userId: 'user-123',
            correlationId: expect.any(String),
          }),
          timestamp: expect.any(Date),
        },
      });
    });
  });

  describe('saveEvents', () => {
    it('should save multiple events in a transaction', async () => {
      const events = [
        new MemberCreatedEvent(
          'member-1',
          {
            companyId: 'company-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            equityPercentage: 50,
            joinDate: new Date('2024-01-01'),
          },
        ),
        new MemberCreatedEvent(
          'member-2',
          {
            companyId: 'company-1',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            equityPercentage: 50,
            joinDate: new Date('2024-01-01'),
          },
        ),
      ];

      await service.saveEvents(events);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.eventStore.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('getEventsForAggregate', () => {
    it('should retrieve events for a specific aggregate', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          aggregateId: 'member-123',
          aggregateType: 'Member',
          eventType: 'MemberCreated',
          eventData: { firstName: 'John' },
          sequence: 1,
        },
        {
          id: 'event-2',
          aggregateId: 'member-123',
          aggregateType: 'Member',
          eventType: 'MemberEquityChanged',
          eventData: { newPercentage: '15' },
          sequence: 2,
        },
      ];

      mockPrismaService.eventStore.findMany.mockResolvedValue(mockEvents);

      const result = await service.getEventsForAggregate('member-123', 'Member');

      expect(result).toEqual(mockEvents);
      expect(mockPrismaService.eventStore.findMany).toHaveBeenCalledWith({
        where: {
          aggregateId: 'member-123',
          aggregateType: 'Member',
        },
        orderBy: {
          sequence: 'asc',
        },
      });
    });

    it('should retrieve events from a specific sequence', async () => {
      const mockEvents = [
        {
          id: 'event-3',
          sequence: 3,
        },
      ];

      mockPrismaService.eventStore.findMany.mockResolvedValue(mockEvents);

      const result = await service.getEventsForAggregate('member-123', 'Member', 3);

      expect(mockPrismaService.eventStore.findMany).toHaveBeenCalledWith({
        where: {
          aggregateId: 'member-123',
          aggregateType: 'Member',
          sequence: {
            gte: 3,
          },
        },
        orderBy: {
          sequence: 'asc',
        },
      });
    });
  });

  describe('getEventsByType', () => {
    it('should retrieve events by type within date range', async () => {
      const fromDate = new Date('2024-01-01');
      const toDate = new Date('2024-12-31');
      const mockEvents = [
        {
          id: 'event-1',
          eventType: 'MemberCreated',
          timestamp: new Date('2024-06-01'),
        },
      ];

      mockPrismaService.eventStore.findMany.mockResolvedValue(mockEvents);

      const result = await service.getEventsByType(
        'MemberCreated',
        fromDate,
        toDate,
      );

      expect(result).toEqual(mockEvents);
      expect(mockPrismaService.eventStore.findMany).toHaveBeenCalledWith({
        where: {
          eventType: 'MemberCreated',
          timestamp: {
            gte: fromDate,
            lte: toDate,
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
      });
    });
  });

  describe('getLatestSequence', () => {
    it('should return the latest sequence number', async () => {
      mockPrismaService.eventStore.findFirst.mockResolvedValue({
        sequence: 100,
      });

      const result = await service.getLatestSequence();

      expect(result).toBe(100);
      expect(mockPrismaService.eventStore.findFirst).toHaveBeenCalledWith({
        orderBy: {
          sequence: 'desc',
        },
        select: {
          sequence: true,
        },
      });
    });

    it('should return 0 when no events exist', async () => {
      mockPrismaService.eventStore.findFirst.mockResolvedValue(null);

      const result = await service.getLatestSequence();

      expect(result).toBe(0);
    });
  });
});