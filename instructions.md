# Member Equity Management System

## Overview

### What does this system do?
The Member Equity Management System is a comprehensive web application designed to track and manage equity ownership, distributions, and financial transactions for companies with multiple equity holders (typically 100+ members). The system handles complex scenarios including:

- Dynamic equity percentage tracking as members join, leave, or have their ownership adjusted
- Automated profit distribution calculations based on ownership percentages
- Tax withholding and K-1 preparation for members
- Historical balance tracking with complete audit trails
- Real-time collaboration between administrators and members
- Predictive analytics for financial planning

### What problem does it solve?
Traditional spreadsheet-based equity management becomes unwieldy and error-prone with large member bases. This system provides:

- **Data Integrity**: Event sourcing ensures no financial data is ever lost or corrupted
- **Automation**: Smart contracts automatically calculate distributions and tax obligations
- **Compliance**: Built-in K-1 preparation and regulatory reporting
- **Transparency**: Members can view their equity evolution and receive automated reports
- **Scalability**: Handles complex workflows for 100+ members with real-time updates

## Technologies Used

### Backend
- **Node.js** (v18.17.0) - Runtime environment
- **NestJS** (v10.0.0) - Enterprise-grade Node.js framework
- **TypeScript** (v5.1.0) - Type-safe JavaScript
- **PostgreSQL** (v15.0) - Primary database with JSONB support for events
- **Prisma** (v5.0.0) - Database ORM and migration tool
- **Redis** (v7.0) - Session management and real-time features
- **Bull** (v4.10.0) - Background job processing
- **Socket.io** (v4.7.0) - Real-time communication

### Frontend
- **React** (v18.2.0) - UI framework
- **TypeScript** (v5.1.0) - Type safety
- **Vite** (v4.4.0) - Build tool and dev server
- **Tailwind CSS** (v3.3.0) - Utility-first styling
- **D3.js** (v7.8.0) - Data visualizations
- **React Query** (v4.29.0) - Server state management
- **React Hook Form** (v7.45.0) - Form management
- **Recharts** (v2.7.0) - Chart components

### Infrastructure & DevOps
- **Docker** (v24.0.0) - Containerization
- **Docker Compose** (v2.20.0) - Multi-container orchestration
- **Nginx** (v1.25.0) - Reverse proxy and static file serving
- **Jest** (v29.6.0) - Testing framework
- **ESLint** (v8.45.0) - Code linting
- **Prettier** (v3.0.0) - Code formatting

### External Services
- **AWS S3** - Document storage
- **SendGrid** - Email notifications
- **Plaid** (optional) - Banking integrations
- **Auth0** - Authentication and authorization

## Setup & Installation

### Prerequisites
- **Node.js** v18.17.0 or higher
- **PostgreSQL** v15.0 or higher
- **Redis** v7.0 or higher
- **Docker** and **Docker Compose** (for containerized setup)
- **Git**

### Local Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/your-org/member-equity-system.git
cd member-equity-system
```

2. **Install dependencies**
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root
cd ..
```

3. **Database setup**
```bash
# Start PostgreSQL and Redis with Docker
docker-compose up -d postgres redis

# Run database migrations
cd backend
npx prisma migrate dev
npx prisma generate

# Seed initial data (optional)
npm run seed
```

4. **Start development servers**
```bash
# Terminal 1: Start backend
cd backend
npm run start:dev

# Terminal 2: Start frontend
cd frontend
npm run dev

# Terminal 3: Start background workers
cd backend
npm run worker:dev
```

### Docker Setup (Alternative)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api frontend worker
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Environment Configuration

### Backend Environment Variables
Create `backend/.env`:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/equity_system"
REDIS_URL="redis://localhost:6379"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"
AUTH0_DOMAIN="your-domain.auth0.com"
AUTH0_CLIENT_ID="your-auth0-client-id"
AUTH0_CLIENT_SECRET="your-auth0-client-secret"

# Email
SENDGRID_API_KEY="SG.your-sendgrid-api-key"
FROM_EMAIL="noreply@yourcompany.com"

# File Storage
AWS_REGION="us-east-1"
AWS_S3_BUCKET="equity-system-documents"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"

# Application
NODE_ENV="development"
PORT="3001"
CORS_ORIGIN="http://localhost:3000"

# Banking (optional)
PLAID_CLIENT_ID="your-plaid-client-id"
PLAID_SECRET="your-plaid-secret"
PLAID_ENV="sandbox"

# Event Sourcing
EVENT_STORE_ENCRYPTION_KEY="32-character-encryption-key-here"

# Background Jobs
BULL_REDIS_URL="redis://localhost:6379"

# Monitoring
SENTRY_DSN="your-sentry-dsn" # optional
```

### Frontend Environment Variables
Create `frontend/.env`:

```env
# API Configuration
VITE_API_URL="http://localhost:3001"
VITE_WS_URL="ws://localhost:3001"

