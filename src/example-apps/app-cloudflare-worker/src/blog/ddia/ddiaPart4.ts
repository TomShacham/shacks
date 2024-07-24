import {contentsPage} from "./index";

export const ddiaPart4 = `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Tom Shacks - Designing Data-Intensive Applications - Part 2 - Data Models and Query Languages</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
<div class="flex-col align-center">
    <div class="m-2"></div>
    <div class="flex-col m-8 py-4 w-full sm:w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/3">
        ${contentsPage}
        <article>
    <h4><span>Encoding and Evolution - Chapter 4</span></h4>
    <p><span></span></p>
    <p><span>This chapter talks a bit about schema sharing and evolution between services; whether internally facing or public, we need to share information and be able to evolve it over time as our applications grow to solve different problems or find more “applications” so to speak ;).</span>
    </p>
    <p><span></span></p>
    <p><span>Fundamentally data is expected in different formats depending on the context.</span></p>
    <ol start="1">
        <li><span>Data is encoded differently in-memory by different programming environments</span></li>
        <li><span>In-memory data uses pointers for efficiency, but obviously these are meaningless to another process that cannot follow those pointers; so we need to create a concrete representation of the data for transmission</span>
        </li>
    </ol>
    <p><span>So we need to agree on a specific schema between processes or services or within the same service but different versions/releases of it. </span>
    </p>
    <p><span></span></p>
    <p><span>There are a few different approaches to schemas and a few different ways we share data. With schemas we can either </span>
    </p>
    <ol start="1">
        <li><span>Be schemaless and leave it to consumers to be defensive (not great)</span></li>
        <li><span>We can document our API but this can diverge from reality so provides no guarantees</span></li>
        <li><span>We can use a published schema that is used by the producer and the consumer (if they want) which makes some guarantees</span>
        </li>
        <li><span>We can have a producer schema and a consumer schema and a kind of arbiter that figures out how to make one work with the other; with provisions of defaults or compile-time safety that throws an error if schema compatibility is violated</span>
        </li>
    </ol>
    <p><span></span></p>
    <p><span>With data sharing the main ways are:</span></p>
    <ol start="1">
        <li><span>We share data with ourselves: we have written data to the db and want to read it out later; we need to worry about this when we change our own schema because rolling deployments mean v1 and v2 of our service need to be compatible with the new schema (v1’s compatibility with the v2’s schema is called </span><span>forward compatibility</span><span>&nbsp;and v2’s compatibility with v1’s schema is called </span><span>backwards compatibility</span><span>) </span>
        </li>
        <li><span>We share data internally between services that can share a schema that is probably application agnostic like Protocol buffers or Avro</span>
        </li>
        <li><span>We share data externally over REST or SOAP - restful apis have gained popularity over soap for their simplicity and because of openapi making schema sharing somewhat simple. Soap is pretty complex with varying implementations of it</span>
        </li>
        <li><span>RPC attempts to hide the </span><span>remote</span><span>&nbsp;aspect of procedure calls, trying to make the network layer transparent but it isn’t very effectively encapsulated because a network layer makes such a big different that pc is very different from rpc so to speak</span>
        </li>
        <li><span>Distributed actor frameworks are a somewhat better encapsulation of RPC where it is assumed the network layer will fail relatively often, so built-in mechanisms for recovery and scale</span>
        </li>
        <li><span>Message brokers like RabbitMQ or Kafka where actions are asynchronous, provide fault-tolerance through buffering (i.e. load smoothing) and distribution (i.e. round robin, broadcast etc.) We can make a topic publish a response to another topic in turn to recreate a request/response style communication like in REST</span>
        </li>
    </ol>
    <p><span></span></p>
    <p>
        <span>I do find this stuff quite boring (I know it’s important but I just do) so I have left out some </span><span>detail</span><span>&nbsp;about how, say, protocol buffers work (which is very well explained by the book). </span>
    </p>
    <p><span></span></p>
    <p><span>My take is that json apis are easy to work with (easy to debug and evolve) and the problem of schema-sharing and compression of large payloads (which </span><span>protobuf</span><span>&nbsp;and avro solve) are problems for day 2 when you are at massive scale. Yes backwards and forwards compatibility are really important but in any context they require well-thought out changes from engineers close to the data and how it’s used; this for me is the main issue we should be thinking about in data sharing and while tech like avro does some neat things to help with it, it also makes dev ex worse and adds complexity which is more for engineers to get their head round. </span>
    </p>
    <p><span></span></p>
    <p><span>Moving on! </span></p>
    <p><span></span></p>
    <p><span></span></p>
</article>
    </div>
</div>
</body>
</html>
`