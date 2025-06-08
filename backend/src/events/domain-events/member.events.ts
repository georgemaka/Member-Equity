import { DomainEvent } from './base.event';
import { Decimal } from 'decimal.js';

export class MemberCreatedEvent extends DomainEvent {
  constructor(
    public readonly memberId: string,
    public readonly data: {
      companyId: string;
      firstName: string;
      lastName: string;
      email: string;
      equityPercentage: Decimal;
      joinDate: Date;
    },
    metadata: Record<string, any> = {},
  ) {
    super(memberId, 'Member', 'MemberCreated', 1, metadata);
  }

  getEventData() {
    return {
      companyId: this.data.companyId,
      firstName: this.data.firstName,
      lastName: this.data.lastName,
      email: this.data.email,
      equityPercentage: this.data.equityPercentage.toString(),
      joinDate: this.data.joinDate.toISOString(),
    };
  }
}

export class MemberEquityChangedEvent extends DomainEvent {
  constructor(
    public readonly memberId: string,
    public readonly data: {
      previousPercentage: Decimal;
      newPercentage: Decimal;
      effectiveDate: Date;
      reason: string;
    },
    metadata: Record<string, any> = {},
  ) {
    super(memberId, 'Member', 'MemberEquityChanged', 1, metadata);
  }

  getEventData() {
    return {
      previousPercentage: this.data.previousPercentage.toString(),
      newPercentage: this.data.newPercentage.toString(),
      effectiveDate: this.data.effectiveDate.toISOString(),
      reason: this.data.reason,
    };
  }
}

export class MemberRetiredEvent extends DomainEvent {
  constructor(
    public readonly memberId: string,
    public readonly data: {
      retirementDate: Date;
      finalEquityPercentage: Decimal;
      reason: string;
    },
    metadata: Record<string, any> = {},
  ) {
    super(memberId, 'Member', 'MemberRetired', 1, metadata);
  }

  getEventData() {
    return {
      retirementDate: this.data.retirementDate.toISOString(),
      finalEquityPercentage: this.data.finalEquityPercentage.toString(),
      reason: this.data.reason,
    };
  }
}