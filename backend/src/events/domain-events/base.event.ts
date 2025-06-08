export abstract class DomainEvent {
  public readonly aggregateId: string;
  public readonly aggregateType: string;
  public readonly eventType: string;
  public readonly eventVersion: number;
  public readonly timestamp: Date;
  public readonly metadata: Record<string, any>;

  constructor(
    aggregateId: string,
    aggregateType: string,
    eventType: string,
    eventVersion: number = 1,
    metadata: Record<string, any> = {},
  ) {
    this.aggregateId = aggregateId;
    this.aggregateType = aggregateType;
    this.eventType = eventType;
    this.eventVersion = eventVersion;
    this.timestamp = new Date();
    this.metadata = metadata;
  }

  abstract getEventData(): Record<string, any>;
}