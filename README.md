# 🧭 Compass - Agent API Review Engine

A Next.js TypeScript application for reviewing and monitoring agent APIs.

## Features

- **API Review Dashboard** - Monitor API performance and success rates
- **Agent Tracking** - Track API calls by agent ID
- **Service Monitoring** - Monitor different service domains and endpoints
- **Performance Metrics** - Response times and status codes
- **Database Integration** - Neon Postgres with Drizzle ORM

## Tech Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Neon Postgres
- **ORM:** Drizzle ORM
- **Deployment:** Vercel (recommended)

## Getting Started

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Environment Setup

The project uses the existing agent-directory Neon database. Environment variables are already configured in `.env.local`.

### 3. Database Setup

Run the database migration to create the required tables:

```bash
npm run db:migrate
```

### 4. Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Schema

The `reviews` table stores API review data:

- `id` - Primary key
- `agent_id` - ID of the agent making the call
- `service_domain` - Domain of the service being tested
- `service_name` - Human-readable service name
- `endpoint` - API endpoint URL
- `task_category` - Category of the API task
- `method` - HTTP method (GET, POST, etc.)
- `status_code` - HTTP response status
- `response_time` - Response time in milliseconds
- `success` - Boolean success flag
- `error_message` - Error details if failed
- `review_notes` - Additional notes
- `created_at` - Timestamp of creation
- `updated_at` - Last update timestamp

## API Endpoints

### Reviews
- **POST /api/reviews** - Create new review (auto-parses service_domain from endpoint URL if not provided)
- **GET /api/reviews?service=domain** - Get reviews for a service, sorted by recency

### Services  
- **GET /api/services** - List all services with aggregated stats from daily_rollups
- **GET /api/services/[domain]** - Detailed stats for one service

### Rollups
- **POST /api/rollup** - Trigger daily rollup aggregation (calculates success_rate, task_success_rate, avg/p95 latency from raw reviews)
- **POST /api/rollup?date=YYYY-MM-DD** - Trigger rollup for specific date

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test:api` - Test API endpoints with sample data

## Testing

To test the API with sample data:

1. Start the development server: `npm run dev`
2. Run the API test script: `npm run test:api`
3. Visit http://localhost:3000 to view the dashboard

The test script will create sample reviews, trigger rollups, and demonstrate all API endpoints.

## Notes

- The original CREATE TABLE specification was incomplete
- Current schema includes reasonable fields for an API review engine
- Update `src/lib/schema.ts` and `src/lib/migrations.sql` if different fields are needed