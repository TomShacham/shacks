import {contentsPage} from "./index";

export const ddiaPart9 = `<!doctype html>
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
    <h4 id="h.au2wf5gppb1x"><span>Consistency and Consensus - Chapter 9 </span></h4>
    <p><span></span></p>
    <p><span>In a single leader setup, consistency is (somewhat) easily achieved as there is a consensus of 1. However we are less fault tolerant because if our single leader goes down we cannot accept any writes until we elect a new leader. This may be done manually by an admin or we would need some kind of consensus algorithm to elect a new leader amongst the followers. </span>
    </p>
    <p><span></span></p>
    <p><span>Consensus algorithms exist to decide something in the face of uncertainty. Typically this uncertainty is a network issue resulting in an unreachable node. In order to decide something we need a majority of nodes to agree, which allows for a minority of nodes to be unresponsive. This provides fault-tolerance but of course we can run into a sticky situation if a majority is unreachable. </span>
    </p>
    <p><span></span></p>
    <p><span>We can decide things like “who’s the leader of this group of nodes?” (leader-election) or “what is the address of this service?” (service-discovery / membership coordination) or “shall we commit this transaction?” (atomic transaction commit) or “can I acquire this lock?” or “does this violate a uniqueness constraint?”. </span>
    </p>
    <p><span></span></p>
    <p><span>We may be able to tolerate a lack of consensus, in the same way that we may be happy enough with eventual consistency. For example, DNS provides service discovery but it relies on caching and we tend to live with the fact that a domain-&gt;IP resolution may be stale because it doesn’t change very often. But if we want to be able to make some consistency guarantees, then we will need some form of consensus.</span>
    </p>
    <p><span></span></p>
    <p>
        <span>One way we might think to achieve consistency is </span><span>2 Phase Commit </span><span>(2PC),</span><span>&nbsp;</span><span>which ensures that all nodes participating agree to commit a value in two stages: first all nodes agree that they can commit the transaction (i.e. there is enough disk space, no constraint is violated etc.) and second the coordinator declares that the transaction should be committed (i.e. hasn’t changed its mind, or received any “no”s to the first question). In this way it would seem that we can get all nodes to agree and commit a transaction; however, there is the edge case where our coordinator goes down halfway through declaring “commit!”. If this happens then we end up in an inconsistent state where some nodes commit and some nodes do not. </span>
    </p>
    <p><span></span></p>
    <p><span>If we think about this in terms of single-node commits, our database will write some data to disk and then write the metadata to its WAL in one atomic commit (assuming it doesn’t blow-up halfway through this!). In 2PC, we are adding a network delay in the middle during which time our coordinator can fail and effectively corrupt our log. To workaround this issue, consensus algorithms only require a majority of nodes to agree - so if a minority of nodes end up not committing some transaction we can live with that. </span>
    </p>
    <p><span></span></p>
    <p><span>Distributed transactions are described by XA (eXtended Architecture) a protocol for handling a transaction across multiple data stores through a single client. However, it implements 2PC and so suffers the same problems as above. In fact it can be stickier still, XA relies on a local disk that holds the state of the coordinator, so if our node goes down and we cannot restore the state of the disk then any mid-flight distributed transactions will block waiting for the coordinator to return. If it doesn’t return, then any locks held by those transactions could be held for a long time (depending on timeouts) and cause high contention in the data stores involved. There are a number of other issues with XA: if the coordinator is not replicated then it is a single point of failure; we need stateful applications (to persist the local disk); it becomes the lowest common denominator e.g. it cannot detect deadlocks across all systems. </span>
    </p></body>
</article>
    </div>
</div>
</body>
</html>
`