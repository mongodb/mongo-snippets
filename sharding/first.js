/*
Example of using MongoDB auto-sharding.

Note: This example works with MongoDB v1.1+.  Some command names have changed from <1.1.

First start the three servers (we use the first shard server as the config db, dual duty, in this example):

mkdir /data/db/a
mkdir /data/db/b
# shard/server a:
./mongod --port 9999 --dbpath /data/db/a
# shard/server b
./mongod --port 9998 --dbpath /data/db/b
# a mongos shard process (defaults to listening on standard port 27017)
./mongos --configdb localhost:9999

Then, run this script:
  ./mongo shard_example1.js

*/

// lets start playing with the test database
db = db.getSisterDB( "test" );

// the config database can be accessed like any other database
config = db.getSisterDB( "config" ); 
admin = db.getSisterDB( "admin" ); 

// tell the shard system about the 2 servers
printjson( admin.runCommand( { addshard : "localhost:9998" , allowLocal : true } ) )
printjson( admin.runCommand( { addshard : "localhost:9999" , allowLocal : true } ) )

// try to use the database normally
db.people.save( { name : "eliot" , email : "someone@foo.com" } )
print( "should have 1 nice record:\n" + tojson( db.people.findOne() ) )

print( "the 'test' database info from config.databases:\n" + tojson( config.databases.findOne( { name : "test" } ) ) );

// now let create a table called data and puts lots of data in it
// first, lets tell the system that we want to shard it

// first step is to turn on partitioning for the database:
print( "partition result : " + tojson( admin.runCommand( { enablesharding : "test" } ) ) );

// then we can shard the data collection on 'num'
print( "shard result : " + tojson( admin.runCommand( { shardcollection : "test.data" , key : { num : 1 } } ) ) );

// we want a lot of data, so lets make a 50k string to cheat :)
bigString = "";
while ( bigString.length < 50000 )
    bigString += "this is a big string. ";

print( "my big string is: " + bigString.length + " characters long" );

// ok, now lets insert a some data
var num = 0;
for ( ; num<100; num++ ){
    db.data.save( { num : num , bigString : bigString } );
}

// lets verify we have 100 things:
print( "should have 100 things, do we: " + db.data.find().toArray().length );
print( "what does the shard info look like: \n" + tojson(config.chunks.find().toArray()) );
print( "we only have one shard, right: " + config.chunks.find().length() );

// now lets put a lot more data in
print( "loading lots of data in" );
for ( ; num<5000; num++ ){
    db.data.save( { num : num , bigString : bigString } );
}

print( "now we have " + config.chunks.find().length() + " shards! " );
print( "lets look at them : " + tojson(config.chunks.find().toArray()) );
