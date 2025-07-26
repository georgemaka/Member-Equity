# Code Optimization Guide

## Overview
This guide provides specific optimization recommendations for the Member Equity Management System based on comprehensive code analysis.

## Critical Optimizations

### 1. Replace Mock Data with Real API Integration

**Current Issue**: 27 files use mock data hooks
**Impact**: High - Blocks production deployment

**Solution**:
```typescript
// Before (frontend/src/pages/Members.tsx)
import { useMockMembersData } from '@/hooks/useMockMembersData';
const { members, totalEquity } = useMockMembersData();

// After
import { useQuery } from '@tanstack/react-query';
import { memberApi } from '@/services/memberApi';

const { data, isLoading, error } = useQuery({
  queryKey: ['members', fiscalYear],
  queryFn: () => memberApi.getMembersForYear(fiscalYear),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### 2. Fix Hardcoded Company ID

**Current Issue**: `'sukut-construction-llc'` hardcoded in controllers
**Location**: backend/src/members/members.controller.ts

**Solution**:
```typescript
// Add company resolver service
@Injectable()
export class CompanyContextService {
  extractCompanyId(request: Request): string {
    const user = request.user as JwtPayload;
    return user.companyId || user.org_id;
  }
}

// Use in controllers
@Post()
create(@Req() req: Request, @Body() dto: CreateMemberDto) {
  const companyId = this.companyContext.extractCompanyId(req);
  return this.membersService.create(companyId, dto);
}
```

### 3. Implement Proper Decimal Handling

**Current Issue**: Financial calculations using JavaScript numbers
**Impact**: Critical - Can cause rounding errors in money

**Solution**:
```typescript
// Create decimal transformer for Prisma
import { Decimal } from 'decimal.js';

const decimalTransformer = {
  to: (value: Decimal): string => value.toString(),
  from: (value: string): Decimal => new Decimal(value)
};

// Use in calculations
calculateDistribution(totalAmount: Decimal, equityPercentage: Decimal): Decimal {
  return totalAmount
    .mul(equityPercentage)
    .div(100)
    .toDecimalPlaces(2, Decimal.ROUND_DOWN);
}
```

### 4. Add Database Query Optimization

**Current Issue**: N+1 queries in member listing
**Location**: backend/src/members/members.service.ts

**Solution**:
```typescript
// Before
const members = await this.prisma.member.findMany();
for (const member of members) {
  const equity = await this.prisma.equityEvent.findFirst({
    where: { memberId: member.id },
    orderBy: { createdAt: 'desc' }
  });
}

// After
const members = await this.prisma.member.findMany({
  include: {
    equityHistory: {
      take: 1,
      orderBy: { createdAt: 'desc' }
    },
    _count: {
      select: { memberDistributions: true }
    }
  }
});
```

### 5. Implement Redis Caching

**Current Issue**: No caching despite Redis configuration
**Impact**: Medium - Performance degradation under load

**Solution**:
```typescript
@Injectable()
export class CacheService {
  constructor(
    @InjectRedis() private redis: Redis,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any, ttl = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length) {
      await this.redis.del(...keys);
    }
  }
}

// Use in service
async getCompanyMetrics(companyId: string) {
  const cacheKey = `metrics:${companyId}`;
  const cached = await this.cache.get(cacheKey);
  if (cached) return cached;

  const metrics = await this.calculateMetrics(companyId);
  await this.cache.set(cacheKey, metrics, 300); // 5 min TTL
  return metrics;
}
```

### 6. Complete Event Sourcing Implementation

**Current Issue**: Event store exists but replay is missing
**Impact**: High - No audit trail recovery

**Solution**:
```typescript
@Injectable()
export class EventReplayService {
  async rebuildProjection(aggregateId: string, aggregateType: string) {
    const events = await this.eventStore.getEventsForAggregate(
      aggregateId,
      aggregateType
    );

    const projection = events.reduce((state, event) => {
      return this.applyEvent(state, event);
    }, this.getInitialState(aggregateType));

    await this.saveProjection(aggregateId, projection);
    return projection;
  }

  private applyEvent(state: any, event: any) {
    switch (event.eventType) {
      case 'MemberCreated':
        return { ...state, ...event.eventData };
      case 'EquityUpdated':
        return { ...state, equityPercentage: event.eventData.newPercentage };
      // Add other event types
      default:
        return state;
    }
  }
}
```

### 7. Add Comprehensive Error Handling

**Current Issue**: Inconsistent error handling
**Impact**: Medium - Poor user experience

**Solution**:
```typescript
// Global exception filter
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof Error
      ? exception.message
      : 'Internal server error';

    // Log to monitoring service
    console.error('Exception caught:', exception);

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    });
  }
}

