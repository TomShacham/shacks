export const contentsPage = `
<article>
            <h2>Designing Data-Intensive Applications</h2>
            <a href="/blog/welcome" class="inline-block">back</a>
            <p>
                This is a 12-part blog series on Martin Kleppmann's fantastic book. I attempt to condense down the 
                500-something page book that is itself a self-proclaimed "overview" of data systems. It's helped me
                to have a more solid foundational understanding of the trade-offs in system design.
            </p>
            <ul>
            <li><a href="/blog/ddia/part-1-reliable-scalable-and-maintainable-systems">Reliable, Scalable and Maintainable Systems</a></li>
            <li><a href="/blog/ddia/part-2-data-models-and-query-languages">Data Models and Query Languages</a></li>
            <li><a href="/blog/ddia/part-3-storage-and-retrieval">Storage and Retrieval</a></li>
            <li><a href="/blog/ddia/part-4-encoding-and-evolution">Encoding and Evolution</a></li>
            <li><a href="/blog/ddia/part-5-replication">Replication</a></li>
            <li><a href="/blog/ddia/part-6-partitioning">Partitioning</a></li>
            <li><a href="/blog/ddia/part-7-transactions">Transactions</a></li>
            <li><a href="/blog/ddia/part-8-trouble-with-distributed-systems">Trouble with Distributed Systems</a></li>
            <li><a href="/blog/ddia/part-9-consistency-and-consensus">Consistency and Consensus</a></li>
        </article>`

export const index = `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Tom Shacks - Designing Data-Intensive Applications</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
<div class="flex-col align-center">
    <div class="m-2"></div>
    <div class="flex-col m-8 py-4 w-full sm:w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/3">
        ${contentsPage}
    </div>
</div>
</body>
</html>
`
