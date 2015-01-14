EDGES_LABEL     = "edges";
VERTICES_LABEL  = "vertices";
SOURCE_LABEL    = "_outV";
DEST_LABEL      = "_inV";

// Open file and parse it as JSON
var fileIn = JSON.parse(cat(fileName)); 

if(fileIn != null){

    // If recreating, drop collections and add edge index
    if(typeof recreate == "boolean" && recreate == true){
        print("Recreating graph collections...");
        db.vertices.drop();
        db.edges.drop();
        db.edges.ensureIndex({SOURCE_LABEL : 1, DEST_LABEL : 1});
    }

    // Iterate over edges adding to the edge collection
    print("Inserting " + fileIn.edges.length + " edges...");
    fileIn[EDGES_LABEL].forEach(function (edge) {
        db.edges.insert(edge); 
    })

    // Iterate over vertices adding the vertex collection
    print("Inserting " + fileIn.vertices.length + " vertices...");
    fileIn[VERTICES_LABEL].forEach(function (vertex) {
        db.vertices.insert(vertex);
    })
}



