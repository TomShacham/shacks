### example app

### decisions

- tokens stored in TIMESTAMPTZ as advised on node pg docs
  > note: I generally use TIMESTAMPTZ when storing dates; otherwise, inserting a time from a process in one timezone
  > and reading it out in a process in another timezone can cause unexpected differences in the time.

### todo

- sessions, sudo mode
  - frontend with http-only cookies etc
  - cors policy
  - csrf
- confirm password via email
- forgot, reset password
- login as, for admin
- admin users / capabilities e.g. can_edit_users 
- static file handler, htmx 

