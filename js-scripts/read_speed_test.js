/* 
   To run:
     mongo read_speed_test.js

*/

t = db.foo;

N = db.foo.count();

print(N);

start= new Date();

for( i = 0; i < N; i++ ) {
    if( i % 2000 == 0 )
	print(i);
    t.find({y:i}, {_id:1}); // just get _id to keep small otherwise shell slows us down a lot
}

print( t.count() );

end = new Date();

s = t.stats();
printjson( s );

print("");
print("n = " + N);
print("time = " + (end-start));
wps = i/(end-start)*1000;
print("per sec = " + wps);