// Frontend error boundary
export class ErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to monitoring service
  }
}
```

### 8. Security Hardening

**Current Issue**: Secrets in .env file, no input validation
**Impact**: Critical - Security vulnerabilities

**Solution**:
```typescript
// Use environment validation
import { IsString, IsInt, IsUrl, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsUrl()
  DATABASE_URL: string;

  @IsString()
  JWT_SECRET: string;

  @IsInt()
  PORT: number;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config);
  const errors = validateSync(validatedConfig);
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}

// Add rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
}));

// Add helmet for security headers
app.use(helmet());
```

### 9. Optimize Frontend Bundle

**Current Issue**: Multiple dashboard components loaded unnecessarily
**Impact**: Low-Medium - Larger bundle size

**Solution**:
```typescript
// Use lazy loading for routes
const MemberDashboard = lazy(() => import('./pages/MemberDashboard'));
const ComprehensiveDashboard = lazy(() => import('./pages/ComprehensiveDashboard'));

// Consolidate dashboard components
const Dashboard = () => {
  const { user } = useAuth();
  const DashboardComponent = dashboardComponents[user.role] || DefaultDashboard;
  return <DashboardComponent />;
};

// Remove duplicate implementations
// Keep only: Dashboard.tsx (delete SimpleDashboard, ComprehensiveDashboard duplicates)
```

### 10. Add Monitoring and Observability

**Current Issue**: No monitoring despite Sentry configuration
**Impact**: Medium - Can't track production issues

**Solution**:
```typescript
// Backend monitoring
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Add custom spans
async processDistribution(id: string) {
  const transaction = Sentry.startTransaction({
    op: 'distribution',
    name: 'Process Distribution',
  });

  try {
    const calcSpan = transaction.startChild({ op: 'calculate' });
    const result = await this.calculate(id);
    calcSpan.finish();

    const saveSpan = transaction.startChild({ op: 'save' });
    await this.save(result);
    saveSpan.finish();
  } finally {
    transaction.finish();
  }
}

// Frontend monitoring
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
});
```

## Performance Optimizations

### Database Indexes
```sql
-- Add missing indexes
CREATE INDEX idx_member_company_status ON members(company_id, status);
CREATE INDEX idx_equity_member_date ON equity_events(member_id, effective_date DESC);
CREATE INDEX idx_distribution_date ON distributions(distribution_date DESC);
CREATE INDEX idx_event_store_aggregate ON event_store(aggregate_id, aggregate_type, sequence);
```

### Query Optimization
```typescript
// Use select to limit fields
const members = await this.prisma.member.findMany({
  select: {
    id: true,
    firstName: true,
    lastName: true,
    equityPercentage: true,
    status: true,
  },
  where: { status: 'ACTIVE' },
});

// Use pagination
const members = await this.prisma.member.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { lastName: 'asc' },
});
```

### Frontend Performance
```typescript
// Memoize expensive calculations
const totalEquity = useMemo(() => {
  return members.reduce((sum, member) => 
    sum.plus(member.equityPercentage), new Decimal(0)
  );
}, [members]);

// Virtualize large lists
import { FixedSizeList } from 'react-window';

const MemberList = ({ members }) => (
  <FixedSizeList
    height={600}
    itemCount={members.length}
    itemSize={50}
    width='100%'
  >
    {({ index, style }) => (
      <MemberRow member={members[index]} style={style} />
    )}
  </FixedSizeList>
);
```

## Code Quality Improvements

### Add TypeScript Strict Mode
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

### Implement Testing
```typescript
// Example test for distribution calculation
describe('DistributionService', () => {
  it('should calculate member distribution correctly', () => {
    const totalAmount = new Decimal('100000');
    const equityPercentage = new Decimal('15.5');
    
    const result = service.calculateDistribution(
      totalAmount,
      equityPercentage
    );
    
    expect(result.toString()).toBe('15500.00');
  });

  it('should handle tax withholding', () => {
    const distribution = new Decimal('15500');
    const taxRate = new Decimal('24');
    
    const result = service.calculateWithholding(distribution, taxRate);
    
    expect(result.toString()).toBe('3720.00');
  });
});
```

## Refactoring Priorities

1. **Consolidate Dashboard Components** - Remove 3 duplicate implementations
2. **Extract Common Validation Logic** - Create shared validation utilities
3. **Centralize API Error Handling** - Single error interceptor
4. **Standardize Modal Components** - Too many similar modal implementations
5. **Create Shared UI Components** - Reduce code duplication

## Maintenance Recommendations

1. **Set up pre-commit hooks** for linting and formatting
2. **Add API documentation** using Swagger/OpenAPI
3. **Create developer onboarding guide**
4. **Implement feature flags** for gradual rollouts
5. **Add performance budgets** for bundle size and load times

This optimization guide provides a roadmap for improving code quality, performance, and maintainability while addressing the most critical issues first.