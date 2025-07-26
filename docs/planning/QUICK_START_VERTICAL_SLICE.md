# Quick Start: Members Module Vertical Slice

## Overview
This guide provides step-by-step instructions to implement the Members module as the first vertical slice, establishing patterns for the entire application.

## Prerequisites

```bash
# Start infrastructure
docker-compose up -d postgres redis

# Install dependencies
npm install

# Run database migrations
cd backend && npm run migrate
```

## Step 1: Fix Authentication (Day 1)

### 1.1 Update JWT Strategy
```typescript
// backend/src/auth/strategies/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    if (!payload.companyId) {
      throw new UnauthorizedException('Invalid token: missing company');
    }
    return {
      userId: payload.sub,
      email: payload.email,
      companyId: payload.companyId,
      role: payload.role,
    };
  }
}
```

### 1.2 Add Request Context
```typescript
// backend/src/common/decorators/user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export const CompanyId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.companyId;
  },
);
```

## Step 2: Complete Members Service (Day 1-2)

### 2.1 Update Members Controller
```typescript
// backend/src/members/members.controller.ts
@Controller('members')
@UseGuards(JwtAuthGuard)
export class MembersController {
  @Post()
  @Roles('admin')
  create(
    @CompanyId() companyId: string,
    @Body() createMemberDto: CreateMemberDto
  ) {
    return this.membersService.create(companyId, createMemberDto);
  }

  @Get()
  findAll(
    @CompanyId() companyId: string,
    @Query() pagination: PaginationDto
  ) {
    return this.membersService.findAll(companyId, pagination);
  }
}
```

### 2.2 Implement Service Methods
```typescript
// backend/src/members/members.service.ts
async create(companyId: string, dto: CreateMemberDto) {
  // Validate equity total won't exceed 100%
  const currentTotal = await this.getCurrentEquityTotal(companyId);
  const newTotal = currentTotal.plus(dto.equityPercentage);
  
  if (newTotal.greaterThan(100)) {
    throw new BadRequestException(
      `Cannot add member: total equity would be ${newTotal}%`
    );
  }

  // Create member with event
  const member = await this.prisma.$transaction(async (tx) => {
    const member = await tx.member.create({
      data: {
        ...dto,
        companyId,
        equityPercentage: new Decimal(dto.equityPercentage),
      },
    });

    // Create event
    const event = new MemberCreatedEvent({
      aggregateId: member.id,
      companyId,
      memberData: member,
    });

    await this.eventStore.saveEvent(event);
    this.eventBus.publish(event);

    return member;
  });

  return member;
}
```

## Step 3: Add Event Sourcing (Day 2-3)

### 3.1 Define Domain Events
```typescript
// backend/src/events/domain-events/member.events.ts
export class MemberCreatedEvent extends DomainEvent {
  constructor(data: {
    aggregateId: string;
    companyId: string;
    memberData: any;
  }) {
    super({
      aggregateId: data.aggregateId,
      aggregateType: 'Member',
      eventType: 'MemberCreated',
      eventData: data.memberData,
    });
  }
}

export class MemberEquityUpdatedEvent extends DomainEvent {
  constructor(data: {
    aggregateId: string;
    previousPercentage: Decimal;
    newPercentage: Decimal;
    reason: string;
  }) {
    super({
      aggregateId: data.aggregateId,
      aggregateType: 'Member',
      eventType: 'MemberEquityUpdated',
      eventData: {
        previousPercentage: data.previousPercentage.toString(),
        newPercentage: data.newPercentage.toString(),
        reason: data.reason,
      },
    });
  }
}
```

### 3.2 Implement Event Handlers
```typescript
// backend/src/members/members.service.ts
@OnEvent('member.created')
async handleMemberCreated(event: MemberCreatedEvent) {
  // Update company equity totals cache
  await this.cache.invalidate(`equity:${event.metadata.companyId}`);
  
  // Send welcome email
  await this.notifications.sendMemberWelcome(event.eventData);
}

@OnEvent('member.equity.updated')
async handleEquityUpdated(event: MemberEquityUpdatedEvent) {
  // Create audit log
  await this.auditLog.create({
    action: 'EQUITY_UPDATE',
    resourceType: 'Member',
    resourceId: event.aggregateId,
    previousData: { equity: event.eventData.previousPercentage },
    newData: { equity: event.eventData.newPercentage },
  });
}
```

## Step 4: Frontend Integration (Day 3-4)

### 4.1 Replace Mock Hook
```typescript
// frontend/src/hooks/useMembers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memberApi } from '@/services/memberApi';

export function useMembers(fiscalYear: number) {
  return useQuery({
    queryKey: ['members', fiscalYear],
    queryFn: () => memberApi.getMembersForYear(fiscalYear),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: memberApi.createMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Member created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create member');
    },
  });
}
```

