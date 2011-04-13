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
