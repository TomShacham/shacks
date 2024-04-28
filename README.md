## Simple Http Library

Simple 99% use-case client/server

    + type-safe routing
    + streaming
    + multipart/form-data

For when you don't want a stupid framework that gets in your way

Simple:

    + zero dependencies
    + symmetrical client/server and one simple http interface
    + immutable http message objects close to wire format
    + start/stop server in one line
    + test in-memory or over the wire in a few ms startup time
    + no reflection; no magic; no DI framework; small simple codebase

Design choices:

    + http responses 4xx or 5xx are not exceptions

## Todo

- example app
- typed http client from routes
  - open api spec generation
- multipart form data
  - check works on other browsers - check internet for test suite to prove it works
  - create some code that streams a file to S3
- handle application/x-www-form-urlencoded
- performance test
- security e.g. header obfuscation etc. (node should handle this?)
- content-range
- trailers
- does node handle inflate/deflate ?
  - if not then we can write some filters that do

## Open questions

