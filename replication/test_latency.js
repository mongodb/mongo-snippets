/* test the latency of master/slave connection */

/* 
   master db is assumed to be localhost:27017

   example:
   
      mongod --dbpath /data/a --master
      mongod --dbpath /data/b --port 27000 --slave --source localhost:27017
      mongo localhost:27000 test_latency.js
*/

slave = db;
if (slave.runCommand("ismaster").ismaster) {
    print("db from command line should be the slave -- and it isn't -- see comments in this .js file. exiting");
    quit();
}
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
        sleep(1);
    }
}

function run() {
    while (1) {
        ptime(latencytest);
        sleep(1000);
    }
}

print();
print("try running these:");
print(" ptime( function(){T.findOne()} ) // should be quick as hits only 1 server");
print(" ptime( function(){t.findOne()} ) // should be quick");
print(" run() // takes a little time awaits full replication");
print();
