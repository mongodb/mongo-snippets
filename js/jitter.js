/* jitter.js

   This file is a simple test of latency to the database server.
   Run it on the same box (localhost) to verify the speed of the database process.
   Run it remotely to check end to end latency including network effects.

   Note: the shell is javascript and could be slow. Keep that in mind.  There may also 
         be garbage collections by the shell.  If the shell has been running for a very 
	 long time and you see slow times, a quick restart is recommended just to confirm
	 that the server is slow and not the shell.
 
   Usage:
    
     mongo <usualparms> jitter.js     

     Set the coll and query variables below.
*/

// choose a collection:
var coll = "foo";
// choose a query:
var query = { x : 1 };

var t = db[coll];

function time(f) {
    var s = new Date();
    f();
    return new Date()-s;
}

var basecase = {};
var querycase = {};

function reset(x) {
    x.max = 0; 
    x.n = 0;
    x.t = 0;
    x.min = 100000;
}

function say(res) { 
    print(Date() + '  ' + res.min + ' / ' + Math.round(100*res.t/res.n)/100 + ' / ' + res.max);
}

function test(query, result) { 
    var ms = time( function() { t.findOne(query) } );
    if( ms < result.min ) result.min = ms;
    if( ms > result.max ) result.max = ms;
    result.n++;
    result.t += ms;
}

while( 1 ) { 
    reset(basecase);
    reset(querycase);
    try { 
	for( var i = 0; i < 500; i++ ) { 
	    test({}, basecase);
	    test(query, querycase);
	    sleep(10);
	}
	say(basecase); say(querycase);
	print();
    } 
    catch(e) { 
	print();
	print(Date() + " exception during query: " + e);
	print();
	sleep(5000);
    }
    sleep(100);
}
