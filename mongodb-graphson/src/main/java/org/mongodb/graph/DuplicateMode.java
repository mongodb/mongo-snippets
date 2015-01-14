package org.mongodb.graph;

/** 
 * Mode use for when duplicate ID's during import
 * When edge and vertex data contains elements with the same
 * _id value or newly imported elements have duplicate id
 */
public enum DuplicateMode {
	
	/** 
	 * If a duplicate element is added, it will be dropped and
	 * ignored, the original element will remain in place and
	 * the import continues. This is the default mode.
	 */
	IGNORE,
	
	/**
	 * If a duplicate is detected, it will not be added to the graph
	 * and the import will fail at that point.
	 */
	FAIL,
	
	/** 
	 * If a duplicate is detected, it will replace the current element
	 * with the conflicting _id value.
	 */
	UPDATE

}
