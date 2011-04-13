// benchmark many collections vs. 1
//

// you want to do this, but be careful so commented out!:
//  db.dropDatabase();

t = db.abc;

function time(f) { 
	var s = new Date();
	f();
	print("time: " + ((new Date())-s));
}

function a() {
	for( var i = 0; i < 2000000; i++ ) {
        /* // this version changes collections every 1000 docs.  as the shell is the bottleneck
		   // we are trying here to limit calls to getCollection() and the string build.
		   // time: 199
		   if( i % 1000 == 0 ) { 
			t = db.getCollection("tst." + (i/1000)%1000);
        }*/

		/* this version switches collection every record. time: 135 */
		t = db.getCollection("tst." + i%1000);

		/* to use one colleciton, comment out both of the above. time:128 */
		
		t.insert({i:i});
        if( i % 100000 == 0 ) {
            print(i);
            print(new Date());
		}
	}
	printjson( db.getLastErrorObj() );
}

time(a);

