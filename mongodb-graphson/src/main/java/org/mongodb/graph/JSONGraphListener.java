package org.mongodb.graph;

/**
 * Listener interface for pushing graph elements in JSON format
 * to a repository. Implementations transform and insert graph
 * into an underlying data store.
 * 
 */
public interface JSONGraphListener {
	
	/**
	 * Add edge to the graph
	 * @param edgeJson JSON formatted edge representation
	 */
	void addEdge(String edgeJson);
	
	/**
	 * Add vertex to the graph
	 * @param vertexJson JSON formatted vertex representation
	 */
	void addVertex(String vertexJson);
	
	/**
	 * Close the listener. Implementations should flush any buffered
	 * elements and close repository.
	 */
	void close();
}
