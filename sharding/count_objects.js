/**
 * Counts the number of object in each of the chunks for a given collection
 *
 * @param collectionName is a non-empty collection in the current database 
 * 
 * @example
 *   > load( "full/path/to/file/count_objects.js" )
 *   > use my_database 
 *   > db.getObjectCounts( "my_collection" )
 *   
*/
DB.prototype.getObjectCounts = function( collectionName ) {
    if ( collectionName == undefined ){
        print( "need to specify collection name" );
        return;
    }

    // no point in counting an empty collection
    var ns = this.getCollection( collectionName );
    if ( ns.findOne() == null ) {
        print( "'" + ns + "' is empty" );
        return;
    }

    // get chunk bounds and sharding key pattern, both in the config db
    var cfg = this.getSisterDB( "config" );
    var shardKeys = cfg.collections.findOne( { "_id": ns } , { key: 1 , _id: 0 } )["key"];
    var chunks = cfg.chunks.find( { "ns": ns } , { _id: 0 , min: 1 , max: 1 , shard:1 } ).sort({ min:1 }).toArray();

    // get the object count for each chunk
    chunks.forEach(
        function( chunk ) {
            // each count can take some time (seconds) so print chunk bounds before issuing the command
            print( "counting " + tojson(chunk.min) + " -->> " + tojson(chunk.max) );
            chunk["count"] = ns.find( {} , shardKeys ).min(chunk.min).max(chunk.max).explain().n;
        }
    )

    // sort count descending
    chunks.sort(
        function( a , b ) {
            return b.count - a.count;
        }
    )
    
    print( "\n****************************************" );
    chunks.forEach(
        function( chunk ) {
            print( chunk.count + "\t" + tojson(chunk.min) + " -->> " + tojson(chunk.max) );
        }
    )            

    print( "\n****************************************" );
    print( "\tto split a chunk manually:" );
    print( "\t> use admin" );
    print( "\t> db.runCommand( { split : \"" + ns + "\" , find : " + tojson( chunks[0].min ) + " } )" );
    print( );

    return { chunks : chunks , 
             fix : function( minSize , reallyRun ) { 
                 if ( ! minSize )
                     throw "need minSize arg to fix";

                 for ( var i=0; i<chunks.length; i++ ) {
                     if ( chunks[i].count < minSize )
                         continue;
                     
                     print( "\t db.runCommand( { split : \"" + ns + "\" , find : " + tojson( chunks[i].min ) + " } ); // count: " + chunks[i].count );
                     if ( reallyRun ) {
                         printjson( db.getSisterDB( "admin" ).runCommand( { split : ns  , find : chunks[i].min } ) )
                         sleep( 500 );
                     }
                 }
             } , 
             shellPrint : function(){ return ""; } 
           };
}
