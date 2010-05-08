/* test the latency of master/slave connection */

/* 
   master db is assumed to be localhost:27017

   example:
   
      mongod --dbpath /data/a --master
      mongod --dbpath /data/b --port 27000 --slave --source localhost:27017
      mongo localhost:27000 test_latency.js
*/

slave = db;
assert(!slave.runCommand("ismaster").ismaster);
print("slave ok");

master = new Mongo("localhost").getDB("test");
assert( master.runCommand("ismaster").ismaster );
print("master ok");

T = master.foo;
t = slave.foo;

T.drop();

// returns millis
function time(f) {
    var start = new Date();
    f();
    return (new Date()) - start;
}

function ptime(f) {
    print("" + time(f) + "ms");
}

obj = { y: 1 };

function latencytest() {
    obj.y++;
    T.save(obj);
    while (1) {
        slaveobj = t.findOne();
        if (slaveobj && slaveobj.y == obj.y)
            break;
        sleep(2); // wait 2 ms
    }
}

function run() {
    while (1) {
        ptime(latencytest);
        sleep(1000);
    }
}

print();
print("try running:");
print(" ptime( function(){T.findOne()} )");
print(" ptime( function(){t.findOne()} )");
print(" run()");
print();
