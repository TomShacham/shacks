import {contentsPage} from "./index";

export const ddiaPart5 = `<!doctype html>
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
    <h4><span>Replication - Chapter 5</span></h4>
    <p><span></span></p>
    <p><span>Scaling our data layer to multiple nodes is likely to be required eventually; and if not required there anyway are some nice properties of fault-tolerance and perhaps latency-reduction. Scaling up a single node keeps things simple but the cost of increasing RAM and CPU is exponential and due to other bottlenecks in the computer architecture, doubling resources doesn’t necessarily double throughput. </span>
    </p>
    <p><span></span></p>
    <p>
        <span>Instead of using this </span><span>shared-memory</span><span>&nbsp;architecture, we could use just a </span><span>shared-disk</span><span>&nbsp;architecture but similarly problems arise in contention and the overhead of locking. Thus we are led to a </span><span>shared-nothing</span><span>&nbsp;architecture where all layers are divided. The challenge then is either replicating our data across nodes or partitioning our data and adding complexity to the way it is queried (which node owns what). </span>
    </p>
    <p><span></span></p>
    <p><span>With replication we can:</span></p>
    <ol start="1">
        <li><span>Keep data relevant to a location close to that location (i.e. having replicas of our database in multiple locations) thus reducing latency</span>
        </li>
        <li><span>Have some redundancy in the case of failure</span></li>
        <li><span>Scale out reads and writes</span></li>
    </ol>
    <p><span></span></p>
    <p>
        <span>There are </span><span>single-leader</span><span>, </span><span>multi-leader</span><span>&nbsp;and </span><span>leaderless</span><span>&nbsp;models of replication; and replication happens either synchronously or asynchronously. If writes are synchronous then we risk them being very slow in case a particular node is unresponsive, however there are obvious benefits to read consistency. Fully asynchronous replication then increases our write throughput but at the cost of having </span><span>dirty reads</span><span>. There are some nice tricks for dealing with the challenges of these approaches, the latter has been popularised as </span><span>eventual consistency</span><span>&nbsp;but there is much nuance in the meaning of both </span><span>eventual </span><span>and </span><span>consistency</span><span>&nbsp;which we now deconstruct. </span>
    </p>
    <p><span></span></p>
    <p><span>In a </span><span>single-leader</span><span>&nbsp;approach, one node is designated leader and receives all writes. It forwards these to its </span><span>read replicas</span><span>&nbsp;so that they are up to date. If replication is synchronous we haven’t achieved much of our aims of high availability because we may often find ourselves waiting a while to acknowledge a write is successful. Thus asynchronous replication is more commonplace. There is a middle ground known as semi-synchronous where one follower is kept synchronously up-to-date while the rest are async. </span>
    </p>
    <p><span></span></p>
    <p><span>If our leader goes down and writes are no longer served, a new leader needs to be elected. A whole bunch of issues surround this:</span>
    </p>
    <ol start="1">
        <li><span>How do we know a leader has truly failed and not just unresponsive for a bit? We need to choose a sensible timeout</span>
        </li>
        <li><span>We need a consensus algorithm to select the new leader (usually based on which node is lagging the least; the difference between the leader and the follower is called </span><span>replication lag</span><span>)</span>
        </li>
        <li><span>The new leader will have dropped all the writes that it is lagging </span></li>
        <li><span>The old leader may come back up and needs to accept demotion. It will still have whatever writes were lagging in the new leader so some conflict resolution may be required (or the writes will typically just be dropped because it’s too complicated)</span>
        </li>
    </ol>
    <ol start="1">
        <li><span>Discarding writes can be dangerous: an incident at Github had a follower take up leadership but was lagging on its auto-incrementing primary key and so allowed some users to see the private data of other users because the key was also referenced by a Redis database more up-to-date than the follower that got elected leader. </span>
        </li>
    </ol>
    <ol start="5">
        <li>
            <span>Sometimes two nodes want to become leader at the same time (known as </span><span>split-brain</span><span>) and again some resolution is required</span>
        </li>
    </ol>
    <p><span></span></p>
    <p><span>Replication itself can be achieved in a few ways:</span></p>
    <ol start="1">
        <li><span>Statement-based - sharing SQL statements of writes but this has the downside that executing side-effects (like triggers) or non-deterministic functions like RAND() are exactly that - non-deterministic, leading to divergence; and if statements depend on previous ones then we need to worry about execution order</span>
        </li>
        <li><span>WAL-sharing - just send the WAL to each replica. The main downside is that this log is detailed and leaks the storage engine implementation so it’s likely not possible to perform a rolling upgrade on the cluster</span>
        </li>
        <li><span>Row-based - a “logical log” is produced that describes the changes at a higher level so that it is not tied to the storage engine. This is also nice because other applications can tail this log and do things like build custom indexes or caches from it - a technique called “change data capture”</span>
        </li>
        <li><span>Trigger-based - replication is done at a higher level than the db, i.e. in the application layer, in order to do more fine-grained replication like only replicating a subset of the data, or replicating certain data to certain databases. But here be dragons</span>
        </li>
    </ol>
    <p><span></span></p>
    <p><span>The problem of replication lag in a single-leader architecture with async replication can be mitigated in a few ways:</span>
    </p>
    <ol start="1">
        <li><span>Read-your-writes</span><span>&nbsp;describes reading any data that a user has just written, e.g. in the case of uploading a new profile pic, the user should not see their old pic if they refresh. This can be achieved through </span>
        </li>
    </ol>
    <ol start="1">
        <li><span>application logic choosing to read from the leader if the data is personal to the user</span></li>
        <li><span>reading from the leader for say 1 minute after the last write operation by the user</span></li>
        <li><span>basing which node to read from on a timestamp of the last update and checking the replication lag of nodes</span>
        </li>
    </ol>
    <ol start="2">
        <li><span>“Monotonic reads</span><span>” is a guarantee that a user will not see time go backwards due to reading different read replicas which may have different amounts of lag. This is essentially session affinity for a read replica and can be achieved by using a hash of the user-id to choose which read replica to read from. </span>
        </li>
    </ol>
    <ol start="1">
        <li><span>I’m guessing there can be edge cases with this if new replicas join the pool unless there is really session affinity and the client doesn’t choose its read replica on every request</span>
        </li>
    </ol>
    <ol start="3">
        <li><span>“</span><span>Consistent prefix reads”</span><span>&nbsp;- a guarantee that if a sequence of writes happen in a certain order then anyone reading those writes also sees them in the same order. They may appear out of order due to differing replication lags on different read replicas. This isn’t always easy or possible to achieve.</span>
        </li>
    </ol>
    <p><span></span></p>
    <p><span>There is unfortunately no silver-bullet when it comes to replication lag and providing a consistent view of distributed data. Transactions solve this on a single-node but in a distributed system we need to think harder. More on this in later chapters.</span>
    </p>
    <p><span></span></p>
    <p><span>A multi-leader setup is useful in a multiple data centre setup - without multiple leaders the purpose of multiple data centres is somewhat diminished (i.e. network is still a single point of failure and replication lag is somewhat amplified by network latency). We can also think of offline apps (like calendars) and collaborative apps (like shared docs) as kinds of multi-leader setup - there are multiple sources of truth (devices) and we need to think hard about write-conflict-resolution (changing the same document) and “replication” may lag for minutes, hours or days (e.g. write a blog post while offline). </span>
    </p>
    <p><span></span></p>
    <p><span>Resolving write conflicts across multiple leaders can be done in a number of ways. </span></p>
    <ol start="1">
        <li><span>We come up with an ordering on leaders to decide who wins in the case of a conflict e.g. node 1 is ordered above node 0; or each record has an ordering like a timestamp (this is know as </span><span>Last-Write-Wins </span><span>or</span><span>&nbsp;LWW</span><span>)</span>
        </li>
        <li><span>We preserve both values and merge them e.g. [value1, value2] and we delegate responsibility of resolution to the application, who in turn may ask the user to choose between values.</span>
        </li>
    </ol>
    <p><span></span></p>
    <p><span>Automatic resolution has made some ground recently in using dedicated data structures for this express purpose: CRDTs (conflict-free replicated </span><span>datatypes</span><span>); </span><span>Mergeable persistent data structures</span><span>&nbsp;track history similar to Git and performs 3-way merges; and </span><span>Operational transformation</span><span>&nbsp;designed for concurrent editing of ordered lists e.g. of characters in a google doc.</span>
    </p>
    <p><span></span></p>
    <p><span>Leaderless replication has still fewer guarantees. Consistency is essentially enforced by sending writes and reads to multiple nodes each time; we can configure this number to be higher or lower depending on how (eventually) consistent we care for our data to be versus the low-latency benefit gained from not worrying about consistency; there is also a durability and availability trade-off. Picture this: our client is reading/writing a leaderless database. We typically configure our db such that </span><span>r </span><span>+ </span><span>w</span><span>&nbsp;&gt;= </span><span>n </span><span>&nbsp;where </span><span>r </span><span>is the number of successful reads, </span><span>w </span><span>writes, and </span><span>n </span><span>is the total number of nodes. Here n=7, so we’d choose r,w=4 so that 4 + 4 &gt; 7.</span>
    </p>
    <p><span>This way, any write is deemed successful if 4 nodes accept and respond to the write; and likewise for reads - which makes it highly likely we can read-our-writes as there is always one overlapping node that received both the write and read request. </span>
    </p>
    <p><span></span></p>
    <p><span
            style="overflow: hidden; display: inline-block; margin: 0.00px 0.00px; border: 0.00px solid #000000; transform: rotate(0.00rad) translateZ(0px); -webkit-transform: rotate(0.00rad) translateZ(0px); width: 558.00px; height: 345.84px;"><img
            alt="" src="images/image6.png"
            style="width: 602.00px; height: 382.84px; margin-left: -21.00px; margin-top: -10.84px; transform: rotate(0.00rad) translateZ(0px); -webkit-transform: rotate(0.00rad) translateZ(0px);"
            title=""></span></p>
    <p><span></span></p>
    <p><span>In a leaderless db read/write requests are typically sent to all nodes, although we can designate some number of nodes as “home” nodes and the rest are only there for redundancy i.e. aren’t part of the quorum of 4 + 4 &gt; 7 described above. The question then is what to do when some number of our </span><span>n </span><span>nodes are unavailable: do we allow read/writes to continue on nodes not part of the quorum and sync up later when </span><span>n </span><span>are back online? If so this is known as </span><span>sloppy quorum</span><span>&nbsp;and the later sync is known as </span><span>hinted handoff</span><span>. This increases write availability but means that there are no read guarantees even if </span><span>r + w </span><span>&gt; </span><span>n</span><span>&nbsp;because we are accepting some non-home nodes into </span><span>n </span><span>in case of unavailability. </span>
    </p>
    <p><span></span></p>
    <p><span>On read, the latest value that is read wins. Some nodes may have stale data for the read but so long as the previous write (that we care about reading) has gone to one of the nodes we just read from, we’re good to go. There are a number of challenges with this still: </span>
    </p>
    <ol start="1">
        <li><span>If a node or two are down, we may get some stale reads, so we need to be okay for that to be the case in our application</span>
        </li>
        <li><span>If two keys are written concurrently, we need to choose which one wins; if we use LWW then we may choose the wrong write due to clock skew</span>
        </li>
        <li><span>If a write happens concurrently with a read, it’s not clear if the read will see the write</span></li>
        <li><span>If a write succeeds on some replicas but not others, and fewer than the configured number of nodes to be considered a “successful” write, those nodes where the write succeeded do not roll back! So subsequent reads may return this “failed” write</span>
        </li>
        <li><span>If a write is written to a node and is considered “successful” but then our node goes down before it replicates to other nodes, we will lose the write.</span>
        </li>
        <li><span>We need to update all the nodes whose values are stale; we can do this a) on read when we see values differ or b) in the background by performing some kind of “anti-entropy process” that reconciles differences</span>
        </li>
    </ol>
    <ol start="1">
        <li><span>the problem with a) is that unless data is read frequently, it will go stale i.e. because it hasn’t been read for a while</span>
        </li>
        <li><span>the difficulty with b) is that writes are not copied in “any particular order, and there may be a significant delay before data is copied”</span>
        </li>
    </ol>
    <ol start="7">
        <li><span>In order to handle concurrent writes, the server needs to version data that it receives and writes; and clients need to send this version number on subsequent writes so we can merge values correctly. And we still need a reliable way of merging values and deleting values (because absence does not imply deletion when merging, we need a “tombstone” like in log compaction of hash-indexes)</span>
        </li>
    </ol>
    <p><span></span></p>
    <p><span></span></p>
</article>
    </div>
</div>
</body>
</html>
`