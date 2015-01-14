package org.mongodb.graph;

import static org.junit.Assert.*;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.net.URL;

import org.junit.Before;
import org.junit.Test;

import com.mongodb.BasicDBObject;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.DBObject;
import com.mongodb.MongoClient;
import com.mongodb.MongoClientURI;

public class GraphSONImportTest {
	private static final String EDGE_COLL_NAME = "edges"; 
	private static final String VERTEX_COLL_NAME = "vertices"; 
	private static final String BASE_URI = "mongodb://localhost/";
	private static final String DATABASE_NAME = 
			GraphSONImportTest.class.getSimpleName();
    
    protected DB database;
    protected DBCollection edges;
    protected DBCollection vertices;
    
    @Before
    public void setUp() throws Exception {
        
    	MongoClientURI uri = new MongoClientURI(BASE_URI + DATABASE_NAME);
    	MongoClient client = new MongoClient(uri);
    	database = client.getDB(DATABASE_NAME);	
		edges = database.getCollection(EDGE_COLL_NAME);
		vertices = database.getCollection(VERTEX_COLL_NAME);  	
    	database.dropDatabase();
    }
    
    @Test
    public void testSimpleGraphSONImport() throws FileNotFoundException, IOException{
    	// Open the test input file as a stream
    	importGraphSONResource("/simple-graph.json", true);
        
    	// Check the stats of the mongodb graph
    	assertEquals(6, vertices.count());
    	assertEquals(6, edges.count());
    	assertEquals(2, edges.find(findEdgesByOutV(1)).itcount());
    	assertEquals("called", edges.findOne(findEdgesByOutV(2)).get("_label"));    	
    }
    
    @Test
    public void testEmbeddedGraphSONImport() throws FileNotFoundException, IOException{
    	// Open the test input file as a stream
    	importGraphSONResource("/embedded-graph.json", true);
        
    	// Check the stats of the mongodb graph
    	assertEquals(6, vertices.count());
    	assertEquals(6, edges.count());
    	assertEquals(2, edges.find(findEdgesByOutV(1)).itcount());
    	assertEquals("called", edges.findOne(findEdgesByOutV(2)).get("_label"));    	
    }
    
    @Test
    public void testDuplicateIgnore() throws FileNotFoundException, IOException{
    	// Open the test input file as a stream
    	importGraphSONResource("/simple-graph.json", true);
    	importGraphSONResource("/embedded-graph.json", false);
        
    	// Check the stats of the mongodb graph
    	assertEquals(6, vertices.count());
    	assertEquals(6, edges.count());
    	assertEquals(2, edges.find(findEdgesByOutV(1)).itcount());
    	assertEquals("called", edges.findOne(findEdgesByOutV(2)).get("_label"));    	
    }
    
    @Test
    public void testExtendGraph() throws FileNotFoundException, IOException{
    	// Open the test input file as a stream
    	importGraphSONResource("/simple-graph.json", true);
    	importGraphSONResource("/extended-graph.json", false);
        
    	// Check the stats of the mongodb graph
    	assertEquals(6, vertices.count());
    	assertEquals(7, edges.count());
    	assertEquals(2, edges.find(findEdgesByOutV(1)).itcount());
    	assertEquals(1, edges.find(findEdgesByOutV(3)).itcount());
    	assertEquals("called", edges.findOne(findEdgesByOutV(2)).get("_label"));    	
    }
    
    @Test
    public void testDuplicateUpdate() throws FileNotFoundException, IOException{
    	// Open the test input file as a stream
    	importGraphSONResource("/simple-graph.json", true);
    	importGraphSONResource("/modified-graph.json", false, DuplicateMode.UPDATE);
        
    	// Check the stats of the mongodb graph
    	assertEquals(6, vertices.count());
    	assertEquals(6, edges.count());
    	assertEquals(3, edges.find(findEdgesByOutV(1)).itcount());
    	assertEquals(1, edges.find(findEdgesByOutV(4)).itcount());
    	assertEquals("called", edges.findOne(findEdgesByOutV(2)).get("_label"));    	
    }
    
    @Test(expected=com.mongodb.MongoException.DuplicateKey.class)
    public void testDuplicateFail() throws FileNotFoundException, IOException{
    	// Open the test input file as a stream
    	importGraphSONResource("/simple-graph.json", true);
    	importGraphSONResource("/modified-graph.json", false, DuplicateMode.FAIL);        
    }
    
    private DBObject findEdgesByOutV(Object outV){
    	return new BasicDBObject("_outV", outV);
    }

    
    private void importGraphSONResource(String resource, boolean recreate) 
    		throws FileNotFoundException, IOException{
    	importGraphSONResource(resource, recreate, DuplicateMode.IGNORE);
    }
    
    private void importGraphSONResource(String resource, boolean recreate, DuplicateMode dupMode) 
    		throws FileNotFoundException, IOException{
    	// Open the test input file as a stream
        URL url = this.getClass().getResource(resource);
        File testJson = new File(url.getFile());
    	
    	// Create the graph listener for the mongodb database
    	MongoDBListener listener = new MongoDBListener(database, recreate, 
    			dupMode, GraphSON.VERTICES, GraphSON.EDGES);
    	GraphSONReader reader = new GraphSONReader(listener);
    	reader.readGraph(new FileInputStream(testJson));
    	listener.close();
    }

}
