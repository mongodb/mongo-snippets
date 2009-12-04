
# this computes and prints how far behind a slave is from a master

from pymongo.connection import Connection
from pymongo import ASCENDING, DESCENDING

master = Connection( "localhost" , 27017 )
slave = Connection( "localhost" , 9999 , slave_okay=True )

oplog = master["local"]["oplog.$main"]
lastOp = oplog.find().limit(1).sort( "ts" , DESCENDING )[0]
lastOpSeconds = lastOp["ts"][1]
#print( lastOp )
#print( lastOpSeconds )

source = slave["local"]["sources"].find_one()
lastSyncedSeconds = source["syncedTo"][1]
#print( source )
#print( lastSyncedSeconds )

diffSeconds = lastOpSeconds - lastSyncedSeconds
print( "slave is behind by: %s seconds" % diffSeconds )




