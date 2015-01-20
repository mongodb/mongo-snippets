package org.mongodb.graph;

import java.io.IOException;
import java.io.OutputStream;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.util.DefaultPrettyPrinter;
import com.fasterxml.jackson.databind.MappingJsonFactory;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;

public class GraphSONWriter {
	
	private static final JsonFactory jsonFactory = new MappingJsonFactory();

	private final DBCollection edgeColl;
	private final DBCollection vertexColl;
	
	public GraphSONWriter(DB database){
		this(database, GraphSON.VERTICES, GraphSON.EDGES);
	}
	
	public GraphSONWriter(DB database, String vertexCollName, String edgeCollName){
		this.vertexColl = database.getCollection(vertexCollName);
		this.edgeColl = database.getCollection(edgeCollName);
	}
	
	public void writeGraph(final OutputStream target) throws IOException {

		final JsonGenerator generator = jsonFactory.createGenerator(target);
		
		// Start the object and add a graph object
		generator.setPrettyPrinter(new DefaultPrettyPrinter());
		generator.writeStartObject();
		generator.writeObjectFieldStart(GraphSON.GRAPH);
		
		// Use the vertices collection to generator array
		generator.writeArrayFieldStart(GraphSON.VERTICES);
		writeCollectionToArray(generator, vertexColl);		
		generator.writeEndArray();
		
		// Use the edges collection to generator array
		generator.writeArrayFieldStart(GraphSON.EDGES);
		writeCollectionToArray(generator, edgeColl);		
		generator.writeEndArray();

		// End graph and root objects, then close
		generator.writeEndObject();
		generator.writeEndObject();
		generator.close();
	}
	
	private static void writeCollectionToArray(
			JsonGenerator target, DBCollection source) 
					throws IOException{
		
		DBCursor cursor = null;
		try{
			cursor = source.find();
			for(DBObject document : cursor){
				target.writeObject(document);
			}
			
		} finally {
			if(cursor != null) cursor.close();
		}
	}
	
}
