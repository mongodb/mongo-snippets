// replica set replication speed test
// does inserts and updates and outputs the time for each and the time to replicate
//
// suggested way to run:
//   ./mongo --nodb replsetspeed.js | tee out | grep speedt
//

var last = 0;

function prt(s) { 
    print("speedtest " + Date() + ' ' + s);
    last = new Date();
}

function elapsed(s) {
    prt(s + " elapsed " + (new Date() - last));
}

doTest = function( signal ) {

    var replTest = new ReplSetTest( {name: 'speedrs', nodes: 2, oplogSize:900} );
    var nodes = replTest.nodeList();

    print(tojson(nodes));

    var conns = replTest.startSet();
    var r = replTest.initiate({"_id" : "speedrs", 
                "members" : [
                             {"_id" : 0, "host" : nodes[0]/*, votes:2*/ },
                             {"_id" : 1, "host" : nodes[1], priority:0 } // secondary
                            ] } );

    var master = replTest.getMaster();

    // Wait for initial replication
    var t = master.getDB("foo").foo;
    t.insert({a: "foo"});

    prt("AWAIT 1");

    replTest.awaitReplication();

    prt("insert");

    var o = { _id : 0, a : 3, b : "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", c : [1,2,3], d : "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" };

    var N = 50000;

    for( var i = 0; i < N; i++ ) {
	o._id = i;
	t.insert(o);
    }
    var mc = t.count();
    elapsed("insert");

    prt("insert await replication");
    replTest.awaitReplication();
    elapsed("insert await replication");

    var secondary = conns[1].getDB("foo");
    secondary.getMongo().setSlaveOk();
    print( secondary.foo.count() );
    assert( secondary.foo.count() == mc );

    prt("updates");
    var vset = { $set : { a : 999 } };
    for( var i = 0; i < N; i++ ) {
	t.update({_id:i},vset);
    }
    mc = t.count();
    elapsed("update");

    prt("update await");
    replTest.awaitReplication();
    elapsed("update await");

    //assert( ! conns[1].getDB( "admin" ).runCommand( "ismaster" ).secondary , "arbiter shouldn't be secondary" )

    prt("STOPPING");

    replTest.stopSet( signal );

    prt("OK");
}

doTest( 15 );
