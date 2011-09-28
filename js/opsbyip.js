print("opsbyip.js");
print("usage:");
print("mongo --shell <otheroptions> opsbyip.js");
print("> ops() // to see # of ops in progress by client ip address");
print("> ops(true) // to include inactive ops in the report");
print("> ops // with no parens to see the function's implementation");

function ops(includeinactive) {
    var c = db.currentOp().inprog;

    var res = {};

    for( i in c ) {
      var op = c[i];
      if( op.active || includeinactive ) {
        var ip = op.client.split(':')[0];
        if( !res[ip] )
          res[ip] = 0;
        res[ip]++;
      }
    }

    printjson(res);
}
