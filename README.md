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

## Todo

- performance test
- routing
- multipart form data
  - document
  - error handling ie destroying the stream on error and adding .on('error') handlers to tidy up
  - test multiple file types in one upload
  - client sends multipart form data
  - handle content encoding!
  - max file size so you don't get DOS'd
- handle application/x-www-form-urlencoded
- security e.g. header obfuscation etc. (node should handle this?)
- trailers
- does node handle inflate/deflate ?
  - if not then we can write some filters that do