-- Migration 011: User Web Push Subscriptions for real OS notifications (Windows, Android, PWA)
CREATE TABLE IF NOT EXISTS user_push_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_user_push_subscriptions_user 
    ON user_push_subscriptions(user_id);
