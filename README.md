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
- security like header obfuscation etc. (node should handle this?)
- trailers