### 4.2 Update Members Page
```typescript
// frontend/src/pages/MembersEnhanced.tsx
import { useMembers, useCreateMember } from '@/hooks/useMembers';

export default function MembersEnhanced() {
  const { fiscalYear } = useFiscalYear();
  const { data, isLoading, error } = useMembers(fiscalYear);
  const createMember = useCreateMember();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  const members = data?.members || [];
  const totalEquity = data?.totalEquity || 0;

  return (
    <div>
      {/* Member list UI */}
      <MemberList 
        members={members} 
        onCreateMember={(data) => createMember.mutate(data)}
      />
    </div>
  );
}
```

## Step 5: Real-time Updates (Day 4)

### 5.1 Backend Socket Implementation
```typescript
// backend/src/events/events.gateway.ts
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN,
  },
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  @OnEvent('member.*')
  handleMemberEvents(event: DomainEvent) {
    // Emit to company room
    this.server
      .to(`company:${event.metadata.companyId}`)
      .emit('member:update', event);
  }

  @SubscribeMessage('join:company')
  handleJoinCompany(
    @MessageBody() companyId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`company:${companyId}`);
    return { event: 'joined', data: companyId };
  }
}
```

### 5.2 Frontend Socket Integration
```typescript
// frontend/src/hooks/useRealtimeUpdates.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';

export function useRealtimeUpdates(companyId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL);
    
    socket.emit('join:company', companyId);
    
    socket.on('member:update', (event) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['members'] });
      
      // Show notification for important events
      if (event.eventType === 'MemberEquityUpdated') {
        toast.info('Member equity has been updated');
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [companyId]);
}
```

## Step 6: Testing (Day 5)

### 6.1 Backend Unit Tests
```typescript
// backend/src/members/members.service.spec.ts
describe('MembersService', () => {
  let service: MembersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [MembersService, PrismaService],
    }).compile();

    service = module.get(MembersService);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create member when equity total is valid', async () => {
      jest.spyOn(service, 'getCurrentEquityTotal').mockResolvedValue(
        new Decimal('75')
      );

      const dto: CreateMemberDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        equityPercentage: 10,
      };

      const result = await service.create('company-1', dto);
      
      expect(result.equityPercentage).toBe('10');
      expect(prisma.member.create).toHaveBeenCalled();
    });

    it('should throw when equity exceeds 100%', async () => {
      jest.spyOn(service, 'getCurrentEquityTotal').mockResolvedValue(
        new Decimal('95')
      );

      const dto: CreateMemberDto = {
        equityPercentage: 10, // Would total 105%
      };

      await expect(service.create('company-1', dto)).rejects.toThrow(
        'total equity would be 105%'
      );
    });
  });
});
```

### 6.2 Frontend Component Tests
```typescript
// frontend/src/pages/MembersEnhanced.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MembersEnhanced from './MembersEnhanced';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('MembersEnhanced', () => {
  it('should display members list', async () => {
    render(<MembersEnhanced />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('15.00%')).toBeInTheDocument();
    });
  });

  it('should create new member', async () => {
    render(<MembersEnhanced />, { wrapper });
    
    const addButton = screen.getByText('Add Member');
    await userEvent.click(addButton);

    // Fill form
    await userEvent.type(screen.getByLabelText('First Name'), 'Jane');
    await userEvent.type(screen.getByLabelText('Last Name'), 'Smith');
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.type(screen.getByLabelText('Equity %'), '5');

    // Submit
    await userEvent.click(screen.getByText('Create Member'));

    await waitFor(() => {
      expect(screen.getByText('Member created successfully')).toBeInTheDocument();
    });
  });
});
```

## Validation Checklist

Before moving to the next module, ensure:

- [ ] All CRUD operations work end-to-end
- [ ] Events are properly stored and published
- [ ] Real-time updates work in the UI
- [ ] Error handling shows user-friendly messages
- [ ] Unit tests pass with >80% coverage
- [ ] Integration tests verify the full flow
- [ ] No hardcoded values remain
- [ ] Authentication properly validates company context
- [ ] Decimal calculations are accurate
- [ ] Performance is acceptable (<200ms API responses)

## Next Steps

Once the Members module is complete:

1. **Document the patterns** established
2. **Create templates** for other modules
3. **Review with team** for feedback
4. **Apply same approach** to Equity module

## Common Pitfalls to Avoid

1. **Don't skip tests** - They ensure patterns work correctly
2. **Don't use number type** for money - Always use Decimal
3. **Don't forget events** - Every state change needs an event
4. **Don't cache too aggressively** - Start simple, optimize later
5. **Don't skip error handling** - Users need clear feedback

This vertical slice establishes the foundation for all other modules. Take time to get it right!