### example app

### decisions

- tokens stored in TIMESTAMPTZ as advised on node pg docs
  > note: I generally use TIMESTAMPTZ when storing dates; otherwise, inserting a time from a process in one timezone
  > and reading it out in a process in another timezone can cause unexpected differences in the time.

### todo

- sessions, sudo mode
- forgot, reset password
- login as, for admin
- admin users
- static file handler, htmx 

