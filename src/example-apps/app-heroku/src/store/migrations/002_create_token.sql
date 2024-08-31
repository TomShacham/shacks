CREATE TABLE tokens
(
    token      TEXT      NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    user_id    UUID      NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
)