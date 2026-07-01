-- API: idempotência de webhooks externos
CREATE TABLE IF NOT EXISTS webhook_events (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(20) NOT NULL,
  event_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100),
  processed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, event_id)
);
