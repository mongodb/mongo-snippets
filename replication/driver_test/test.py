import sys

from pymongo import Connection
from pymongo.errors import AutoReconnect

host = sys.argv[1]
connection = Connection(host)

for node in connection.nodes:
    print "%s:%d" % node

db = connection.replset
x = 0
while(x < 5):
    try:
        x = db.test.find_one()["a"]
        print x
    except AutoReconnect:
        print "E"

