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
        super(
          eventData.aggregateId,
          eventData.aggregateType,
          eventData.eventType,
          eventData.eventVersion,
          eventData.metadata,
        );
        // Override timestamp with stored timestamp
        (this as any).timestamp = eventData.timestamp;
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
}