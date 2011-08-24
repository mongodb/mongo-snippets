// commit latency test 
// run mongod with --journal parameter
// then run this script on the command line of the mongo shell (mongo)
// NOTE: this test is for v1.9.  this test is for dev testing and subject
//       to change this parameter may not be permanent.

function time(f) {
 var s = new Date();
 f();
 print((new Date())-s);
}

t = db.foo;

printjson( db.adminCommand({setParameter:1,groupCommitIntervalMs:90}) );

for( pass = 0 ; pass < 2; pass++ ) {

 print("PASS " + pass);

 for( var i = 0; i < 20; i++ ) {

  time( function() {
    t.insert({});
    db.runCommand({getLastError:1, j:true});
   });

 }

 printjson( db.adminCommand({setParameter:1,groupCommitIntervalMs:5}) );

}
