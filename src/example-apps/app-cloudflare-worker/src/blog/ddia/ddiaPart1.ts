import {contentsPage} from "./index";

export const ddiaPart1 = `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Tom Shacks - Designing Data-Intensive Applications - Part 1 - Reliable, Scalable and Maintainable Systems</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<div class="flex-col align-center">
    <div class="m-2"></div>
    <div class="flex-col m-8 py-4 w-full sm:w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/3">
        ${contentsPage}
        <article>
    <p><span></span></p><h4 id="h.wggjyv14sbq6"><span>Reliable, Scalable and Maintainable Systems - Chapter 1</span>
</h4>
    <p><span></span></p>
    <p><span>Data storage and processing tends to dominate the complexity of any significantly large system; large in the sense of usage, data, or legacy. Systems typically solve many data problems: storage, caching, search, asynchronous jobs and offline batch processing. If we think about the applications we build, they are essentially glueing together different data systems to form a new data system with some new set of guarantees (or not!). </span>
    </p>
    <p><span></span></p>
    <p><span>The technologies we choose should be informed by the app’s data access patterns i.e. if we have a read-heavy application, we are likely to optimise for caching over querying storage (say, StackOverflow) or perhaps some clever combo of the two (like Twitter, who builds a kind of cache of tweets per user, except for celeb accounts: querying storage on the fly is better due to the large amount of work required to build every one of their followers cache every time they tweet). </span>
    </p>
    <p><span></span></p>
    <p><span>Other factors influencing the design of a data system include “the skills and experience of the people involved, legacy system dependencies, the time-scale for delivery, your org’s tolerance of different kinds of risk, regulatory constraints, etc. Those factors depend very much on the situation”. I really like this quote because I have seen leaders/teams choose a technology because it seems best in terms of its performance or feature-set but haven’t considered whether anyone knows how to use it or operate it effectively, or learn how to in a reasonable time frame versus the business needs. </span>
    </p>
    <p><span></span></p>
    <p>
        Our goals are Reliability, Scalability and Maintainability, which we will discuss now. 
        Martin defines reliability as the ability of a system to work correctly in the face of adversity 
        (e.g. faults); scalability as how easy it is to evolve the system as its usage grows; maintainability
         as the ease of change of a system over time. 
         </p>
         <p>
         I find the definition of scalability very interesting, 
         because we often see scalability as how easily a system can handle "a lot more" load, as
         opposed to how easily we can <i>change a system</i> in order to handle more load. Typically, this leads to 
         the mistake of choosing a design that "you ain't gonna need" for a long time, 
         instead of choosing a simpler one that will work now and <i>will still be easy to evolve when necessary</i>!
</p>
    <p><span></span></p>
    <p><span>Reliability</span>: tolerance of hardware faults e.g. server rack is unplugged or on fire; 
     our ability to scale out horizontally to be highly available in the face of most hardware faults. 
     We want to be resilient to software errors like a slow 3rd party dependency, memory/CPU leaks, network faults:
     essentially making an assumption about our environment is going to lead to an unexpected error eventually. 
     We want to be resilient to human errors by making it hard to do the dangerous things, testing thoroughly at all levels, 
     making it easy to recover (e.g. fast rollback), having great telemetry and finally good management and
     practices. 
    </p>
    <p>It's interesting that good management and practices is called out. In my experience these can be the 
    hardest parts to get right. Changing mindsets and culture and "the way it's always been done" is such
    hard work, but necessary to get us all pulling in the same direction. If our software is reliant on another
    team's software whose philosophy and practices lead to unreliable systems, we can adapt our system on a 
    technical level to cope with this, but ultimately we should want to improve the thinking behind what has 
    led us to this problem in the first place (i.e. the way this other team approaches reliability). 
    </p>
    <p><span></span></p>
    <p><span>Scalability</span>: the ability to cope with increased load, “scalability means considering
     questions like ‘if the system grows in a particular way, what are our options for coping with the growth?’ 
     and ‘how can we add computing resources to handle the additional load?’”. I love this because I’ve seen
      teams worry about rearchitecting a system way before considering the simple option: scaling the resources. 
    </p>
    <p><span>Choose a load parameter that makes sense for your system to be concerned about e.g. db writes per second or
       cache hit rate or user sessions. Measure the current load and then we can ask questions like “what happens 
       if our load doubles?”. Other motivating questions could be “how is performance affected if load increases 
       but resources are kept the same?” and “when we increase load how much do we need to increase resources to 
       keep performance the same?”.</span></p>
    <p><span></span></p>
    <p><span>To understand load, it's sensible to start with response times.  
    Latency is the time it takes to service one request while response time is what the client sees i.e. has the page 
    loaded (which likely entails many requests). We need to look at response time percentiles to understand the range of 
    client’s experience. A few slow requests may block our ability to serve other requests (head-of-line blocking) or 
    if a client needs to make multiple requests then the chance of getting a slow response increases dramatically (tail 
    latency amplification). Trivially, it takes just one slow response to make the end-user’s request take that long. 
    </span>
    </p>
    <p><span>
    This is excellent: “an architecture that scales well for a particular application is built around assumptions of which 
    operations will be common and which will be rare i.e. the load parameters. If those assumptions turn out to be wrong, 
    the engineering effort for scaling is at best wasted, and at worst counterproductive. In an early-stage startup or
     an unproven product it’s usually more important to be able to iterate quickly on product features than it is to 
     scale to some hypothetical future load”. </span>
    </p>
    <p><span>Spot on. While there is some common sense that can be applied to decision-making
      when we don't know exactly what we are building, the use case in early stages just isn't clear yet. Therefore the 
       priority should be finding our use-case through delivering features. At a sustainable speed of course, but often
       I've seen infrastructure and build tools and DX prioritised over delivering features when a monolith would obviate the 
       need to focus on any of these things and get you to product-market-fit quicker. At which point, you'll learn that 
       actually your load parameters that you need to optimise for are (probably) completely different to what you expected
       they would be a year ago when you lacked the 10 features you built between then and now.</span></p>
    <p><span>
    Maintainability: the majority of the cost of software development is the ongoing cost of maintenance not the initial
     cost of development: fixing bugs, keeping it operational, investigating failures, adapting to new platforms, 
     adding features, paying off tech debt. </span>
    </p>
    <p><span>
    Systems are more maintainable if they are operationally simple; and simpler designs are easier for engineers 
    to understand and evolve. This is the word I have been looking for ages - evolvability: essentially agile at the data system 
    level - how to iterate on your architecture without massive upfront design.
    </span>
    </p>
    <p><span>
    In my mind, evolvability is about keeping things simple and modular. People often argue the case for microservices as 
    a way to enforce system boundaries that *should* be there. However, it's far easier to enforce a system boundary through
    a function call than it is via a network or queue or database. So we can have simplicity and modularity - e.g. a monolith
    with reasonably well thought through abstractions.
</span>
    </p>
</article></div>
</div>
</body>
</html>
`