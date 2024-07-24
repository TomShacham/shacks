import {contentsPage} from "./index";

export const ddiaPart8 = `<!doctype html>
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
    <h4 id="h.uwj7wwckhuew"><span>The Trouble with Distributed Systems - Chapter 8 </span></h4>
    <p><span></span></p>
    <p><span>If it’s feasible to keep things on one node then we can avoid a large class of problems that arise with distributed systems. However, if we want fault tolerance and we want our data to be close to our end users and we want to potentially reduce latency, it may be better to build a distributed system. </span>
    </p>
    <p><span></span></p>
    <p><span>On a single node, faults tend to either happen and we know about them, or they don’t happen and that’s that. In a distributed system, not only do we not necessarily know about faults; we may not know about success either. Furthermore, in a sufficiently large distributed system it is common for some part to be faulty at any one time i.e. if we assume some low percentage of requests either fail or timeout then for tens/hundreds of nodes failure is fairly likely. </span>
    </p>
    <p><span></span></p>
    <p><span>There are a few reasons why faults are somewhat unavoidable in a distributed system: </span></p>
    <ol start="1">
        <li><span>Packet loss or corruption due to the network; or indeed arbitrary delays due to congestion or a faulty switch etc. </span>
        </li>
        <li><span>Timing issues due to clock skew; clocks are hard to synchronise due to relying on networks which have the issues in (1) and because clocks themselves drift at a hardware level</span>
        </li>
        <li><span>Processes performing garbage collection or are resource sharing (e.g. on a VM) can be paused for long periods of time during which they are unresponsive and (as the process itself is unaware that it is paused) may come back online in the middle of performing a (now intolerably) outdated procedure</span>
        </li>
        <li><span>A server &nbsp;or indeed an entire data </span><span>center</span><span>&nbsp;can go down for a large number of reasons, from software bugs to power outages to fires</span>
        </li>
    </ol>
    <p><span></span></p>
    <p><span>We can make networks with a fixed bandwidth allocation - dividing it up into something like “channels” where each client can communicate on a long-lived dedicated slice of the network. This is how telephone calls work and therefore don’t drop out very often. However, phone calls are different because there is a limit to the amount of information that is being sent on each side of the network (i.e. how much data can you produce from chatting?). Networks for transmitting data between (e.g. web) servers send varied payloads so to make the most out of the bandwidth, it works on a best-effort basis and sometimes gets congested. This is the </span><span>utilisation-reliability trade-off</span><span>&nbsp;of networks. </span>
    </p>
    <p><span></span></p>
    <p><span>We can make a more reliable system from less reliable parts. “Error-correcting codes allow digital data to be transmitted accurately across a communication channel that occasionally gets some bits wrong, for example due to radio interference on a wireless network” and “IP…may drop, delay, duplicate, or reorder packets. TCP…provides a more reliable transport layer on top of IP: it ensures that missing packets are retransmitted, duplicates are eliminated, and packets are reassembled in the order in which they were sent”. But there is a limit to how reliable we can make it, for example TCP cannot reduce latency and if a channel is swamped with noise then we can’t reliably get much data through it.</span>
    </p>
    <p><span></span></p>
    <p><span>Consider a simple request/response over an asynchronous network: the request may get lost or wait in a outbound or inbound queue for a long time; the recipient may process the request and then crash; or it may process it successfully but fail to send a response for the same reasons that our request can fail. Thus we have no guarantee that a timed-out request or a lack of response implies our request was not processed. </span>
    </p>
    <p><span></span></p>
    <p><span>A network can fail for many reasons including</span></p>
    <ol start="1">
        <li><span>most commonly “human error” in misconfiguration</span></li>
        <li><span>firmware or software bugs</span></li>
        <li><span>a shark biting the undersea cable</span></li>
    </ol>
    <p><span></span></p>
    <p><span>When the network comes back online, it can cause unpredictable outcomes like our cluster becoming deadlocked or deleting all of our data (e.g. if a leader comes back without its previous data and then replicates to followers).</span>
    </p>
    <p><span></span></p>
    <p><span>Not only is our network unreliable, we can’t rely on our clock either. Our clock synchronises over the network via the NTP protocol, but one experiment showed that our clock can be expected to be out by at least 35 ms due to network delays (if syncing over the internet) and that it can be out by 1 second when there is congestion. In fact the reasons for clock drift are many: </span>
    </p>
    <ol start="1">
        <li><span>our node can be accidentally firewalled off and stop syncing</span></li>
        <li><span>NTP servers can be misconfigured </span></li>
        <li>
            <span>leap seconds occasionally come in which our application may be brittle to; instead NTP servers can </span><span>smear</span><span>&nbsp;the second over the course of a longer period to prevent this</span>
        </li>
        <li><span>VMs have </span><span>virtualised</span><span>&nbsp;clocks which appear to pause or jump forward when the VM is paused waiting for CPU time</span>
        </li>
        <li><span>if our software runs on a device we don’t control like a mobile phone then we cannot trust the time on it</span>
        </li>
    </ol>
    <p><span></span></p>
    <p><span>We can achieve very high clock accuracy using the Precision Time Protocol (PTP) using GPS but it requires significant expertise. High-frequency trading firms can get their clocks to within 100 microseconds of UTC. </span>
    </p>
    <p><span></span></p>
    <p><span>In the case of databases using </span><span>last-write-wins </span><span>and relying on clock time to choose the winner, then we are likely going to misjudge them. If node A and node B are writing to node C but the clock skew between A and B is say 30 ms, then essentially any writes that take place within 30 ms of each other will appear concurrent and either A or B will win depending whose clock is skewed backwards relative to the other. Further, if node A always lags node B then it will never win! </span>
    </p>
    <p><span></span></p>
    <p><span>This problem is also relevant to </span><span>serialisable-snapshot-isolation </span><span>(SSI) where we need to keep track of when writes take place and therefore whether they form part of the snapshot from which transactions can be said to read safely from. If our clock has skewed and we wrongly believe a write to be part of the snapshot, we may see unexpected consequences. Google solves this in its Spanner database by using confidence intervals on reported clock times, showing the accuracy with upper and lower bounds. If two writes’ intervals don’t overlap then we can reliably assume one happened after the other. </span>
    </p>
    <p><span></span></p>
    <p>
        <span>One thing we can be fairly confident with is our monotonic clock. So far we have been measuring </span><span>points-in-time</span><span>&nbsp;but if we are only interested in a </span><span>duration</span><span>&nbsp;then we can use our monotonic clock that is much more reliable. For example, if we want to know the time elapsed between the start and end of a function call then we can get that fairly accurately. Monotonic clocks do not rely on synchronisation and our CPU does a good job of counting elapsed time.</span>
    </p>
    <p><span></span></p>
    <p><span>So our network may be faulty, our clock may be out by a second or more, but surely our process will run continuously? Unfortunately process pauses are not uncommon and can happen for a number of reasons:</span>
    </p>
    <ol start="1">
        <li><span>our programming language may have </span><span>stop-the-world</span><span>&nbsp;GC pauses</span></li>
        <li><span>it may also have synchronous I/O and therefore block loading a large file</span></li>
        <li>
            <span>it may even do so implicitly e.g. java’s lazy class loader loading a large class when it needs it</span>
        </li>
        <li><span>running on a VM which may be paused, e.g. next to a noisy neighbour</span></li>
        <li><span>our program may have received a SIGSTOP (ctrl-z) command</span></li>
        <li><span>our process could be </span><span>thrashing </span><span>or just </span><span>swapping</span><span>&nbsp;out a particularly large bit of memory</span>
        </li>
        <li><span>our user may have closed their laptop half-way through some process</span></li>
    </ol>
    <p><span></span></p>
    <p><span>For cases when we need </span><span>real-time</span><span>&nbsp;(e.g. safety critical systems like air traffic control, releasing a car’s airbag, launching a rocket) then we need a RTOS (real-time operating system) that can guarantee scheduling some CPU time for a process when it needs it; dynamic memory allocation may be disallowed; and a lot of testing is needed. Real-time is very expensive and limiting in what tools we can use therefore it is reserved for when it is absolutely necessary. Until then, we must live with process pauses.</span>
    </p>
    <p><span></span></p>
    <p><span>We can try to limit the impact of GC, for example we could use GC only for small short-lived objects and simply restart the process from time to time to destroy long-lived objects, and view it as a kind of planned outage. Or we can track the amount of free memory in our process and preempt a GC pause, tell other nodes we are going offline for a few seconds and then come back online after the GC pause. </span>
    </p>
    <p><span></span></p>
</article>
    </div>
</div>
</body>
</html>
`