# Authentication
VITE_AUTH0_DOMAIN="your-domain.auth0.com"
VITE_AUTH0_CLIENT_ID="your-auth0-client-id"
VITE_AUTH0_AUDIENCE="https://api.equity-system.com"

# Feature Flags
VITE_ENABLE_AI_INSIGHTS="true"
VITE_ENABLE_PREDICTIVE_ANALYTICS="true"
VITE_ENABLE_REAL_TIME="true"

# External Services
VITE_SENTRY_DSN="your-frontend-sentry-dsn" # optional
```

## Usage Instructions

### Running the Application

1. **Start all services**:
```bash
npm run dev
```

2. **Access the application**:
   - Navigate to http://localhost:3000
   - Login with your Auth0 credentials
   - Default admin user (development only): admin@example.com / password123

### Key User Flows

#### For Members:
1. **View Dashboard**: See current equity percentage, recent distributions, tax withholdings
2. **Historical Data**: Access yearly statements and equity evolution charts
3. **Download Documents**: Export PDFs of statements and tax documents

#### For Administrators:
1. **Member Management**: Add new members, update equity percentages, handle retirements
2. **Distribution Processing**: Calculate and approve profit distributions
3. **Financial Reporting**: Generate company-wide reports and analytics

### API Examples

**Get member equity history**:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3001/api/members/123/equity-history?year=2024"
```

**Create distribution**:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"companyProfitId": "456", "distributionDate": "2024-12-31"}' \
  "http://localhost:3001/api/distributions"
```

## Code Structure & Logic Flow

```
├── backend/
│   ├── src/
│   │   ├── auth/                 # Authentication & authorization
│   │   ├── members/              # Member management
│   │   ├── equity/               # Equity tracking and calculations
│   │   ├── distributions/        # Distribution processing
│   │   ├── events/               # Event sourcing infrastructure
│   │   ├── analytics/            # AI insights and predictions
│   │   ├── documents/            # PDF generation and storage
│   │   ├── workflows/            # Automated workflow engine
│   │   ├── notifications/        # Email and real-time notifications
│   │   └── common/               # Shared utilities and guards
│   ├── prisma/                   # Database schema and migrations
│   ├── test/                     # Integration and e2e tests
│   └── docker/                   # Docker configuration
├── frontend/
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── pages/                # Route-based page components
│   │   ├── hooks/                # Custom React hooks
│   │   ├── services/             # API client and utilities
│   │   ├── stores/               # State management
│   │   ├── types/                # TypeScript type definitions
│   │   └── utils/                # Helper functions
│   ├── public/                   # Static assets
│   └── tests/                    # Frontend unit tests
├── shared/                       # Shared types and utilities
├── docs/                         # Additional documentation
└── docker-compose.yml            # Multi-service orchestration
```

### Key Backend Modules

#### Event Sourcing (`src/events/`)
- **EventStore**: Core event persistence and retrieval
- **EventBus**: Publishes events to subscribers
- **EventReplay**: Rebuilds state from event history
- **Events**: Domain events (MemberEquityChanged, DistributionCalculated, etc.)

#### Members (`src/members/`)
- **MembersService**: CRUD operations and business logic
- **MembersController**: REST API endpoints
- **EquityCalculator**: Handles equity percentage validations and calculations
- **MemberProjection**: Builds current member state from events

#### Distributions (`src/distributions/`)
- **DistributionEngine**: Smart contract logic for automatic calculations
- **DistributionService**: Manual distribution management
- **TaxCalculator**: Withholding calculations and K-1 preparation
- **PaymentProcessor**: ACH, wire, and check payment handling

#### Analytics (`src/analytics/`)
- **PredictiveEngine**: ML-based forecasting and insights
- **ReportGenerator**: Automated report creation
- **VisualizationService**: Data preparation for frontend charts
- **AnomalyDetector**: Fraud and error detection

### Key Frontend Components

#### Dashboard (`src/pages/Dashboard/`)
- **MemberDashboard**: Member-specific equity and balance overview
- **AdminDashboard**: Company-wide metrics and controls
- **PredictiveCharts**: AI-powered forecasting visualizations

#### Equity Management (`src/pages/Equity/`)
- **EquityTimeline**: Interactive equity evolution charts
- **EquityEditor**: Admin interface for percentage adjustments
- **DistributionCalculator**: Preview distribution scenarios

#### Workflows (`src/pages/Workflows/`)
- **DistributionWorkflow**: Step-by-step distribution processing
- **ApprovalChains**: Multi-admin approval interfaces
- **PaymentForms**: Banking information collection

## Dependencies & Assumptions

### Third-Party Services Required
- **PostgreSQL**: Primary data store with JSONB support for events
- **Redis**: Required for session management, real-time features, and job queues
- **Auth0**: Authentication provider (can be swapped for other providers)
- **SendGrid**: Email delivery service
- **AWS S3**: Document storage (configurable for other providers)

### Optional Services
- **Plaid**: Banking integration for payment processing
- **Sentry**: Error monitoring and performance tracking

### Key Assumptions
1. **Financial Data Integrity**: The system assumes all financial data must be immutable once recorded (achieved through event sourcing)
2. **Equity Percentages**: Total company equity must always equal 100% (enforced by validation)
3. **Member Lifecycle**: Members can only be "soft deleted" to maintain historical integrity
4. **Tax Jurisdiction**: Currently assumes US tax regulations (K-1 forms, SOFR rates)
5. **Browser Support**: Modern browsers with WebSocket support for real-time features
6. **Network**: Assumes reliable internet for real-time collaboration features

### Gotchas
- **Event Order**: Events must be processed in chronological order for accurate balance calculations
- **Time Zones**: All financial calculations use UTC; display formatting handles local time zones
- **Decimal Precision**: Uses `decimal.js` for precise financial calculations (avoid JavaScript's floating-point issues)
- **Database Migrations**: Never delete event tables - only add new ones for schema evolution

## Extensibility

### Adding New Event Types
1. Define the event in `src/events/domain-events/`
2. Create corresponding handler in the appropriate service
3. Update event replay logic if the event affects projections
4. Add event to TypeScript union types

### Adding New Member Fields
1. Update Prisma schema in `prisma/schema.prisma`
2. Create migration: `npx prisma migrate dev`
3. Update DTOs in `src/members/dto/`
4. Extend frontend forms and displays

### Integrating New Payment Providers
1. Implement `PaymentProvider` interface in `src/distributions/providers/`
2. Add provider configuration to environment variables
3. Register provider in the `PaymentModule`
4. Add provider-specific UI components

### Adding New Visualization Types
1. Create D3.js component in `frontend/src/components/charts/`
2. Add data preparation logic in `VisualizationService`
3. Register chart type in the dashboard configuration
4. Add TypeScript types for chart data

### Architectural Considerations
- **Event Sourcing**: All state changes should be captured as events
- **CQRS**: Separate read models (projections) from write models (commands)
- **Microservices Ready**: Modules are designed to be extracted into separate services
- **API Versioning**: Use URL versioning (`/v1/`, `/v2/`) for breaking changes
- **Feature Flags**: Use environment variables for experimental features

## API Documentation

### Authentication
All API endpoints require JWT authentication via Auth0:
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIs...
```

