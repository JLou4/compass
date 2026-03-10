-- Compass Agent API Review Engine Database Schema

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  agent_id VARCHAR(64) NOT NULL,
  service_domain VARCHAR(255) NOT NULL,
  service_name VARCHAR(128),
  endpoint VARCHAR(512),
  task_category VARCHAR(64),
  method VARCHAR(10) DEFAULT 'GET',
  status_code INTEGER,
  success BOOLEAN NOT NULL,
  task_success BOOLEAN,
  latency_ms INTEGER,
  cost_per_call NUMERIC(10,6),
  reliability_score SMALLINT CHECK (reliability_score BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_rollups (
  id SERIAL PRIMARY KEY,
  service_domain VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  total_calls INTEGER,
  success_rate NUMERIC(5,2),
  task_success_rate NUMERIC(5,2),
  avg_latency_ms INTEGER,
  p95_latency_ms INTEGER,
  avg_reliability NUMERIC(3,2),
  UNIQUE(service_domain, date)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reviews_agent_id ON reviews(agent_id);
CREATE INDEX IF NOT EXISTS idx_reviews_service_domain ON reviews(service_domain);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_success ON reviews(success);
CREATE INDEX IF NOT EXISTS idx_reviews_reliability_score ON reviews(reliability_score);
CREATE INDEX IF NOT EXISTS idx_daily_rollups_service_date ON daily_rollups(service_domain, date);