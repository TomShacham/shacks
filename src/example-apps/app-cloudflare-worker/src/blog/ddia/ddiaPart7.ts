import {contentsPage} from "./index";

export const ddiaPart7 = `<!doctype html>
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
    <h4><span>Transactions - chapter 7</span></h4>
    <p><span></span></p>
    <p><span>Transactions exist to provide some guarantees in the face of faults (quoting Martin directly):</span></p>
    <ol start="1">
        <li>
            <span>Database software or hardware may fail at any time (including in the middle of a write operation)</span>
        </li>
        <li><span>The application may crash at any time (including halfway through a series of operations)</span></li>
        <li><span>Interruptions in the network can unexpectedly cut off the application from the database, or one database node from another</span>
        </li>
        <li><span>Several clients may write to the database at the same time, overwriting each other’s changes</span>
        </li>
        <li><span>A client may read data the doesn’t make sense because it has only partially been updated</span></li>
        <li><span>Race conditions between client can cause surprising bugs</span></li>
    </ol>
    <p><span></span></p>
    <p><span>Transactions have existed for decades and provided fault-tolerance to applications in need of certain guarantees (e.g. that a deposit will be made either zero or one times). The term ACID was coined in 1983 but has since lost its meaning through mismarketing of databases and misunderstanding; it describes some dimensions of guarantees:</span>
    </p>
    <p><span></span></p>
    <p><span>Atomic means some action either happens or it doesn’t. If an operation fails halfway through then our changes are rolled back and the failure returned to the client, guaranteeing that the action wasn’t partially successful and it can be retried without idempotence concerns. </span>
    </p>
    <p><span></span></p>
    <p><span>Consistency can only be ensured by the application because consistency is domain dependent. What we mean by consistency in ACID is that the invariants assumed by your model are not violated e.g. all debits amount to all credits. The database cannot provide this guarantee as it sits one layer above, although we can rely on atomicity and isolation to achieve consistency. So the C in ACID shouldn’t really belong there, as it’s a property of the application.</span>
    </p>
    <p><span></span></p>
    <p><span>Isolation is about how two concurrent operations interact, or rather how isolated they are. There are different levels of isolation, the lowest being that there is none (i.e. two operations step on each others’ toes) and the highest being serialised operations (i.e. one operation is forced to happen after the other); there are a number of different isolation levels that sit in between and trade-off performance with level of guarantee about the operations.</span>
    </p>
    <p><span></span></p>
    <p><span>Durability is the guarantee that once data has been successfully committed, it is actually stored on disk. In practice, many things can go wrong and it can be impossible to guarantee durability. A disk block can be corrupted; disk firmware may have a bug; there may be subtle interactions between the storage engine and the OS, or the OS and the firmare; there may be a full power outage for an entire rack or data centre. To mitigate these issues we should replicate to remote machines and use backups; but in theory and in practice it is impossible to absolutely guarantee durability. </span>
    </p>
    <p><span></span></p>
    <p><span>Even single object operations can cause issues </span></p>
    <ol start="1">
        <li><span>What if a read happens halfway through a write?</span></li>
        <li><span>What if the write fails halfway through?</span></li>
    </ol>
    <p>
        <span>so typically all databases provide guarantees about single objects using locks and crash recovery logs. </span>
    </p>
    <p><span></span></p>
    <p><span>Regardless, multi-object operations are needed relatively soon (unless you’re going to eschew most guarantees like in leaderless replication databases)</span>
    </p>
    <ol start="1">
        <li><span>Updating foreign key constraints needs to take place atomically with the write operation; similarly secondary indexes we want to update atomically with the write</span>
        </li>
        <li><span>In a document database we often want to write multiple objects at once or fail if any fail</span></li>
    </ol>
    <p><span></span></p>
    <p><span>However, atomicity still has some footguns we can step on:</span></p>
    <ol start="1">
        <li><span>What if the network fails after committing successfully and we fail to tell the client that the commit was successful? The client may retry a non-idempotent action. (2 Phase Commit can help with this)</span>
        </li>
        <li>
            <span>If the client process fails while retrying then we may lose the data we were trying to write for good</span>
        </li>
    </ol>
    <p><span></span></p>
    <p><span>Isolation levels provide guarantees about reading and writing our data concurrently. We trade off better performance for better guarantees but in some applications we cannot tolerate anything less than some guaranteed outcome e.g. withdrawing money. </span>
    </p>
    <p><span></span></p>
    <p><span>Essentially all problems related to isolation level can be seen as the problem of reading or writing some data at the same time as another thread is writing the data. We might think that by default database transactions provide a guarantee that we cannot lose writes or that we always read the latest value, but as with indexes it is left to the application developer to make the tradeoff. </span>
    </p>
    <p><span></span></p>
    <p>
        <span>The most common default isolation level is called </span><span>read committed</span><span>. This prevents </span><span>dirty reads </span><span>and </span><span>dirty writes</span><span>. A dirty read is when one transaction is able to read </span><span>uncommitted</span><span>&nbsp;writes by another transaction; but since there’s no guarantee the transaction commits or that it doesn’t have more writes to do, it means our read is dirty. A dirty write is similar except we aren’t reading but writing data that another transaction is also writing - in this case, we need to wait for the other transaction to complete before we get to write our data, thus preventing a </span><span>dirty write</span><span>&nbsp;e.g. two transactions are incrementing a counter, they both read c = 0 and both set c = 0 + 1, instead of c = 0 + 1 then c = 1 + 1. </span>
    </p>
    <p><span></span></p>
    <p><span>Dirty writes are prevented using row-level locks. Dirty reads are prevented by holding onto the “old” value before the other transaction has committed, and simply returning that. This is a performance enhancement (versus row-level locking) for reads, so that reads and writes do not block others trying to read the same data. This can be phrased as </span><span>writers never block readers and readers never block writers</span><span>. </span>
    </p>
    <p><span></span></p>
    <p><span>So now we can’t do dirty reads or writes, we should be good to go, right? Wrong! :)</span></p>
    <p><span>There are a few more subtle situations in which we can get behaviours we likely do not want; roughly speaking I’d characterise them as:</span>
    </p>
    <ol start="1">
        <li><span>Multiple reads or reading many rows (scans) in a transaction</span></li>
        <li>
            <span>Writing based on the result of a read (where the read would produce a different result moments later)</span>
        </li>
    </ol>
    <p><span></span></p>
    <p><span>In the first case, one transaction may perform two reads (say, read balance of account 1 and 2) but in between the reads, another transaction has performed a write that updates account 1 and 2 (say, a transfer between them). Below, Alice sees 500 in 1 and 600 in 2, but when she refreshes the page, it will correctly show 400 in 1 and 600 in 2. </span>
    </p>
    <p><span></span></p>
    <p><span
            style="overflow: hidden; display: inline-block; margin: 0.00px 0.00px; border: 0.00px solid #000000; transform: rotate(0.00rad) translateZ(0px); -webkit-transform: rotate(0.00rad) translateZ(0px); width: 386.41px; height: 331.76px;"><img
            alt="" src="images/image1.png"
            style="width: 479.98px; height: 386.77px; margin-left: -48.64px; margin-top: -22.54px; transform: rotate(0.00rad) translateZ(0px); -webkit-transform: rotate(0.00rad) translateZ(0px);"
            title=""></span></p>
    <p><span></span></p>
    <p><span>The above is an example of a </span><span>non-repeatable read</span><span>, as Alice will get different results when she repeats her request for her balances. </span>
    </p>
    <p><span></span></p>
    <p><span>This problem also arises when taking backups: because they may take a while it’s not acceptable to read the latest state of the database on each read the backup takes, we need to base our backup off a snapshot in time. The same is true for long running analytics queries or tasks that perform cleanup or integrity checks; all need a snapshot in time. </span>
    </p>
    <p><span></span></p>
    <p><span>To prevent this, databases provide </span><span>snapshot isolation and repeatable read</span><span>. Each transaction works off a snapshot of the data it reads/writes. As multiple transactions may concurrently read/write the same data, multiple versions of data are kept so snapshot isolation is often referred to as </span><span>multi-version concurrency control (MVCC)</span><span>. </span>
    </p>
    <p><span></span></p>
    <p><span>Updating the above diagram to demonstrate MVCC, each row now has multiple versions of the data, tagged by which transaction created it and deleted it. Transactions are given ids that increment, and the rules for guaranteeing repeatable reads are now as follows:</span>
    </p>
    <ol start="1">
        <li><span>All transactions that are in progress at the start of a new transaction are ignored and all transactions whose tx id is higher than ours are ignored.</span>
        </li>
        <li><span>Any writes made by aborted transactions are ignored.</span></li>
    </ol>
    <p><span></span></p>
    <p><span>All other writes are visible to our transaction. Or more explicitly, we can see an object if:</span></p>
    <ol start="1">
        <li><span>The transaction that created it has already committed</span></li>
        <li>
            <span>The object is not marked for deletion, or it is marked for deletion but by a tx id higher than ours</span>
        </li>
    </ol>
    <p><span></span></p>
    <p><span
            style="overflow: hidden; display: inline-block; margin: 0.00px 0.00px; border: 0.00px solid #000000; transform: rotate(0.00rad) translateZ(0px); -webkit-transform: rotate(0.00rad) translateZ(0px); width: 411.05px; height: 362.50px;"><img
            alt="" src="images/image4.png"
            style="width: 486.97px; height: 411.86px; margin-left: -35.59px; margin-top: -14.56px; transform: rotate(0.00rad) translateZ(0px); -webkit-transform: rotate(0.00rad) translateZ(0px);"
            title=""></span></p>
    <p><span></span></p>
    <p><span>Indexes can simply point to multiple versions of the data and filter the result based on the transaction id querying it. Or, a copy-on-write scheme can be used that creates a new B-tree for each version of our row. Either way, garbage collection can clean up the unused versions and index entries once it’s clear no transaction is reliant on that data any more. </span>
    </p>
    <p><span></span></p>
    <p><span>So we have addressed point 1 of the 2 classes of problems, namely multiple reads or reading many rows (scans) in a transaction can cause </span><span>non-repeatable reads</span><span>. Point 2 entails the pitfalls of performing concurrent writes, or indeed writing based on the result of a read (where the read would produce a different result moments later). In general we call this problem </span><span>write skew</span><span>, which describes the case where two transactions write two different objects based on the same assumption. In the case where both transactions write the same object, we can get </span><span>dirty writes</span><span>&nbsp;as seen previously (two transactions racing to write the same value) and we can get </span><span>lost updates</span><span>&nbsp;(two transactions enter a read-modify-write cycle, and the latter write </span><span>clobbers </span><span>the former, coming next).</span>
    </p>
    <p><span></span></p>
    <p><span>We can prevent </span><span>lost updates</span><span>&nbsp;by taking out an explicit lock on the row we are reading in our </span><span>read-modify-write</span><span>&nbsp;cycle to ensure that two concurrent transactions cannot read the value at once. Alternatively, many databases offer atomic operations that essentially manage this for you. Some even provide automatic detection of lost updates on </span><span>repeatable read</span><span>&nbsp;isolation level and so rollback transactions with a lost update (including Postgres, Oracle and SQL Server, but not MySQL).</span>
    </p>
    <p><span></span></p>
    <p><span>To demonstrate a lost update, let’s say we have some money in our account, and we withdraw it. But we actually press the withdrawal button twice, or we cheekily have our account open on two tabs/devices and press withdraw at the same time. If two transactions now simultaneously read our balance and perform a withdrawal, both will succeed. With snapshot isolation, both transactions see our balance initially, (e.g. select balance from accounts where account_id = 123) and then one transaction performs the write (e.g. set balance = 0) and then the second does too. Huzzah, we have robbed the bank! The first update is said to be lost but both were successful in terms of the transaction committing (and the application sending money - although this is perhaps not a “success” so to speak).</span>
    </p>
    <p><span></span></p>
    <p><span>If we now imagine that we are withdrawing money from two different accounts at the same bank, but our bank has a limit on the number of daily withdrawals we can do across all accounts (maybe for security reasons). If we simultaneously perform two withdrawals again, and both transactions check total withdrawals (e.g. select count(*) from withdrawals where date = today and account_id = 123) before permitting the withdrawal, both transactions will see the same value for the initial read (just like in the lost update) and allow both withdrawals. The difference in this case is that the transactions are updating two different objects (account 1 and account 2) so we aren’t losing an update, but we are still doing something undesired - this is called </span><span>write skew</span><span>&nbsp;because there is a race condition which skews the outcome. </span>
    </p>
    <p><span></span></p>
    <p><span>Both situations can be solved by taking out a lock on the read (e.g. select balance from accounts where account_id = 123 for update). The “for update” tells the database to lock all rows returned by this query. A super important point here is that if there is no index on this column we are filtering on, then the database will lock the whole table! Choose your indexes wisely. </span>
    </p>
    <p><span></span></p>
    <p><span>There is still however a situation where we cannot lock the rows for update, because they don’t actually exist yet. When this causes race conditions, this is known as a </span><span>phantom</span><span>. For example, if we are booking a meeting room and two transactions attempt to reserve the same room for the same period concurrently, they would both succeed. Let’s say we check if a room is booked before booking it (e.g. select room_id from room_bookings where time = midday), we cannot attach a “for update” because the row doesn’t exist so there is nothing to lock. For this we need serialised transactions (i.e. enforce that concurrent transactions happen one after the other). &nbsp;</span>
    </p>
    <p><span></span></p>
    <p><span>One way to achieve this is to simply make “serialisable” transactions execute on a single thread (VoltDB, H-Store, Redis, Datomic); this has become more appealing as RAM has become cheaper and we can hold the dataset we need in-memory, so foregoing concurrency isn’t too much of a penalty. Also OLTP transactions tend to have few operations and operate on few rows - so shouldn’t take long. If some data required by the transaction is not in-memory, we could have the transaction abort so as not to block other transactions while fetching the data from disk (known as </span><span>anti-caching</span><span>). However, scaling single-threaded transactions to a partitioned setup is tricky, and limits the write throughput significantly. Concurrency may seem faster but of course sometimes it only introduces overhead which adds more appeal still to the single threaded approach.</span>
    </p>
    <p><span></span></p>
    <p><span>Or we could use </span><span>2-Phase Locking </span><span>(2PL) which has been widely used for around 30 years. While </span><span>snapshot isolation</span><span>&nbsp;has the rule </span><span>writers never block readers and readers never block writers</span><span>, 2PL has the inverse, </span><span>writers</span><span>&nbsp;block readers and readers block writers (note, readers don’t block readers). This protects against race conditions such as lost updates and write skew. However performance is significantly reduced versus weaker isolation levels. Using </span><span>predicate locks</span><span>&nbsp;or </span><span>index-range locks</span><span>&nbsp;we can also prevent </span><span>phantoms</span><span>. In the case of meeting room booking described above, we can attach a lock to either a predicate (i.e. any query that selects some row) or an index, and only allow one thread to have that lock at a time. It’s actually not clear to me if this mechanism guarantees preventing booking two meeting rooms simultaneously without there being a unique constraint on bookings. But the gotcha again is that if there is no index then the transaction will lock the whole table (bad performance!). </span>
    </p>
    <p><span></span></p>
    <p><span>2PL is so-called because the first phase acquires locks (during execution of the transaction) and the second phase releases them (by either committing or aborting) - there is no releasing half-way through. Many threads can hold a “shared” lock on an object for reading, but only one thread at a time can hold a lock in “exclusive” mode for writing. Deadlock is likely to occur where multiple threads are waiting for each other to release a lock, so we need to detect them and abort one of the transactions. If there is no limit on the duration of a transaction, we can quickly run into </span><span>head-of-line</span><span>&nbsp;</span><span>blocking</span><span>&nbsp;where one slow transaction that has a lot of locks ends up blocking others for a while. </span>
    </p>
    <p><span></span></p>
    <p><span>All of the approaches so far are essentially pessimistic locking or mutual exclusion. Single-threaded approaches are a lock on the whole database; 2PL forces writes to block and wait on each other. There is also optimistic locking in Serialisable Snapshot Isolation (SSI) which builds on </span><span>snapshot isolation</span><span>&nbsp;that we saw earlier in MVCC. Effectively we keep tabs on what transactions are reading and writing what data in a snapshot and instead of requiring locks, we simply rollback any transaction after we know there has been a violation of serialisation. Writes do </span><span>not</span><span>&nbsp;block readers and readers do </span><span>not </span><span>block writers. We therefore reduce the overhead of locks but introduce complexity in enforcing constraints in retrospect. </span>
    </p>
    <p><span></span></p>
    <p><span>As we know there are almost always trade-offs to be made, and in serialisable transactions we need to think about our workload and whether it’s read or write heavy, or if we’re likely to read or write many rows at a time. In SSI we may end up aborting very often if we do read and write quite often and a lot of rows at a time; however we’re less likely to experience </span><span>head-of-line blocking</span><span>&nbsp;than in 2PL or single-threaded. SSI also works well in distributed systems, whereas single-threaded is limited to the throughput of a single CPU. </span>
    </p>
    <p><span></span></p>
    <p><span></span></p>
</article>
    </div>
</div>
</body>
</html>
`