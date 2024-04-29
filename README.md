## Simple Http Library

Simple 99% use-case client/server

    + type-safe routing
    + streaming
    + multipart/form-data

For when you don't want a stupid framework that gets in your way

Simple:

    + zero dependencies
    + no reflection; no magic; no DI framework; small simple codebase
    + symmetrical client and server (ie same interface) 
    + immutable http message objects as close to wire format as possible
    
Cool features:

    + start/stop server in one line of code 
    + test in-memory or over the wire in a few ms startup time

Design choices:

    + composition over configuation (made easy because there is one simple http interface) 
    + http client responses 4xx or 5xx are not exceptions
    + 

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

