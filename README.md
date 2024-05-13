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
      h22p is light on configuration options, instead you can implement HttpHandler and delegate
    + http client responses 4xx or 5xx are not exceptions
      unlike a lot of clients out there, we do not throw an exception so you do not need to try/catch requests
    + type-safe routing to preserve type safety 
    + 

Questions:

    - do we like the h22p static for exposing the api
      - i dont like global leakage and it aids in discoverability, but a bit more verbose (h22p. = 5 more chars)
    - can we generate open api spec from just types :S might need some other api around routing

## Todo

- open api spec generation
- handle application/x-www-form-urlencoded
  - handle diff charsets like qs does
  - support chars not properly decoded by decodeURIComponent like €
- figure out what things to not export and hide
- deploy to cloudflare cos heroku $$$
- example app (idea is to iterate the library through using it to actually build stuff)
  - so-called "filters" like 404 catch all and tracing and 5xx translation
  - database with transactions
  - streaming files to db eg csv with manipulation on the fly including totals
  - streaming files to s3
  - simple json api
  - htmx
  - react + happydom in-memory e2e testing
  - browser testing with react
  - deploy to cloudflare and use wrangler to test it locally
  - CRDTs?
  - websockets?
  - pulumi? or some IaC to define our service
    - example monorepo sharing a client across it
- performance test
  - look at express's benchmarking
- security e.g. header obfuscation etc. (node should handle this?)
- content-range
- trailers
- does node handle inflate/deflate ?
  - if not then we can write some filters that do

## Open questions

