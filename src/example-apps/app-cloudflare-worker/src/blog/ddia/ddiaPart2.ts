import {contentsPage} from "./index";

export const ddiaPart2 = `<!doctype html>
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
    <h4>
        <span>Data Models and Query Languages - Chapter 2</span></h4>
    <p><span></span></p>
    <p><span>“Data models are perhaps the most important part of developing software, because they have such a profound effect: not only on how the software is written, but also on how we </span><span>think about the problem</span><span>&nbsp;that we are solving.” Yes!</span>
    </p>
    <p><span></span></p>
    <p><span>There are four main data model layers: </span></p>
    <ol start="1">
        <li><span>our application - abstracts some domain and business logic</span></li>
        <li><span>our data structures - how we represent information eg. json document</span></li>
        <li><span>our database - how it stores and retrieves data e.g. in-memory, fast-reads</span></li>
        <li><span>our hardware - how bytes are physically stored and moved around</span></li>
    </ol>
    <p><span></span></p>
    <p><span>We need to think about our use-case in choosing our data models as different models are optimised for different use-cases. We look at relational vs “NoSql” models next, whose </span><span>backronym</span><span>&nbsp;is “Not Only Sql” as many dbs under this term are sql-ish.</span>
    </p>
    <p><span></span></p>
    <p><span>NoSql stores arose from the need for </span></p>
    <ul>
        <li><span>Greater scalability, esp of write throughput and big data</span></li>
        <li><span>Preference for open source over commercial products</span></li>
        <li><span>Specialised query operations not easily achieved by a relational model</span></li>
        <li><span>More flexible schemas </span></li>
    </ul>
    <p><span></span></p>
    <p><span>If I can try and summarise what goes into choosing our data structures and database (layer 2 and 3) it would be:</span>
    </p>
    <ol start="1">
        <li><span>How localised is the data i.e. how many relationships does it have?</span></li>
    </ol>
    <ol start="1">
        <li><span>If very localised, a document store should be ok</span></li>
        <li><span>If some relationships, an RDS should be ok</span></li>
        <li><span>If lots of relationships, a graph db should be ok</span></li>
    </ol>
    <ol start="2">
        <li><span>What workload are we optimising for?</span></li>
    </ol>
    <ol start="1">
        <li><span>If read heavy, an in-memory store like Redis should be okay</span></li>
        <li><span>If write heavy, a log-structured store like Cassandra</span></li>
        <li><span>If a mixture, then an RDS like Postgres</span></li>
        <li><span>Or perhaps some combination of the above for different workloads (an idea called </span><span>polyglot persistence</span><span>)</span>
        </li>
    </ol>
    <p><span></span></p>
    <p><span>Of course there is a lot more nuance to consider, but I think it’s a helpful starting point before we dive into details. Also, if your scale is small-medium you can probably do everything you need in Postgres (see </span><span><a
            href="https://www.google.com/url?q=https://www.amazingcto.com/postgres-for-everything/&amp;sa=D&amp;source=editors&amp;ust=1718616875270997&amp;usg=AOvVaw1nywt4aJWrsoPwktw377G7">https://www.amazingcto.com/postgres-for-everything/</a></span><span>).</span>
    </p>
    <p><span></span></p>
    <p><span>When our application reads stored data in from the db, it has to translate it into its data structures (ie. moving from layer 3 to 2). This is called an </span><span>impedance mismatch</span><span>&nbsp;(a term borrowed from electronics) i.e. </span><span>there</span><span>&nbsp;is resistance caused by what the application needs its data and how the db wants to store its data. Some people feel this is reduced by using a document store.</span>
    </p>
    <p><span></span></p>
    <p><span>If data is highly localised, it can be nice to store and retrieve a document. If it isn’t, then you end up reading a document and then using some value in it to read another document, and so on. Essentially what is performed at the database level in RDS is performed at the application level when using document stores: the application performs the “join” to stitch related data together while an RDS supports joining relations. </span>
    </p>
    <p><span></span></p>
    <p><span>Similarly, NoSql stores are often called “schemaless” but this is misleading. A better description is “schema-on-read” (document) versus “schema-on-write” (RDS): when our app reads a document it needs to handle different versions of its schema (schema-on-read), meanwhile when our app uses RDS we need to migrate data to a new schema and all subsequent writes must conform to this schema (schema-on-write). Lines are blurry though - it is possible to write a migration for documents (document-store) and it’s also possible to expand/contract a schema (RDS) by allowing a column to be NULLable for the time-being; making sure our app is backwards compatible (and testing the migration of course;). In my experience it is more cumbersome handling different versions of data with document stores than in RDS which forces you to think about it upfront (a bit like static vs dynamic typing, or test first vs implement first). </span>
    </p>
    <p><span></span></p>
    <p><span>Because RDS is good at joins, it is natural to </span><span>normalise</span><span>&nbsp;our data (effectively splitting it up into a table per entity). This gives many advantages over a single large document</span>
    </p>
    <ul>
        <li><span>Consistent naming avoids ambiguity and duplication (eg a reference table) and helps make localisation easier</span>
        </li>
        <li><span>Easy to update (just update the item being referred to vs every single document)</span></li>
        <li><span>Better search (because data is related, we can easily infer relationships eg that Seattle is in Washington</span>
        </li>
    </ul>
    <p><span></span></p>
    <p><span>As an aside, using an ID referring to a value of a set e.g. ID123 =&gt; GMT+1(London), makes it easier to then change that value later (say if we renamed the timezone to BST) and helps with deduplication. “Because [and id] has no meaning to humans, it never needs to change: the ID can remain the same, even if the information it identifies changes”. </span>
    </p>
    <p><span></span></p>
    <p><span>“Data has a tendency of becoming more interconnected as features are added to applications” - yes! This is why I would almost always choose to use Postgres and its json support over a document store; we will often want some of the advantages that RDS brings at some point. </span>
    </p>
    <p><span></span></p>
    <p><span>Document stores are also inefficient on read and write unless a) we always want an entire document and b) rarely modify them in place. This is because a) if we only want one field, we still have to read an entire document and b) we have to rewrite an entire document (“only modifications that don’t change the encoded size of a document can easily be performed in place”. For these reasons it is generally recommended that you keep documents fairly small and avoid writes that increase the size of a document. These performance limitations significantly reduce the set of situations in which document databases are useful”. </span>
    </p>
    <p><span></span></p>
    <p><span>Declarative query languages like SQL are really advantageous as a query optimiser can be written for us, completely transparently to our use of the API. This is because SQL is an abstraction over </span><span>how</span><span>&nbsp;data is fetched (we just say </span><span>what</span><span>&nbsp;data we want with no assumption of </span><span>how</span><span>&nbsp;it is retrieved) so the underlying mechanism for retrieval can be improved upon without breaking clients of it. </span>
    </p>
    <p><span></span></p>
    <p><span>I won’t summarise graph databases as I haven’t used them but I will just note that they are useful for highly connected data like that of social media businesses, wanting to understand the cross-section between e.g. people and their friends and all of their respective interests and events they are attending. </span>
    </p>
    <p><span></span></p>
    <p><span>There are other database types as well: full-text search; gene databases are for searching large strings that are subtly different; very-very-big data e.g. LHC stores hundreds of petabytes.</span>
    </p>
    <p><span></span></p>
</article>
    </div>
</div>
</body>
</html>
`