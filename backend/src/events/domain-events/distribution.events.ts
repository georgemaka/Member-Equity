import { DomainEvent } from './base.event';
import { Decimal } from 'decimal.js';

export class DistributionCalculatedEvent extends DomainEvent {
  constructor(
    public readonly distributionId: string,
    public readonly data: {
      companyId: string;
      companyProfitId: string;
      totalAmount: Decimal;
      distributionDate: Date;
      memberDistributions: Array<{
        memberId: string;
        amount: Decimal;
        taxWithholding: Decimal;
        netAmount: Decimal;
      }>;
    },
    metadata: Record<string, any> = {},
  ) {
    super(distributionId, 'Distribution', 'DistributionCalculated', 1, metadata);
  }

  getEventData() {
    return {
      companyId: this.data.companyId,
      companyProfitId: this.data.companyProfitId,
      totalAmount: this.data.totalAmount.toString(),
      distributionDate: this.data.distributionDate.toISOString(),
      memberDistributions: this.data.memberDistributions.map(md => ({
        memberId: md.memberId,
        amount: md.amount.toString(),
        taxWithholding: md.taxWithholding.toString(),
        netAmount: md.netAmount.toString(),
      })),
    };
  }
}

export class DistributionApprovedEvent extends DomainEvent {
  constructor(
    public readonly distributionId: string,
    public readonly data: {
      approvedBy: string;
      approvedAt: Date;
      comments?: string;
    },
    metadata: Record<string, any> = {},
  ) {
    super(distributionId, 'Distribution', 'DistributionApproved', 1, metadata);
  }

  getEventData() {
    return {
      approvedBy: this.data.approvedBy,
      approvedAt: this.data.approvedAt.toISOString(),
      comments: this.data.comments,
    };
  }
}

export class PaymentProcessedEvent extends DomainEvent {
  constructor(
    public readonly memberDistributionId: string,
    public readonly data: {
      distributionId: string;
      memberId: string;
      amount: Decimal;
      paymentMethod: string;
      paymentReference: string;
      paymentDate: Date;
    },
    metadata: Record<string, any> = {},
  ) {
    super(memberDistributionId, 'MemberDistribution', 'PaymentProcessed', 1, metadata);
  }

  getEventData() {
    return {
      distributionId: this.data.distributionId,
      memberId: this.data.memberId,
      amount: this.data.amount.toString(),
      paymentMethod: this.data.paymentMethod,
      paymentReference: this.data.paymentReference,
      paymentDate: this.data.paymentDate.toISOString(),
    };
  }
}