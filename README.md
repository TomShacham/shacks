## Simple Http Library

Simple 99% use-case client/server that can do:

    + type-safe routing
    + streaming
    + multipart/form-data

Simple because:

    + zero dependencies
    + no reflection; no magic; no DI framework; small well-tested codebase
    + symmetrical client and server (ie same interface) 
    + immutable http message objects as close to wire format as possible
    + start/stop server in one line of code and just a few ms startup time 
    + test in-memory or over the wire (so can easily build a fast test suite)

Design choices:

    + composition over configuation (made easy because there is one simple http interface) 
    + http client responses 4xx or 5xx are not exceptions
    + json body type?

## Todo

- routing precedence of routes test
- add convenience obj for Status ?
- open api spec generation
- multipart form data
  - check works on other browsers - search internet for test suite to prove it works
  - test if content-type header or content-disposition header is supplied more than once ie is string[]
- handle application/x-www-form-urlencoded
- figure out what things to not export and hide
- continue with h22p statics for discoverability or move to globals?
- deploy to cloudflare cos heroku $$$
- example app
  - filter examples like 404 catch all and tracing
  - database with transactions
  - streaming files to db eg csv with manipulation on the fly including totals
  - streaming files to s3
  - simple json api
  - htmx
  - browser testing with react
  - deploy to cloudflare and use wrangler to test it locally
- performance test
- security e.g. header obfuscation etc. (node should handle this?)
- content-range
- trailers
- does node handle inflate/deflate ?
  - if not then we can write some filters that do

## Open questions