### Core Endpoints

#### Members
```http
GET /api/v1/members
GET /api/v1/members/:id
POST /api/v1/members
PATCH /api/v1/members/:id
DELETE /api/v1/members/:id
GET /api/v1/members/:id/equity-history
GET /api/v1/members/:id/balance-history
```

#### Distributions
```http
GET /api/v1/distributions
POST /api/v1/distributions
GET /api/v1/distributions/:id
PATCH /api/v1/distributions/:id
POST /api/v1/distributions/:id/approve
POST /api/v1/distributions/:id/process-payment
```

#### Analytics
```http
GET /api/v1/analytics/predictions/:memberId
GET /api/v1/analytics/company-metrics
POST /api/v1/analytics/generate-report
GET /api/v1/analytics/insights
```

### Example Payloads

**Create Member**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "equityPercentage": 2.5,
  "taxWithholdingPercentage": 25.0,
  "joinDate": "2024-01-01",
  "bankingInfo": {
    "accountType": "checking",
    "routingNumber": "123456789",
    "accountNumber": "987654321"
  }
}
```

**Distribution Response**:
```json
{
  "id": "dist_123",
  "companyProfitId": "profit_456",
  "totalAmount": 1000000.00,
  "distributionDate": "2024-12-31",
  "status": "approved",
  "memberDistributions": [
    {
      "memberId": "member_789",
      "amount": 25000.00,
      "taxWithholding": 6250.00,
      "netAmount": 18750.00
    }
  ],
  "createdAt": "2024-12-15T10:30:00Z",
  "approvedAt": "2024-12-16T14:45:00Z"
}
```

### WebSocket Events
Real-time events are published via Socket.io:
```javascript
// Client subscription
socket.on('member.equity.updated', (data) => {
  console.log('Equity updated:', data);
});

socket.on('distribution.calculated', (data) => {
  console.log('New distribution:', data);
});

socket.on('notification.new', (data) => {
  console.log('Notification:', data);
});
```

## Development Workflow

### Running Tests
```bash
# Backend unit tests
cd backend && npm test

# Frontend unit tests
cd frontend && npm test

# Integration tests
cd backend && npm run test:e2e

# Test coverage
npm run test:coverage
```

### Code Quality
```bash
# Linting
npm run lint

# Formatting
npm run format

# Type checking
npm run type-check
```

### Debugging
- Backend API: http://localhost:3001/api/docs (Swagger UI)
- Database: Use Prisma Studio: `npx prisma studio`
- Redis: Use RedisInsight or CLI: `redis-cli monitor`
