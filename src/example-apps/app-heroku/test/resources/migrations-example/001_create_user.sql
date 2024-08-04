CREATE TABLE IF NOT EXISTS users
(
    id
    UUID
    PRIMARY
    KEY
    UNIQUE,
    createdAt
    TIMESTAMP
    NOT
    NULL,
    updatedAt
    TIMESTAMP
    NOT
    NULL
)