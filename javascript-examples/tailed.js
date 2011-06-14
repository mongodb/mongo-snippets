var coll = db.some.collection;
var lastVal = coll.find().sort({ '$natural' : 1 })
                         .limit( 1 ).next()[ 'increasing' ];
while(1){

  cursor = coll.find({ 'increasing' : { '$gte' : lastVal } });

  // tailable
  cursor.addOption( 2 );
  // await data
  cursor.addOption( 32 );

  // Waits ~2s for more data
  while( cursor.hasNext() ){
    var doc = cursor.next();
    lastVal = doc[ 'increasing' ];
    printjson( doc );
  }

}

