import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent } from './domain-events/base.event';
import { EventStoreService } from './event-store.service';

export interface EventHandler<T extends DomainEvent = DomainEvent> {
  handle(event: T): Promise<void>;
}

@Injectable()
export class EventBusService {
  private readonly handlers = new Map<string, EventHandler[]>();

  constructor(
    private readonly eventStore: EventStoreService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async publish(event: DomainEvent): Promise<void> {
    // Save to event store
    await this.eventStore.saveEvent(event);

    // Emit to handlers
    await this.eventEmitter.emitAsync(event.eventType, event);

    // Execute registered handlers
    const handlers = this.handlers.get(event.eventType) || [];
    await Promise.all(handlers.map(handler => handler.handle(event)));
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    // Save all events to store
    await this.eventStore.saveEvents(events);

    // Emit and handle each event
    for (const event of events) {
      await this.eventEmitter.emitAsync(event.eventType, event);
      
      const handlers = this.handlers.get(event.eventType) || [];
      await Promise.all(handlers.map(handler => handler.handle(event)));
    }
  }

  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>,
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler as EventHandler);
  }

  unsubscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>,
  ): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler as EventHandler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  getHandlers(eventType: string): EventHandler[] {
    return this.handlers.get(eventType) || [];
  }
}