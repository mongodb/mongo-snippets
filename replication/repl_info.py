
# this computes and prints how far behind a slave is from a master

from pymongo.connection import Connection
from pymongo import ASCENDING, DESCENDING

slave = Connection( "localhost" , 9999 , slave_okay=True )

source = slave["local"]["sources"].find_one()
lastSyncedSeconds = source["syncedTo"][1]
print( source )

master = Connection( source["host"] )

oplog = master["local"]["oplog.$main"]
lastOp = oplog.find().limit(1).sort( "ts" , DESCENDING )[0]
lastOpSeconds = lastOp["ts"][1]
print( lastOp )

diffSeconds = lastOpSeconds - lastSyncedSeconds
print( "slave is behind by: %s seconds" % diffSeconds )




