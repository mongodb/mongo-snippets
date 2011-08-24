
// clean up from previous runs
db.posts.drop();

db.posts.save( 
    { 
        title : "welcome to my blog" ,
        text : "this is my first entry, yay!" ,
        posted : new Date( ( new Date() ).getTime() - ( 1000 * 3600 ) ) ,
        tags : [ "admin" , "fun" ]
    }
);


db.posts.save( 
    { 
        title : "i think mongo is cool" ,
        text : "mongo is fast and not relational" ,
        posted : new Date() ,
        tags : [ "mongo" , "fun" ]
    }
);


db.posts.ensureIndex( { title : 1 } ); // for looking up by title
db.posts.ensureIndex( { posted : 1 } ); // for sorting so you can see the newest
db.posts.ensureIndex( { tags : 1 } ); // so you can search for tags

db.posts.find().forEach( printjson ); // printjson is a utility function we have

print( db.posts.findOne( { tags : "admin" } ).title ); // if you index an array, you can search for elements in it
print( db.posts.findOne( { tags : "mongo" } ).title );


// for computing things like tag clouds, you can run javascript in the db
function tagCloud(){
    
    print( db.version() )

    var res = db.posts.mapReduce( 
        function(){ 
            for ( var i=0; i<this.tags.length; i++ ){
                var name = this.tags[i];
                emit( this.tags[i] , 1 );
            }
        } ,
        function( key , values ){
            return Array.sum( values );
        }
        , { out : { inline : true } } )

    assert( res.ok );
    
    var counts = {}
    res.results.forEach( function(z){ counts[z._id] = z.value } )
    return counts;

    
}

printjson( tagCloud() );
