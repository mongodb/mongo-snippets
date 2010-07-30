var replTest = new ReplSetTest( {name: 'testSet', nodes: 3} );
var nodes = replTest.startSet();
replTest.initiate();

var live_nodes = replTest.liveNodes;

var master = replTest.getMaster();

// Just be sure replication is up and running
master.getDB("replset").test.drop();
master.getDB("replset").test.save({a: new NumberLong(0)});
replTest.awaitReplication();

function send_line(line) {
    print("MAGIC" + line);
}

// Send some basic info
send_line(replTest.ports.length);
replTest.ports.forEach(function(port) {
    send_line(getHostName() + ":" + port);
});

function fail_over() {
    sleep(2000);
    var master_id = replTest.getNodeId( master );
    replTest.stop( master_id );
    master = replTest.getMaster();
    master.getDB("replset").test.update({}, {$inc: {a: new NumberLong(1)}});
    send_line("failed over");
    sleep(2000);
    send_line("restarting killed node");
    replTest.restart( master_id );
}

for (var x = 0; x < 5; x++) {
    fail_over();
}
replTest.stopSet();
