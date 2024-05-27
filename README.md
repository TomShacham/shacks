## Simple Http Library

Simple 99% use-case client/server:

    + type-safe routing
    + streaming
    + multipart/form-data
    + fast

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


## Todo

- open api spec generation
  - support full openapi spec (really cba right now ;) https://swagger.io/docs/specification/paths-and-operations/
  - request body spec
  - test what happens if no example responses are provided (could that be a good enough api spec? and therefore keep the
    routing api simple)
  - how to support optional query parameters?
  - how to support wildcards?
  - and need to support array referencing a component
- http client using fetch (browser) so we can test e2e in memory
  - generate a client from open api spec? :D
  - https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
  - https://medium.com/deno-the-complete-reference/sending-form-data-using-fetch-in-node-js-8cedd0b2af85
- figure out what things to not export and hide
  - break up h22p into things like Req and Res and Multipart etc. ?
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
  - look at why we are getting ECONNRESET
  - how to do rate limiting or backpressure on node accepting connections
- security e.g. header obfuscation etc. (node should handle this?)
- Server sent events
- content-range
- trailers
- does node handle inflate/deflate ?
  - if not then we can write some filters that do

## Documentation gotcha reminders

- Try/catch your multipart form `field` if you have reason to believe the input could be malformed
  - ie if the input has no name then chrome sends just a final boundary and parsing will blow up
- application/x-www-urlencoded forms // note chrome only sends this if either a) you specify accept-charset on your form
  or b) you send a response header of content-type "text/html; charset=utf-8"
- you can only read a body once because it's a stream, so you need to hand it around if you want to re-use it
- uri in a type-safe router must end with a "/" so that we can ensure the type of the uri (see open questions)
- open api spec doesn't support

## Open questions

    - do we like the h22p static for exposing the api
      - i dont like global leakage and it aids in discoverability, but a bit more verbose (h22p. = 5 more chars)
      - does it mean that the whole of the library gets imported for any use-case and therefore cannot be tree-shaken?
      - what if we split up the library into separate libraries like h22p-router h22p-core etc.? does that mean then we cannot
      use the static pattern? or is there some way to extend the class in a type-safe way? don't think so
    - can we generate open api spec from just types :S might need some other api around routing
    - is there a better way to do the type-safe expanded path in the router that doesn't require it having a slash at the end
      - if typescript gets some advanced types letting you say that a string must consist of certain chars and not others
      but until then the type-error is really obtuse if we want to ensure that a type-safe path cannot contain further segments
      e.g. /user/{userId} expands to type /user/${string} but that allows /user/123/blah/blah/blah because ${string} is too permissive
      but then restraining the type to /user/${nonForwardSlashes} gives quite horrible errors 
      and forces the user to have a / at the end of any uri so we can do the above type foo (i.e. /user/123/ <- extra slash)