import {contentsPage} from "./index";

export const ddiaPart6 = `<!doctype html>
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
    <h4><span>Partitioning - chapter 6</span></h4>
    <p><span></span></p>
    <p><span>Once our data reaches a certain size, we probably want to divide it up between nodes so that we can continue to scale our </span><span>shared-nothing</span><span>&nbsp;architecture. The problem lies in how we divide it up, so that we don’t end up having to turn one request for some data into multiple requests across different nodes that own parts of the data that we want to read or write. Nodes may lead on one partition and follow on others so we have redundancy and scalability (more nodes can handle queries). We use replication to keep partitions in sync. </span>
    </p>
    <p><span></span></p>
    <p><span>With a simple key-value store/lookup, we can take a hash of the key (assuming the hash algorithm is random) so that we spread data evenly across shards. This avoids the problem of </span><span>hotspots</span><span>&nbsp;where one node happens to receive all the reads/writes because there is some ordering to the data being read/written that keeps selecting it e.g. we lookup by datetime and we shard by datetime (known as </span><span>key range partitioning</span><span>). But with secondary indexes, we need to think harder.</span>
    </p>
    <p><span></span></p>
    <p><span>If our data is partitioned by some key and we are querying another, there is no guarantee that our data is on one partition - it is highly likely to be spread across many/all of them. For example, if we partition a database of car listings by document ID and we want to “select cars where colour = red”, we are almost certainly going to query all partitions. This is known as </span><span>scatter/gather</span><span>&nbsp;and is prone to </span><span>tail-latency-amplification</span><span>&nbsp;i.e. one partition being slow makes the whole query slow. Yet it is widely used (!) - MongoDb, Riak, Cassandra, Elasticsearch, SolrCloud and VoltDb use this approach. </span>
    </p>
    <p><span></span></p>
    <p><span>To solve this we could use a global index that tells us where records are stored that have our secondary column we are interested in. However this would defeat the point of sharding as this index would become a singular hotspot itself. Instead we can </span><span>shard</span><span>&nbsp;our secondary index - for example all car colours starting “</span><span>a” through</span><span>&nbsp;“k” on partition 0 and colours </span><span>“l</span><span>” through “z” on partition 1. Now a search like “select from cars where colour = red“ only needs to query one index (the data it points to is still spread across partitions, but that partition may be on the same node). This is called a </span><span>term-partitioned</span><span>&nbsp;index. </span>
    </p>
    <p><span></span></p>
    <p><span>The downside is that writes are now slower as we need to update indexes across multiple shards. As ever, there is a trade-off between read and write performance. Reads now do not need to </span><span>scatter/gather</span><span>&nbsp;but writers now need to write to multiple locations. In practice this is done asynchronously because otherwise we would require distributed transactions to ensure these </span><span>writes</span><span>&nbsp;happen together. Term partitions will come up again in chapter 12 (if I make it there :) </span>
    </p>
    <p><span></span></p>
    <p><span>Rebalancing itself can be done in a few ways and can either be manual or automatic. Because rebalancing is an expensive operation, it can be useful to do it manually so as not to enter some kind of death spiral where rebalancing causes a node to become unresponsive which puts more load on the rest, causing another node to become unresponsive and so on. Automatic is obviously nice for all the reasons automation is nice. </span>
    </p>
    <p><span></span></p>
    <p><span>One approach is to decide the number of partitions upfront - say 1000 partitions - and hope that you’ll never need more; each node handles a fixed number of partitions and when a new node is added to the cluster it takes over some random set of partitions. You can even account for nodes of varied resources by assigning fewer partitions to less powerful nodes. This is the approach of Riak, Elasticsearch, Couchbase and Voldemort. </span>
    </p>
    <p><span></span></p>
    <p><span>Another approach is dynamic partitioning. Instead of deciding our number upfront, we can make partitions as we go along (say every 10GB of data) which has the advantage of adapting to data volume (useful if we cannot predict how much data we will have). It’s also handy for key range partitioning because it can help us avoid hotspots - as we are partition-splitting relatively often, it avoids one partition getting all the fun. </span>
    </p>
    <p><span></span></p>
    <p><span>The final approach is node-based. We partition according to the number of nodes in our cluster. This is a natural fit as we tend to scale the cluster with workload anyway. Each new node that joins the cluster takes some random set of partitions from the existing nodes. To prevent the random process producing unfair splits, each node has a large number of small-ish partitions - 256 by default in Cassandra. This reduces the likelihood of grabbing a couple of hotspot partitions and getting a rough deal. </span>
    </p>
    <p><span></span></p>
    <p><span>In all cases, we have a problem of </span><span>service discovery</span><span>&nbsp;- how do we route requests to the correct partition? We can either:</span>
    </p>
    <ol start="1">
        <li><span>have some known scheme such that clients can figure it out themselves</span></li>
        <li><span>have some service that keeps track of which nodes own which partitions (e.g. Zookeeper) </span></li>
        <li><span>have nodes forward requests to the next node to see if they can answer or know which node owns which partition </span>
        </li>
    </ol>
    <p><span></span></p>
    <p><span>To know which node owns what, we need a consensus algorithm (more in chapter 9) which is hard to achieve. HBase, SolrCloud and Kafka use Zookeeper; while Cassandra and Riak use a </span><span>gossip protocol</span><span>&nbsp;informing each node of who owns what partition. It’s nice not to rely on an external service like ZooKeeper; but as mentioned consensus is hard. </span>
    </p>
    <p><span></span></p>
</article>
    </div>
</div>
</body>
</html>
`