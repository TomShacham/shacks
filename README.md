## Simple Http Library

Simple 99% use-case client/server

    + sending/receiving simple payloads like html and json
    + file uploads
    + streaming

For when you don't want a stupid framework that gets in your way

Simple:

    + zero dependencies
    + symmetrical client/server and one simple http interface
    + immutable http message objects close to wire format
    + start/stop server in one line
    + test in-memory or over the wire in a few ms startup time

## Todo

- performance test
- multipart form data
    - handle output stream ie parse while going along
  - handle images (dont Text decode!)
  - max file size so you don't get DOS'd
- handle application/x-www-form-urlencoded
- security like header obfuscation etc. (node should handle this?)
- trailers
- does node handle inflate/deflate ?
  - if not then we can write some filters that do