package org.mongodb.graph;

import static org.junit.Assert.*;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;

import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

import com.mongodb.BasicDBObject;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.DBObject;
import com.mongodb.MongoClient;
import com.mongodb.MongoClientURI;
import com.mongodb.util.JSON;

public class GraphSONExportTest {
	private static final String BASE_URI = "mongodb://localhost/";
	private static final String DATABASE_NAME = 
			GraphSONExportTest.class.getSimpleName();
    
    protected DB database;
    protected DBCollection edges;
    protected DBCollection vertices;
    
    @Before
    public void setUp() throws Exception {
        
    	MongoClientURI uri = new MongoClientURI(BASE_URI + DATABASE_NAME);
    	MongoClient client = new MongoClient(uri);
    	database = client.getDB(DATABASE_NAME);	
		edges = database.getCollection(GraphSON.EDGES);
		vertices = database.getCollection(GraphSON.VERTICES);  	
    	database.dropDatabase();
    }
    
    @Rule public TemporaryFolder temp = new TemporaryFolder();
    @Test
    public void testSimpleGraphSONExport() throws FileNotFoundException, IOException{
    	
    	// Create a database with a small simple graph
    	DBObject bob = (DBObject)JSON.parse("{\"name\":\"bob\",\"age\":34,\"_id\":1,\"_type\":\"person\"}");
    	vertices.insert(bob);
    	DBObject sam = (DBObject)JSON.parse("{\"name\":\"sam\",\"age\":34,\"_id\":2,\"_type\":\"person\"}");
    	vertices.insert(sam);
    	DBObject edge = (DBObject)JSON.parse("{\"weight\":0.2,\"_id\":1,\"_type\":\"edge\",\"_outV\":1,\"_inV\":2,\"_label\":\"emailed\"}");
    	edges.insert(edge);
    	
    	// Export this graph to a file
    	GraphSONWriter writer = new GraphSONWriter(database);
    	File tempFile = temp.newFile("test");
    	OutputStream testOut = new FileOutputStream(tempFile);
    	writer.writeGraph(testOut);
    	testOut.close();
    	
    	// Turn this around and import it
		String readEdgesName = "read" + GraphSON.EDGES;
		String readVerticesName = "read" + GraphSON.VERTICES;  
		DBCollection readEdgesColl = database.getCollection(readEdgesName);
		DBCollection readVerticesColl = database.getCollection(readVerticesName);  
		
    	MongoDBListener listener = new MongoDBListener(database, true, 
    			DuplicateMode.FAIL, readVerticesName, readEdgesName);
    	GraphSONReader reader = new GraphSONReader(listener);
    	reader.readGraph(new FileInputStream(tempFile));
    	listener.close();
    	
    	// Compare the original collections
    	assertEquals(1, readEdgesColl.count());
    	assertEquals(2, readVerticesColl.count());
    	
    	assertEquals(edge, readEdgesColl.findOne());
    	assertEquals(bob, readVerticesColl.findOne(new BasicDBObject("_id", 1)));
    	assertEquals(sam, readVerticesColl.findOne(new BasicDBObject("_id", 2)));    	
    }
    
}
