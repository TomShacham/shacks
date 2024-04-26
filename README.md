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

- multipart form data
  - check works on other browsers
  - create some code that streams a file to S3
  - document
- handle application/x-www-form-urlencoded
- performance test
- routing
  - path parms
  - query params
  - header params ?
  - regexp for paths like /*/foo ?
  - trailing slashes
- security e.g. header obfuscation etc. (node should handle this?)
- content-range
- trailers
- does node handle inflate/deflate ?
  - if not then we can write some filters that do

## Open questions

- change HttpMessageBody to just stream?
  and separate out interface for HttpClientRequest and HttpServerResponse
  so you can still conveniently use a string body
  but when dealing with a node request we are always streaming
  