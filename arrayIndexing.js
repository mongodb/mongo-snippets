// arrayIndexing.js

/*
* this shows how you can index on an embdedded field in an array
*/

db.user.drop();

db.user.save( { name : "eliot" , 
                tags : [ 
                    { tag : "a" , added : new Date() } , 
                    { tag : "b" , added : new Date() } 
                ]
              } );


db.user.save( { name : "sara" , 
                tags : [ 
                    { tag : "a" , added : new Date() } , 
                    { tag : "c" , added : new Date() } 
                ]
              } );

db.user.ensureIndex( { "tags.tag" : 1 } );

print( db.user.find( { "tags.tag" : "a" } ).toArray().tojson( "\n" ) );
print( tojson( db.user.find( { "tags.tag" : "a" } ).explain() ) );




