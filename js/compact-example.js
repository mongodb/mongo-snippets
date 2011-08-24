// assumption is we are primary

assert( rs.isMaster().setName, "not a repl set" );  // assuming this is a repl set
assert( rs.isMaster().ismaster, "we are not primary and we were assuming that");

// we want to compact, but in the background

// so step down...
try {
    rs.stepDown();
} catch(e) { 
    print("exception:" + e);
}

// after stepdown connections are dropped. do an operation to cause reconnect:
rs.isMaster();

// now ready to go.  

// wait for another node to become primary -- it may need data from us for the last 
// small sliver of time, and if we are already compacting it cannot get it while the 
// compaction is running.

while( 1 ) { 
    var m = rs.isMaster();
    if( m.ismaster ) {
        print("ERROR: no one took over during our stepDown duration. we are primary again!");
	assert(false);
    }
    if( m.primary )
        break; // someone else is, great
    print("waiting");
    sleep(1000);
}

// someone else is primary, so we are ready to proceed with a compaction
print("Compacting...");
printjson( db.runCommand({compact:"mycollection",dev:true}) );
