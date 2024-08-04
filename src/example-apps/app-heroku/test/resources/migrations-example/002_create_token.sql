CREATE TABLE tokens
(
    token      TEXT      NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    user_id    UUID      NOT NULL,

    FOREIGN KEY (user_id) REFERENCES users (id)
)