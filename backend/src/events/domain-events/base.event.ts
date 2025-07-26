export abstract class DomainEvent {
  public readonly aggregateId: string;
  public readonly aggregateType: string;
  public readonly eventType: string;
  public readonly eventVersion: number;
  public readonly timestamp: Date;
  public readonly metadata: Record<string, any>;

  constructor(params: {
    aggregateId: string;
    aggregateType: string;
    eventType: string;
    eventVersion?: number;
    metadata?: Record<string, any>;
  }) {
    this.aggregateId = params.aggregateId;
    this.aggregateType = params.aggregateType;
    this.eventType = params.eventType;
    this.eventVersion = params.eventVersion || 1;
    this.timestamp = new Date();
    this.metadata = {
      ...params.metadata,
      userId: params.metadata?.userId || 'system',
      correlationId: params.metadata?.correlationId || this.generateCorrelationId(),
    };
  }

  abstract getEventData(): Record<string, any>;

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}