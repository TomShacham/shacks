CREATE TABLE sessions
(
    token        TEXT        NOT NULL UNIQUE,
    refreshed_at TIMESTAMPTZ NOT NULL,
    expires_at   TIMESTAMPTZ NOT NULL,
    user_id      UUID        NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_session_user_id ON sessions (user_id);
CREATE INDEX idx_session_token ON sessions (token);


-- every time the session is used we can extend the expires_at
-- use refreshed_at to see if we should re-authenticate e.g. for sudo_mode

-- Sudo mode
--   An alternative to short-lived sessions is to implement long-lived sessions coupled with sudo mode.
--   Sudo mode allows authenticated users to access security-critical components for a limited time by re-authenticating
--   with one of their credentials (passwords, passkeys, TOTP, etc). A simple way to implement this is by keeping track
--   of when the user last used their credentials in each session. This approach provides the security benefits of
--   short-lived sessions without annoying frequent users. This can also help against session hijacking.