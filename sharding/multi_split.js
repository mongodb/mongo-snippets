/**
 * TO BE RUN AGAINST A SHARD DIRECTLY
 * Outputs the split commands (without issuing them) that, if executed, would bring chunk of a given shard
 * down to a given size (currently 32MB)
 *
 * @param collectionName is a non-empty collection in the current database 
 * @param mongosAddress is the "host:port" string for a mongos in the cluster
 * 
 * @example
 *   > load( "full/path/to/file/multi_split.js" )
 *   > use my_database 
 *   > db.multiSplit( "my_collection" , "a.mongos.hostname.com:27017" ) 
 *   
*/
DB.prototype.multiSplit = function( collectionName , mongosAddress ) {
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
    var cfg = null;
    try {
        cfg = connect( mongosAddress + "/config" );
    }
    catch (e) {
        print( "can't connect to " + mongosAddress );
        return;
    }
    var shardKeys = cfg.collections.findOne( { "_id": ns } , { key: 1 , _id: 0 } )["key"];
    var chunks = cfg.chunks.find( { "ns": ns } , { _id: 0 , min: 1 , max: 1 , shard:1 } ).sort({ min:1 }).toArray();

    // for now, fix chunk size to 32MB
    var desiredSizeInBytes = 32*1024*1024;

    // get the keys to split in for that size for each chunk
    chunks.forEach(
        function( chunk ) {
            print( "checking chunk " + tojson(chunk.min) + " -->> " + tojson(chunk.max) );
            var keys = db.runCommand( { splitVector: ns, keyPattern: shardKeys, min: chunk.min, max: chunk.max, maxChunkSizeBytes: desiredSizeInBytes } ).splitKeys; 

            if ( keys.length == 0 ) {
                print( "no split necessary for this shard for chunk size " + desiredSizeInBytes );
            }
            else {

                keys.forEach( 
                    function( key ) {
                        print( "db.runCommand( { split: \"" + ns + "\", middle: " + tojson(key) + " } ); " );
                    }
                )
            }

            print( "\n****************************************" );            
        }
    )
}
