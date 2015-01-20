package org.mongodb.graph;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.MappingJsonFactory;

import java.io.IOException;
import java.io.InputStream;

public class GraphSONReader {
	private static final JsonFactory jsonFactory = new MappingJsonFactory();
	private final JSONGraphListener listener;

	public GraphSONReader(final JSONGraphListener listener) {
		this.listener = listener;
	}

	public void readGraph(final InputStream graphStream) throws IOException {

		final JsonParser jp = jsonFactory.createParser(graphStream);
		JsonToken current = jp.nextToken();
		processGraphDocument(jp, current);
		jp.close();

	}

	private void processGraphDocument(final JsonParser jp, JsonToken current) throws IOException{
		if (current != JsonToken.START_OBJECT) {
			throw new IOException("GraphSON error : root should be object");
		}
		while (jp.nextToken() != JsonToken.END_OBJECT) {
			String fieldName = jp.getCurrentName();
			// move from field name to field value
			current = jp.nextToken();
			if (fieldName.equals(GraphSON.VERTICES)) {
				if (current == JsonToken.START_ARRAY) {
					// For each of the records in the array
					while (jp.nextToken() != JsonToken.END_ARRAY) {
						JsonNode node = jp.readValueAsTree();
						String vertexJson = node.toString();
						this.listener.addVertex(vertexJson);
					}
				} else {
					System.err.println("GraphSON error : ignoring vertices, not an array");
					jp.skipChildren();
				}
			} else if(fieldName.equals(GraphSON.EDGES)) {
				if (current == JsonToken.START_ARRAY) {
					// For each of the records in the array
					while (jp.nextToken() != JsonToken.END_ARRAY) {
						JsonNode node = jp.readValueAsTree();
						String edgeJson = node.toString();
						this.listener.addEdge(edgeJson);
					}
				} else {
					System.err.println("GraphSON error : ignoring edges, not an array");
					jp.skipChildren();
				}
			} else if(fieldName.equals(GraphSON.GRAPH)) {
				// embedded graph element, recursively process
				processGraphDocument(jp, current);
			} else {
				System.err.println("Skipping unrecognized property : " + fieldName);
				jp.skipChildren();
			}
		}                    	
	}
}
