## h22p - core

This is the core module of h22p

## Simple Http Library

Simple 99% use-case client/server:

    + fast
    + streaming
    + multipart/form-data built-in
    + type-safe routing 
    + openapi spec generation

Simple because:

    + zero dependencies
    + no reflection; no magic; no DI framework; small well-tested codebase
    + symmetrical client and server (ie same interface) 
    + immutable http message objects as close to wire format as possible
    + start/stop server in one line of code 
    + server starts up in milliseconds (unlike heavy frameworks)
    + test in-memory or over the wire (so can easily build a fast test suite)
    + type-safe routing with minimal extra syntax

Design choices:

    + composition over configuation (made easy because there is one simple http interface)
      h22p is light on configuration options, instead you can implement HttpHandler to get 
      whatever behaviour you want around request/response
    + http client responses 4xx or 5xx are not exceptions
      unlike a lot of clients out there, we do not throw an exception so you do not need to try/catch requests
    + there is no routing precedence, we do not want any complexity, it's first come, first served
    + fast (about 4x faster than express from my tests) 