/* insert_speed_test.js
   This test checks speed of very simple bulk inserts from mongos to the database.

   To run:
     mongo insert_speed_test.js
   or
     mongo --shell insert_speed_test.js
   to stay interactive.
*/

// approx object size we want for the inserted objects.
osz = 8000;

// how many objects to insert
N = 40000;


t = db.foo;
t.drop();

var x = "";
for( var i = 0; i < osz; i++ ) x = x + 'z';
str = x;
o = { x : 1, y : 2, z : str};

start= new Date();

for( i = 0; i < N; i++ ) {
    o.y = i;
    t.insert(o);
}

print( t.count() );

end = new Date();

s = t.stats();
printjson( s );

print("");
print("n inserts = " + N);
print("time = " + (end-start));
wps = i/(end-start)*1000;
print("per sec = " + wps);
print("approx MB/sec = " + (wps*s.avgObjSize/1000000));
