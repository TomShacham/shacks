CREATE TABLE users
(
    id           UUID PRIMARY KEY UNIQUE DEFAULT gen_random_uuid(),
    email        TEXT UNIQUE NOT NULL,
    password     TEXT        NOT NULL,
    salt         TEXT        NOT NULL,
    confirmed_at TIMESTAMP, -- when the email confirmed at
    created_at   TIMESTAMP   NOT NULL,
    updated_at   TIMESTAMP   NOT NULL,
    attempts_at  BIGINT[]   -- when the last N login attempts were to rate limit
);

CREATE INDEX idx_users_id ON users (id);
CREATE INDEX idx_users_email ON users (email);
