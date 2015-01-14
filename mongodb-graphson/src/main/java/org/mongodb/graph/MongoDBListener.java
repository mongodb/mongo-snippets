package org.mongodb.graph;

import com.mongodb.BasicDBObject;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.DBObject;
import com.mongodb.DuplicateKeyException;
import com.mongodb.util.JSON;

public class MongoDBListener implements JSONGraphListener {
	
	private static final String ID_KEY = "_id";
	private static final BasicDBObject EDGE_INDEX_SPEC = 
			(new BasicDBObject("_Vout", 1)).append("_Vin", 1);

	private final DBCollection edgeColl;
	private final DBCollection vertexColl;
	private final DuplicateMode mode;
	
	public MongoDBListener(DB database){
		this(database, true, DuplicateMode.IGNORE, GraphSON.VERTICES, GraphSON.EDGES);
	}
		
	public MongoDBListener(DB database, boolean recreate){
		this(database, recreate, DuplicateMode.IGNORE, GraphSON.VERTICES, GraphSON.EDGES);
	}
		
	public MongoDBListener(DB database, DuplicateMode mode){
		this(database, true, mode, GraphSON.VERTICES, GraphSON.EDGES);
	}
		
	public MongoDBListener(
			DB database, boolean recreate, DuplicateMode mode, 
			String vertexCollName, String edgeCollName){
		
		this.mode = mode;
		this.edgeColl = database.getCollection(edgeCollName);
		this.vertexColl = database.getCollection(vertexCollName);
		
		if(recreate == true){
			this.edgeColl.drop();
			this.vertexColl.drop();
		}
		
		this.edgeColl.createIndex(EDGE_INDEX_SPEC);
	}

	public void addEdge(String edgeJson) {
		addElement(edgeColl, edgeJson);
	}

	public void addVertex(String vertexJson) {
		addElement(vertexColl, vertexJson);
	}

	public void close() {
		// nothing to do
	}
	
	private void addElement(DBCollection coll, String stringElement){
		
		DBObject elementObj = (DBObject)JSON.parse(stringElement);
		
		try{
			coll.insert(elementObj);
		}
		catch(DuplicateKeyException ex){
			
			// If in update mode, retry as update
			if(this.mode == DuplicateMode.UPDATE){
				Object idVal = elementObj.get(ID_KEY);
				coll.update(new BasicDBObject(ID_KEY, idVal), elementObj);
				
			// If in fail mode, rethrow
			} else if (this.mode == DuplicateMode.FAIL) {
				throw ex;
			}
			
			// At this point we ignore the insert
		}		
	}

}
