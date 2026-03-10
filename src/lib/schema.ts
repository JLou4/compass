import { integer, pgTable, serial, varchar, timestamp, text, boolean, numeric, smallint, date } from 'drizzle-orm/pg-core';

export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  agentId: varchar('agent_id', { length: 64 }).notNull(),
  serviceDomain: varchar('service_domain', { length: 255 }).notNull(),
  serviceName: varchar('service_name', { length: 128 }),
  endpoint: varchar('endpoint', { length: 512 }),
  taskCategory: varchar('task_category', { length: 64 }),
  method: varchar('method', { length: 10 }).default('GET'),
  statusCode: integer('status_code'),
  success: boolean('success').notNull(),
  taskSuccess: boolean('task_success'),
  latencyMs: integer('latency_ms'),
  costPerCall: numeric('cost_per_call', { precision: 10, scale: 6 }),
  reliabilityScore: smallint('reliability_score'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const dailyRollups = pgTable('daily_rollups', {
  id: serial('id').primaryKey(),
  serviceDomain: varchar('service_domain', { length: 255 }).notNull(),
  date: date('date').notNull(),
  totalCalls: integer('total_calls'),
  successRate: numeric('success_rate', { precision: 5, scale: 2 }),
  taskSuccessRate: numeric('task_success_rate', { precision: 5, scale: 2 }),
  avgLatencyMs: integer('avg_latency_ms'),
  p95LatencyMs: integer('p95_latency_ms'),
  avgReliability: numeric('avg_reliability', { precision: 3, scale: 2 }),
});