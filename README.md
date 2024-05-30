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
      h22p is light on configuration options, instead you can implement HttpHandler to get 
      whatever behaviour you want around request/response
    + http client responses 4xx or 5xx are not exceptions
      unlike a lot of clients out there, we do not throw an exception so you do not need to try/catch requests
    + there is no routing precedence, we do not want any complexity, it's first come, first served

## Todo

- address inline TODOs
- http client using fetch (browser) so we can test e2e from browser
    - closing stream (and implement on node http client too)
      - https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultController/close
    - https://github.com/mdn/dom-examples/tree/main/streams
  - https://medium.com/deno-the-complete-reference/sending-form-data-using-fetch-in-node-js-8cedd0b2af85
    - can we really do multipart forms as the tests seem to suggest?
    - support all the other parameters like cache, credentials, referrerPolicy, and mode
    - why is handler a function in the browser but an object on the server 🤔
    - client-side with server-in-memory
    - as well as server-side using fetch as a client from the browser
      - generate a client-kinda-thing from the routes
  - generate a client from open api spec? :D
  - https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
- support Lambda and Cloudflare Workers as HttpHandlers
- deploy to cloudflare cos heroku $$$
- example app (idea is to iterate the library through using it to actually build stuff)
  - so-called "filters" like 404 catch all and tracing and 5xx translation
  - static file handler
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
- open api spec doesn't support optional parameters
  - responses are optional, you don't have to add metadata to your routing if you don't want to!
  - doesn't support components (i.e. no way to reference some shared object; just use a shared example object from
    tests)
  - no way to say a parameter is optional (in the routing api, if a query param is present then it's required)

## Open questions

    - is there a better way to do the type-safe expanded path in the router that doesn't require it having a slash at the end
      - if typescript gets some advanced types letting you say that a string must consist of certain chars and not others
      but until then the type-error is really obtuse if we want to ensure that a type-safe path cannot contain further segments
      e.g. /user/{userId} expands to type /user/${string} but that allows /user/123/blah/blah/blah because ${string} is too permissive
      but then restraining the type to /user/${nonForwardSlashes} gives quite horrible errors 
      and forces the user to have a / at the end of any uri so we can do the above type foo (i.e. /user/123/ <- extra slash)