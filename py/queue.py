# encoding: utf-8

"""MongoDB utility functions for consuming a capped collection as a queue.

The code herein allows automatic construction of capped collections and consumption of records from a capped collection
in an efficient way, reminiscent of a queue.  Makes use of Python generator functions (yield syntax) such that the
result of calling queue() may be iterated over in a for loop, or be explicitly consumed by repeated calls to next(q).

This was used as the basis for a light-weight remote RPC (both immediate and scheduled) system similar to Celery.

Careful attention must be paid to the size of the desired capped collection; it must be large enough such that no items
get lost before they are processed by a consumer, with headroom for growth and headroom based on the amount of
historical information your use case requires.  The full RPC system that was built around this utilized a standard
collection for storage of task data (function to call, arguments, return value, exceptional state, etc.), allowing the
capped collection to be easily repopulated by iterating over incomplete tasks.
"""

from pymongo.errors import OperationFailure


class NotCappedException(Exception):
    pass


def setup(db, name, size=None, log=None):
    """Prepare a capped collection for use as a queue.
    
    Used by message producers to get a handle to the capped collection.
    
    Required arguments:
    
        db: The pymongo database connection to use.
        name: The name of the collection to use as a queue.
    
    Optional arguments:
    
        size: A size, in MiB, to use when (re)creating the collection.
        log: A Python standard logger instance to emit messages to.
    """
    
    queue = db[name]

    if not queue.options().get('capped', False):
        if not size:
            raise NotCappedException("Collection is not capped; specify a size to correct this.")

        if log:
            log.warn("Creating capped collection \"" + collection_name + "\" " + str(size) + " MiB in size.")
        
        db.drop_collection(name)
        db.create_collection(name, size=size * 1024 * 1024, capped=True)
        queue = db[name]

    if not queue.count():
        # This is to prevent a terrible infinite busy loop while empty.
        queue.insert(dict(nop=True))

    return queue


def queue(db, name, query=None, size=None, identity=None, log=None):
    """Return an iterable MongoDB-backed queue.
    
    Used by consumers to get an iterable which generates queue messages.
    
    Required arguments:
    
        db: The pymongo database connection to use.
        name: The name of the collection to use as a queue.
    
    Optional arguments:
    
        query: A collection.find() query dictionary; only yield records matching this.
        size: A size, in MiB, to use when (re)creating the collection.
        identity: An identifier used when determining if we should enact a 'stop' command.
        log: A Python standard logger instance to emit messages to.
    """
    
    queue = setup(db, name, size, log)
    last = None
    query = query or {}

    # Primary retry loop.
    # If the cursor dies, we need to be able to restart it.
    while True:
        cursor = queue.find(query, sort=[('$natural', 1)], slave_ok=True, tailable=True, await_data=True)

        try:
            # Inner record loop.
            # We may reach the end of the for loop (timeout waiting for
            # new records) at which point we should re-try the for loop as
            # long as the cursor is still alive.  If it isn't, re-query.
            while cursor.alive:
                for record in cursor:
                    # Update the last record ID for later re-querying.
                    last = record['_id']

                    # We can be asked to stop.
                    if record.get('stop', False):
                        who = record.get('target')
                        if not who or (identity and who = identity):
                            if log:
                                log.debug("Queue exiting due to explicit shutdown message.")
                            return

                    yield record

        except OperationFailure:
            pass

        if log:
            log.debug("Continuing from: " + str(last) + "(" + last.generation_time.isoformat(' ') + ")")

        # Update the query to continue from where we left off.
        query = ({"_id": {"$gte": last}}).update(query)


# Run four copies: python -i queue.py
# Then enter: consumer() into three of them (feel free to start them up)
# Finally enter producer() into the last.  Wait a few seconds.
# When you press ^C on the producer, the consumers will stop and emit performance info.

def producer():
    from pymongo import MongoClient
    from queue import setup, queue

    db = MongoClient().test
    queue = setup(db, 'messages', 16)

    try:
        while True:
            queue.insert({'a':1}, safe=False)
    except KeyboardInterrupt:
        queue.insert({'stop': True}, safe=False)


def consumer():
    from pymongo import MongoClient
    from queue import setup, queue

    db = MongoClient().test
    queue = queue(db, 'messages', size=16)

    rec = None
    while rec is None or rec.get('nop'):
        rec = next(queue)

    from time import time

    n = 0
    start = time()

    for rec in queue:
        n += 1

    duration = time() - start
    timeper = duration / float(n) * 1000
    msgper = float(n) / duration

    print "%0.2fs for %d messages: %0.2f usec/gen (%d messages/sec)" % (duration, n, timeper, msgper)
