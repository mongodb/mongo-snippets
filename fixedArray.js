

/**
* this is an example of how you would keep an array of fixed size in an object
* for example if you wanted to keep the last 100 actions per user
*/

coll = db.fixedArray;
coll.drop();

function add( num ){
    coll.update( { _id : 1 } , { $inc : { total : 1 } , $push : { arr : num } } , true );
    coll.update( { _id : 1 , total : { $gt : 100 } } , { $pop : { arr : -1 } } );
}

for ( i=0; i<1000; i++ ){
    add( i );
}

print( coll.findOne().arr );
print( coll.findOne().arr.length )

