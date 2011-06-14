/**
 *
 * Compile with javac -cp <mongo-java-client-jar> Test.java 
 *
 */

import com.mongodb.*;

/**
 * Assumes a replica set is available for connections.  On your local machine, this can be
 * started from the shell with:
 *
 * ~/mongo --nodb
 * > var rst = new ReplSetTest({ nodes : 3 })
 * > rst.startSet() // Wait for startup
 * > rst.initiate() // Wait for initialization
 *
 * You may then test failover with: 
 *
 * PRIMARY|SECONDARY> rst.stop( 2 ) // assumes 0 is primary
 * PRIMARY|SECONDARY> rst.stop( 1 )
 * PRIMARY|SECONDARY> rst.stop( 0 )
 *
 */
public class Test {

    public static void main(final String [] pArgs) throws Exception {

	// Default mongo connection
        final Mongo mongo = new Mongo(new MongoURI("mongodb://127.0.0.1:31000,127.0.0.1:31001,127.0.0.1:31002"));
        // mongo.setWriteConcern( WriteConcern.NORMAL ); // Default!
        
	// Mongo connection which validates writes have occurred
        final Mongo mongoSafe = new Mongo(new MongoURI("mongodb://127.0.0.1:31000,127.0.0.1:31001,127.0.0.1:31002"));
        mongoSafe.setWriteConcern( WriteConcern.SAFE );
        
	// Mongo connection which validates writes have occurred in two places
        final Mongo mongoStrict = new Mongo(new MongoURI("mongodb://127.0.0.1:31000,127.0.0.1:31001,127.0.0.1:31002"));
        mongoStrict.setWriteConcern( WriteConcern.REPLICAS_SAFE );
        
	// Mongo connection which reads from secondaries when possible
        final Mongo mongoSOK = new Mongo(new MongoURI("mongodb://127.0.0.1:31000,127.0.0.1:31001,127.0.0.1:31002"));
        // mongoSOK.setWriteConcern( WriteConcern.NORMAL ); // Default!
        mongoSOK.slaveOk();

        final DBCollection coll = mongo.getDB("test").getCollection("testSystem");
        final DBCollection collSOK = mongoSOK.getDB("test").getCollection("testSystem");
        final DBCollection collSafe = mongoSafe.getDB("test").getCollection("testSystem");
        final DBCollection collStrict = mongoStrict.getDB("test").getCollection("testSystem");

        while (true) {

            try {
            	
                final BasicDBObject test = new BasicDBObject("test", "name");
                
                // Does not verify write by default! Fire-and-forget
                coll.insert(test);
                
                System.out.println( "May have wrote to primary!" );
                                
                Thread.sleep(3000);
                
            }
            catch( MongoException e ){
        		// When everything goes down
            	System.out.println( "Could not communicate with replica set!" );
            	e.printStackTrace();
        	}
            
            
            try {

                final BasicDBObject test = new BasicDBObject("test", "name");
                
                // Verifies write!
                collSafe.insert(test);
                
                System.out.println( "Wrote to primary!" );
                                
                Thread.sleep(3000);
                
            }
            catch( MongoException e ){
            	// When the primary goes down
            	System.out.println( "Could not write to primary!" );
            	e.printStackTrace();
            }
                        
            try {
            	
            	// Reads from primary, so will error when primary down
                DBCursor cursor = coll.find( new BasicDBObject() );
                if( cursor.hasNext() ){
                	DBObject obj = cursor.next();
                }
                cursor.close();
                
                System.out.println( "Read from primary!" );
                
                Thread.sleep(3000);

            }
            catch( MongoException e ){
            	// When the primary goes down
            	System.out.println( "Could not read from primary!" );
            	e.printStackTrace();
            }
            
            try {
            	
            	// Read from primary or secondary
                DBCursor cursor = collSOK.find( new BasicDBObject() );
                if( cursor.hasNext() ){
                	DBObject obj = cursor.next();
                }
                cursor.close();

                System.out.println( "Read from secondary or primary!" );
                
                Thread.sleep(3000);

            }
            catch( MongoException e ){
            	// Shouldn't happen so long as at least one server is up.
            	System.out.println( "Could not read from anywhere!" );
            	e.printStackTrace();
            }
            
            try {
            	
            	// Write to primary and at least one secondary
                final BasicDBObject test = new BasicDBObject("test", "name");

                collStrict.insert(test);
                
                System.out.println( "Wrote to primary and replicated to one other!" );
                
                Thread.sleep(3000);
                
            }
            catch( MongoException e ){
            	// When both secondaries go down
            	System.out.println( "Could not write to primary and replicate to one other!" );
            	e.printStackTrace();
            }
            
        }
        
    }


}
