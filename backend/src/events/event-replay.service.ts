import { Injectable } from '@nestjs/common';
import { EventStoreService } from './event-store.service';
import { EventBusService } from './event-bus.service';
import { DomainEvent } from './domain-events/base.event';

@Injectable()
export class EventReplayService {
  constructor(
    private readonly eventStore: EventStoreService,
    private readonly eventBus: EventBusService,
  ) {}

  async replayEventsForAggregate(
    aggregateId: string,
    aggregateType: string,
    fromSequence?: number,
  ): Promise<void> {
    const events = await this.eventStore.getEventsForAggregate(
      aggregateId,
      aggregateType,
      fromSequence,
    );

    for (const eventData of events) {
      // Reconstruct domain event
      const event = this.reconstructDomainEvent(eventData);
      
      // Replay through event bus (but skip saving to event store)
      const handlers = this.eventBus.getHandlers(event.eventType);
      await Promise.all(handlers.map(handler => handler.handle(event)));
    }
  }

  async replayEventsByType(
    eventType: string,
    fromTimestamp?: Date,
    toTimestamp?: Date,
  ): Promise<void> {
    const events = await this.eventStore.getEventsByType(
      eventType,
      fromTimestamp,
      toTimestamp,
    );

    for (const eventData of events) {
      const event = this.reconstructDomainEvent(eventData);
      
      const handlers = this.eventBus.getHandlers(event.eventType);
      await Promise.all(handlers.map(handler => handler.handle(event)));
    }
  }

  async replayAllEvents(fromSequence?: number, batchSize = 100): Promise<void> {
    let currentSequence = fromSequence || 0;
    let hasMoreEvents = true;

    while (hasMoreEvents) {
      const events = await this.eventStore.getAllEvents(currentSequence, batchSize);
      
      if (events.length === 0) {
        hasMoreEvents = false;
        break;
      }

      for (const eventData of events) {
        const event = this.reconstructDomainEvent(eventData);
        
        const handlers = this.eventBus.getHandlers(event.eventType);
        await Promise.all(handlers.map(handler => handler.handle(event)));
        
        currentSequence = eventData.sequence + 1;
      }

      if (events.length < batchSize) {
        hasMoreEvents = false;
      }
    }
  }

  private reconstructDomainEvent(eventData: any): DomainEvent {
    // Create a generic domain event for replay
    return new (class extends DomainEvent {
      constructor() {
        super({
          aggregateId: eventData.aggregateId,
          aggregateType: eventData.aggregateType,
          eventType: eventData.eventType,
          eventVersion: eventData.eventVersion,
          metadata: eventData.metadata,
        });
        // Override timestamp with stored timestamp
        (this as any).timestamp = new Date(eventData.timestamp);
      }

      getEventData() {
        return eventData.eventData;
      }
    })();
  }

  async getAggregateState<T>(
    aggregateId: string,
    aggregateType: string,
    stateBuilder: (events: any[]) => T,
  ): Promise<T> {
    const events = await this.eventStore.getEventsForAggregate(
      aggregateId,
      aggregateType,
    );

    return stateBuilder(events);
  }

  async rebuildMemberProjection(memberId: string): Promise<any> {
    const events = await this.eventStore.getEventsForAggregate(memberId, 'Member');
    
    let state = {
      id: memberId,
      equityPercentage: '0',
      status: 'ACTIVE',
    };

    for (const event of events) {
      switch (event.eventType) {
        case 'MemberCreated':
          state = {
            ...state,
            ...(event.eventData as any),
          };
          break;
        case 'MemberEquityChanged':
          state.equityPercentage = (event.eventData as any).newPercentage;
          break;
        case 'MemberRetired':
          state.status = 'RETIRED';
          state.equityPercentage = '0';
          break;
      }
    }

    return state;
  }

  async auditTrailForAggregate(
    aggregateId: string,
    aggregateType: string,
  ): Promise<any[]> {
    const events = await this.eventStore.getEventsForAggregate(
      aggregateId,
      aggregateType,
    );

    return events.map(event => ({
      eventType: event.eventType,
      timestamp: event.timestamp,
      data: event.eventData,
      metadata: event.metadata,
      sequence: event.sequence,
    }));
  }
}