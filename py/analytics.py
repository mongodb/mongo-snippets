# doing real time couting with pymongo

from pymongo.connection import Connection
import datetime

def now( cur = datetime.datetime.utcnow() ):
    return cur.replace(minute=cur.minute - cur.minute % 1, second=0, microsecond=0 )

connection = Connection()
db = connection["analytics_sample"]
db.drop_collection( "my_analytics" )

db.my_analytics.update( { "time" : now() , "page" : "/" } , { "$inc" : { "count" : 1 } } , upsert=True )
db.my_analytics.update( { "time" : now() , "page" : "/" } , { "$inc" : { "count" : 1 } } , upsert=True )

print( db.my_analytics.find_one() )
print( db.my_analytics.count() )
