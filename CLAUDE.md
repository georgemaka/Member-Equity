# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Root-level Commands
- `npm run dev` - Start both backend and frontend in development mode
- `npm run build` - Build all packages (shared, backend, frontend)
- `npm run test` - Run tests for both backend and frontend
- `npm run lint` - Lint both backend and frontend code
- `npm run type-check` - Type check both backend and frontend

### Backend Commands (run from backend/ directory)
- `npm run start:dev` - Start NestJS in watch mode
- `npm run build` - Build backend for production
- `npm run test` - Run Jest unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - ESLint validation
- `npm run type-check` - TypeScript type checking
- `npm run migrate` - Run Prisma database migrations
- `npm run seed` - Seed database with initial data
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:studio` - Open Prisma Studio database browser

### Frontend Commands (run from frontend/ directory)
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production with TypeScript compilation
- `npm run lint` - ESLint validation
- `npm run type-check` - TypeScript type checking

### Docker Commands
- `docker-compose up -d` - Start all services in containers
- `docker-compose up -d postgres redis` - Start only database services
- `docker-compose logs -f api` - View backend logs

## Architecture Overview

### System Design
This is a Member Equity Management System for tracking equity ownership and distributions for companies with 100+ members. The system uses event sourcing for financial data integrity and CQRS pattern for read/write separation.

### Core Technologies
- **Backend**: NestJS + TypeScript + Prisma + PostgreSQL + Redis
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + D3.js
- **Authentication**: Auth0 integration with JWT guards
- **Real-time**: Socket.io for live updates
- **Background Jobs**: Bull queue with Redis

### Key Architectural Patterns

#### Event Sourcing (src/events/)
All financial operations are stored as immutable events in the EventStore. The system rebuilds current state from event history, ensuring complete audit trails and data integrity.

- `EventStoreService` - Core event persistence
- `EventBusService` - Event publishing/subscription  
- `EventReplayService` - State reconstruction from events
- Domain events in `domain-events/` (member.events.ts, distribution.events.ts)

#### Module Structure
- `members/` - Member CRUD, equity calculations, Excel import
- `equity/` - Equity percentage tracking and validation
- `distributions/` - Profit distribution calculations and processing
- `analytics/` - Reporting and predictive insights
- `auth/` - JWT authentication with Auth0 strategy
- `notifications/` - Email and real-time notifications
- `documents/` - PDF generation and S3 storage
- `workflows/` - Automated business process handling

### Database Schema
Uses Prisma with PostgreSQL. Key models:
- `Member` - Equity holders with percentage tracking
- `EquityEvent` - Immutable equity change history
- `Distribution` - Profit distribution records
- `CompanyProfit` - Quarterly/annual profit data
- `EventStore` - Event sourcing persistence
- `AuditLog` - System activity tracking

### Frontend Architecture
- Pages in `pages/` for routing (Dashboard, Members, Equity, etc.)
- Reusable components in `components/`
- API services in `services/` with axios
- Custom hooks in `hooks/` for data fetching
- TypeScript types in `types/`

## Development Practices

### Financial Data Handling
- Use Decimal.js for all financial calculations (avoid JavaScript floating point)
- All equity percentages must total 100% (enforced by validation)
- Event sourcing ensures immutable financial records
- UTC timestamps for all financial data

### Database Operations
- Use Prisma migrations for schema changes: `npm run migrate`
- Never delete event tables - only add new ones
- Seed data available via `npm run seed`
- Events must be processed in chronological order

### Testing Strategy
- Unit tests with Jest for business logic
- E2E tests for critical workflows (distributions, equity changes)
- Test coverage reports available
- Mock data hooks in frontend for development

### Code Quality
- ESLint + Prettier for consistent formatting
- TypeScript strict mode enabled
- Husky pre-commit hooks (if configured)
- Environment-specific configurations

## Common Development Tasks

### Adding New Member Fields
1. Update Prisma schema in `prisma/schema.prisma`
2. Run `npm run migrate` to create migration
3. Update DTOs in `src/members/dto/`
4. Extend frontend components and types

### Creating New Event Types
1. Define event in `src/events/domain-events/`
2. Add handler in appropriate service
3. Update event replay logic if affects projections
4. Add to TypeScript event union types

### Database Changes
1. Modify `prisma/schema.prisma`
2. Generate migration: `npx prisma migrate dev --name descriptive_name`
3. Update Prisma client: `npm run prisma:generate`
4. Update related TypeScript types and services

### Environment Setup
The system requires PostgreSQL and Redis. Use Docker Compose for local development:
```bash
docker-compose up -d postgres redis
```

Backend requires `.env` file with DATABASE_URL, REDIS_URL, JWT_SECRET, and Auth0 configuration.
Frontend requires `.env` with VITE_API_URL and Auth0 client configuration.

### Real-time Features
Socket.io integration provides live updates for:
- Equity percentage changes
- Distribution calculations
- Member status updates
- System notifications

Events are emitted from services and consumed by frontend components for immediate UI updates.