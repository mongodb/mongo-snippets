EDGES_LABEL     = "edges";
VERTICES_LABEL  = "vertices";

print("{\n  \"" + EDGES_LABEL + "\" : [");

current = null;
db.edges.find().forEach(function(doc){
    if(current != null){ print("    " + JSON.stringify(current) + ","); }
    current = doc;
    
});

print("    " + JSON.stringify(current));
print("\n  ],\n  \"" + VERTICES_LABEL + "\" : [");
current = null;

db.vertices.find().forEach(function(doc){
    if(current != null){ print("    " + JSON.stringify(current) + ","); }
    current = doc;
});

print("    " + JSON.stringify(current));
print("\n  ]\n}");

