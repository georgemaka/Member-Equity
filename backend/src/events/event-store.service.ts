import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { DomainEvent } from './domain-events/base.event';

@Injectable()
export class EventStoreService {
  constructor(private readonly prisma: PrismaService) {}

  async saveEvent(event: DomainEvent): Promise<void> {
    await this.prisma.eventStore.create({
      data: {
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        eventType: event.eventType,
        eventVersion: event.eventVersion,
        eventData: event.getEventData(),
        metadata: {
          ...event.metadata,
          timestamp: event.timestamp.toISOString(),
        },
        timestamp: event.timestamp,
      },
    });
  }

  async saveEvents(events: DomainEvent[]): Promise<void> {
    await this.prisma.$transaction(
      events.map(event =>
        this.prisma.eventStore.create({
          data: {
            aggregateId: event.aggregateId,
            aggregateType: event.aggregateType,
            eventType: event.eventType,
            eventVersion: event.eventVersion,
            eventData: event.getEventData(),
            metadata: {
              ...event.metadata,
              timestamp: event.timestamp.toISOString(),
            },
            timestamp: event.timestamp,
          },
        }),
      ),
    );
  }

  async getEventsForAggregate(
    aggregateId: string,
    aggregateType: string,
    fromSequence?: number,
  ) {
    const where: any = {
      aggregateId,
      aggregateType,
    };

    if (fromSequence !== undefined) {
      where.sequence = {
        gte: fromSequence,
      };
    }

    return this.prisma.eventStore.findMany({
      where,
      orderBy: {
        sequence: 'asc',
      },
    });
  }

  async getEventsByType(
    eventType: string,
    fromTimestamp?: Date,
    toTimestamp?: Date,
  ) {
    const where: any = {
      eventType,
    };

    if (fromTimestamp || toTimestamp) {
      where.timestamp = {};
      if (fromTimestamp) {
        where.timestamp.gte = fromTimestamp;
      }
      if (toTimestamp) {
        where.timestamp.lte = toTimestamp;
      }
    }

    return this.prisma.eventStore.findMany({
      where,
      orderBy: {
        timestamp: 'asc',
      },
    });
  }

  async getAllEvents(fromSequence?: number, limit?: number) {
    const where: any = {};

    if (fromSequence !== undefined) {
      where.sequence = {
        gte: fromSequence,
      };
    }

    return this.prisma.eventStore.findMany({
      where,
      orderBy: {
        sequence: 'asc',
      },
      take: limit,
    });
  }

  async getLatestSequence(): Promise<number> {
    const latest = await this.prisma.eventStore.findFirst({
      orderBy: {
        sequence: 'desc',
      },
      select: {
        sequence: true,
      },
    });

    return latest?.sequence || 0;
  }
}