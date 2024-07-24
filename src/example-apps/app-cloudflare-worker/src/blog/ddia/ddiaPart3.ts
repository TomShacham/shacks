import {contentsPage} from "./index";

export const ddiaPart3 = `<!doctype html>
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
    <h4><span>Storage and Retrieval - Chapter 3</span></h4>
    <p><span></span></p>
    <p><span>“On the most fundamental level, a database needs to do two things: when you give it some data, it should store the data, and when you ask it again later, it should give the data back to you”. This is the best summary of a database I’ve ever read! Cracked me up when I first read that - turns out there is a LOT that goes into making those two things work. </span>
    </p>
    <p><span></span></p>
    <p><span>If we consider the simplest db, we append entries to a file (store) and then we search that file for an entry later (retrieve). This is about as fast as writes can get (appending to a file is fast, and there is nothing else we need to do on write) but it’s unfortunately also about as slow as a read can get (scan the whole file!). In order to speed up retrieval we need some kind of index into our data.</span>
    </p>
    <p><span></span></p>
    <p><span>The simplest index for a column we want to index would be a hash-map: with the column’s values for as its keys, and a pointer to where the corresponding row is located in storage as its values. If we want to do a query, we use the hash-map to find the rows we need. </span>
    </p>
    <p><span></span></p>
    <p><span>Now that we have an index into our data our read performance has dramatically improved, however our write performance is a bit worse because we need to write to our storage </span><span>and</span><span>&nbsp;update our index. This is why databases typically leave it to us to choose our indexes(!) - we have a better idea of what is worth indexing for the read-write performance trade-off. A related idea in Postgres - “unlogged” tables do not write to the WAL (write-ahead-log) so trade-off write performance versus durability. </span>
    </p>
    <p><span></span></p>
    <p><span>Let’s say we dedicated 8GB of RAM to our in-memory hash index, and each value it points to in memory is 1KB; then we can maintain an index of 8TB of data. What’s more, if we are often reading the same handful of keys then it is likely that data is already in the filesystem cache and no disk IO needs to take place - so reads are highly performant. </span>
    </p>
    <p><span></span></p>
    <p><span>How do we stop ourselves from running out of disk space? Since writing appends to a log; all we need to do is split the log up into segments and perform “compaction” - in this case a background process that merges two adjacent segments by taking the latest value for each row (i.e. throwing away duplicate keys).</span>
    </p>
    <p><span></span></p>
    <p><span>There are some further challenges:</span></p>
    <ol start="1">
        <li><span>Deletions - “tombstones” mark a record to be removed rather than merged.</span></li>
        <li><span>Crash recovery - we need to rebuild our index which would be quite slow; instead we can use a WAL (write-ahead-log).</span>
        </li>
        <li><span>Failed writes - partial data can be discarded through use of checksums</span></li>
        <li><span>Concurrency - writes need to be sequential so only one thread writes to the db</span></li>
    </ol>
    <p><span></span></p>
    <p><span>The advantages of this append-only approach is:</span></p>
    <ol start="1">
        <li>
            <span>Writes and segment merges are “sequential writes” which are generally much faster than random writes</span>
        </li>
        <li><span>Concurrency and crash recovery are simple</span></li>
        <li><span>Merging segments avoid the problem of data files getting fragmented over time</span></li>
    </ol>
    <p><span></span></p>
    <p><span>However there are two main drawbacks</span></p>
    <ol start="1">
        <li>
            <span>The hash table must fit in memory - a hash table on disk means a lot of random writes which is slow</span>
        </li>
        <li><span>Range queries are not efficient - we must look up each value by key</span></li>
    </ol>
    <p><span></span></p>
    <p><span>We can address these limitations using SSTables and LSM-Trees (log structured merge trees like AVL trees or Red-Black trees)</span>
    </p>
    <p><span></span></p>
    <p><span>Currently we write key-value pairs in the order they are written; if instead we require that they are written ordered by key then we get some nice benefits:</span>
    </p>
    <ol start="1">
        <li><span>Merging segments is trivial, just take the most recent entry for each key</span></li>
        <li><span>Our in-memory index can now be sparse - we only need to index some of our keys: now that they’re sorted we can find the nearest neighbouring key that we have in our index and scan from there. This means we can index far larger datasets.</span>
        </li>
        <li><span>In taking the above tack, read requests scan over several key-value pairs, so we can now compress blocks of records since we are scanning them anyway. “Each entry of the sparse in-memory index then points at the start of a compressed block. Besides saving disk space, compression also reduces the I/O bandwidth use”</span>
        </li>
        <li><span>We can now efficiently perform range queries because data is sorted</span></li>
    </ol>
    <p><span></span></p>
    <p><span>Now we have addressed the two main drawbacks above!</span></p>
    <p><span></span></p>
    <p><span>Balanced in-memory trees are sometimes called </span><span>memtables</span><span>&nbsp;and they guarantee O(log n) look-up by re-balancing the tree on insertion, keeping their elements sorted. </span>
    </p>
    <p><span></span></p>
    <p><span>Now writes first go to our tree, then if the key does not exist there we search for it on disk using our index. Once the tree reaches a certain size we can efficiently write it to an SSTable on disk since it’s already ordered. If the database crashes we lose our in-memory tree, so we also write to a </span><span>WAL</span><span>&nbsp;that is used only for crash recovery. It’s also slow to lookup a key that does </span><span>not</span><span>&nbsp;exist in our database, so we use Bloom filters to efficiently respond in this case.</span>
    </p>
    <p><span></span></p>
    <p><span>The above approach is known as LSM-based storage engines (Log-Structured Merge-tree) and is more recent (papers written in the 90s) than the B-tree (binary tree) on-disk approach used since the 70s and still used by databases like Postgres. Lucene uses a similar approach to LSM and is used by the relatively modern full-text search dbs Elasticsearch and Solr as well as BigTable, Dynamo, HBase, Cassandra, LevelDB, RocksDB and more. </span>
    </p>
    <p><span></span></p>
    <p><span>B-trees then are quite different and the more widely-used approach. Storage is split up into segments on disk; each segment is made up of fixed-size blocks (usually 4KB, to match typical hardware setups) and the segment either contains some data (leaf node) or it references the location of another segment on disk (i.e. we have a tree of pointers to segments). Each segment is responsible for a sorted range of pointers to other segments so it is efficient to read a value - O(log n) - but writing is a little complicated. </span>
    </p>
    <p><span></span></p>
    <p><span></span></p>
    <p><span
            style="overflow: hidden; display: inline-block; margin: 0.00px 0.00px; border: 0.00px solid #000000; transform: rotate(0.00rad) translateZ(0px); -webkit-transform: rotate(0.00rad) translateZ(0px); width: 511.00px; height: 254.00px;"><img
            alt="" src="images/image2.png"
            style="width: 602.00px; height: 328.00px; margin-left: -29.00px; margin-top: -23.00px; transform: rotate(0.00rad) translateZ(0px); -webkit-transform: rotate(0.00rad) translateZ(0px);"
            title=""></span></p>
    <p><span>B-tree (searching for block 131, start at the root segment and then follow the pointers). A 4-level tree with a branch factor of 500 and 4KB pages can store up to 250TB.</span>
    </p>
    <p><span></span></p>
    <p><span>With writes, we find the correct page to write to so that we maintain the sorting order of our data. But if there is not enough space in the page then we need to break it up into two blocks and update the parent segment’s references to know about the new block. </span>
    </p>
    <p><span></span></p>
    <p><span>There are some challenges with B-trees: </span></p>
    <ol start="1">
        <li><span>It is assumed when a page is overwritten that existing references to that page are still correct i.e. the page’s location hasn’t changed.</span>
        </li>
        <li><span>Every write operation is an actual hardware operation (writing to disk). </span></li>
        <li><span>If we crash half-way through a write then we need to recover (use a WAL)</span></li>
        <li><span>Concurrency control is needed to give multiple threads a consistent view of the data (latches are attached to the tree)</span>
        </li>
    </ol>
    <p><span></span></p>
    <p><span>These problems are mitigated in the LSM approach because we write to an in-memory data structure we don’t do a hardware operation on every write, we don’t worry about splitting pages because we only ever append to a log (when our tree gets to a certain size) and concurrency is easier to handle as merging of segments is done in the background without interfering with incoming reads. As a rule-of-thumb, LSM engines are faster for high write-throughput while B-tree engines are faster for high read-throughput “because they have to check several different data structures and SSTables at different stages of compaction”. However your mileage may vary depending on your workload so do your own benchmarking. B-trees tend to provide consistently good performance as they have been worked on for so long. </span>
    </p>
    <p><span></span></p>
    <p>
        <span>So far we have looked at key-value indexes (i.e. roughly-speaking </span><span>primary key indexes</span><span>) but we can also create </span><span>secondary indexes</span><span>&nbsp;which are often useful if we are often joining on another column besides the primary key. Primary keys are unique, and secondary indexes aren’t, so in order to make one we can either a) make each key in the index a list of row identifiers or b) we can add a unique id to each row.</span>
    </p>
    <p><span></span></p>
    <p><span>Indexes can either point at where the data is stored (in a </span><span>heap file</span><span>) or they can actually store the data in the index (</span><span>a clustered index</span><span>) which speeds up reads (this is how InnoDB engine works), or it can be a mixture of the two (</span><span>a covering index</span><span>) where the index is said to cover the query some of the time. I’m guessing that clustered indexes need some cleverness to provide transactional guarantees for concurrent reads/writes. </span>
    </p>
    <p><span></span></p>
    <p><span>Multi-column indexes are useful when querying multiple columns. Many books have been dedicated to just index design! The long story short is this (thanks to </span><span><a
            href="https://www.google.com/url?q=https://www.slideshare.net/billkarwin/how-to-design-indexes-really&amp;sa=D&amp;source=editors&amp;ust=1718616875277422&amp;usg=AOvVaw1YVCbu9FP-cFeIOSWcfQGv">Bill Karwin</a></span><span>):</span>
    </p>
    <p><span>Imagine we have a phone book and a composite index on all 3 columns (last_name, first_name, phone):</span>
    </p>
    <p><span></span></p>
    <p><span
            style="overflow: hidden; display: inline-block; margin: 0.00px 0.00px; border: 0.00px solid #000000; transform: rotate(0.00rad) translateZ(0px); -webkit-transform: rotate(0.00rad) translateZ(0px); width: 601.70px; height: 361.33px;"><img
            alt="" src="images/image3.png"
            style="width: 601.70px; height: 361.33px; margin-left: 0.00px; margin-top: 0.00px; transform: rotate(0.00rad) translateZ(0px); -webkit-transform: rotate(0.00rad) translateZ(0px);"
            title=""></span></p>
    <p>
        <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Note: ordered by last_name first, and first_name second. </span>
    </p>
    <p><span></span></p>
    <ol start="1">
        <li><span>A multi-column index like this is very efficient when exactly querying by either a) last_name, b) last_name, first_name or c) last_name, first_name, phone (i.e. last_name = ‘Table’ AND first_name = ‘Jess’); but it is not efficient at i) querying on any other combination or ii) when querying multiple columns with one or more range queries (e.g. last_name LIKE ‘T%’ AND first_name = ‘Jess’). </span>
        </li>
        <li><span>If we are selecting a column not in the index (say, country_code) then we need to look up the value in the </span><span>heap</span><span>&nbsp;unless we have a </span><span>clustered</span><span>&nbsp;index (i.e. row is stored in index).</span>
        </li>
        <li><span>Indexes slow down writes so we should be careful about what we index, don’t just index everything. Good indexes account for the workload, so developers are best placed to write the index as they are familiar with the application usage.</span>
        </li>
        <li><span>So, columns we filter on and columns we group/order by - we want all of them in our </span><span>concatenated</span><span>&nbsp;index; and columns we select we may want to add too.</span>
        </li>
        <li><span>Some queries are still slow regardless: range queries as above; an OR filter; grouping by and ordering by on different columns; sorting by multiple columns over different tables (indexes don’t span tables); ordering by in a different order than our index’s order)</span>
        </li>
    </ol>
    <p><span></span></p>
    <p><span>One option for speeding up range queries on multiple columns is to use an R-tree index which uses bounding rectangles to collapse two dimensions into one. </span>
    </p>
    <p><span></span></p>
    <p><span>Zooming back out; let’s look at in-memory databases. So far we have tried to solve the problem of data storage and retrieval on disk. This is much harder to deal with than in-memory data because we need to care about how data is laid out. The upside is that data is durable and storage is cheap. However, as RAM becomes cheaper in-memory datastores are growing in appeal, and there are some solutions for durability too:</span>
    </p>
    <ol start="1">
        <li><span>We can keep a </span><span>WAL</span><span>&nbsp;on disk to solve durability and recovery</span></li>
        <li><span>Or we could just not care (ephemeral data like a non-crucial cache)</span></li>
        <li><span>Or we could write periodic snapshots or replicate to other nodes in a network</span></li>
    </ol>
    <p><span></span></p>
    <p><span>Redis and Couchbase write to disk asynchronously, providing some weak durability guarantees. </span></p>
    <p><span></span></p>
    <p><span>Interestingly, the performance benefits of in-memory databases is often largely the lack of de/serialisation required from binary (on-disk) to whatever format is desired; rather than skipping a disk I/O because disk-based storage engines can cache a lot of lookups anyway.</span>
    </p>
    <p><span></span></p>
    <p><span>Another interesting benefit is that because they are in-memory, these stores can offer useful efficient data structures like Sets and Queues that are difficult to implement in disk-based indexes. </span>
    </p>
    <p><span></span></p>
    <p><span>Everything we’ve looked at so far we might call OLTP (Online Transaction Processing) - “in the early days of business data processing, a write to the database typically corresponded to a commercial transaction taking place: making a sale, placing an order, paying an employee’s salary etc.” - hence the name transaction. This is in contrast to OLAP (Online Analytical Processing) which we tend to associate now with business insights (BI), data warehousing and a team of data analysts and scientists. </span>
    </p>
    <p><span></span></p>
    <p><span>OLAP we tend to use to answer business questions like what product grew the most in the last month vs this time last year. A really useful table of the general differences:</span>
    </p>
    <p><span></span></p>
    <p><span
            style="overflow: hidden; display: inline-block; margin: 0.00px 0.00px; border: 0.00px solid #000000; transform: rotate(0.00rad) translateZ(0px); -webkit-transform: rotate(0.00rad) translateZ(0px); width: 601.70px; height: 297.33px;"><img
            alt="" src="images/image5.png"
            style="width: 601.70px; height: 297.33px; margin-left: 0.00px; margin-top: 0.00px; transform: rotate(0.00rad) translateZ(0px); -webkit-transform: rotate(0.00rad) translateZ(0px);"
            title=""></span></p>
    <p><span></span></p>
    <p><span>We do this because we don’t want slow, long-running queries to degrade the quality of service that we provide customers; so business questions can be answered offline and nowadays using a different database technology in all likelihood. </span>
    </p>
    <p><span></span></p>
    <p><span>If we’re working at a small company with some few million rows of data, we probably don’t need to worry about this workload splitting too much. In my experience, small companies spend tens of thousands on data warehousing technology (ETL as a service like fivetran, data querying tools like Looker, data storage like BigQuery) when there isn’t very much data. I’m not advocating for sharing a production instance with the data team but a simple database built off a daily snapshot of production is probably fine (and 100x cheaper). We could even imagine some simple data replication methods that could give almost real-time data to the “warehouse” when our scale is small. </span>
    </p>
    <p><span></span></p>
    <p><span>Data warehouses are designed in a “star-schema” - a “fact table” at the centre and various “dimensions” around it. The fact table is typically tens or hundreds of columns wide, encapsulating all the main facts about an event, and contains foreign keys to dimensions that entail more interesting data about a particular attribute, e.g. </span><span>we might</span><span>&nbsp;have a fact table in the middle called “sales” with dimensions for “customer”, “product” and “advertising” around it that drills down into more info.</span>
    </p>
    <p><span></span></p>
    <p><span>In order to make warehouses more efficient, we can organise our data storage in columns rather than rows (column-oriented storage). If we have a large dataset but our queries typically select a handful of columns at a time, it’s much more effective if we lay out our data in columns rather than rows. Another benefit is that if our column is sorted we can massively compress them if they have mostly the same values in them (e.g. if there are 100 products, but 100 million sales, we can compress this down massively). Moreover, if we represent each value (product in this case) as a bitmap (e.g. 0 0 0 0 1 0 0 0 … ) we can speed up a query like “WHERE product_sk IN (30, 68, 69)” massively by computing bitwise AND/OR at the CPU level - this is known as “vectorised processing”. However, once compressed, it makes writes more difficult as we may need to rewrite all column files - we can help solve this by using an in-memory LSM-tree approach as we saw before and then only writing out to disk every now and then.</span>
    </p>
    <p><span></span></p>
</article>
    </div>
</div>
</body>
</html>
`