
/**
* building a voting system for articles in MongoDB
*/


// make sure we're starting cleanly
db.articles.drop();
db.votes.drop();

// add some articles
db.articles.save( { _id : 1 , title : "my first title" , votes : 0 } )
db.articles.save( { _id : 2 , title : "i need a creative department" , votes : 0 } )
db.articles.save( { _id : 3 , title : "no one will ever read this" , votes : 0 } )


function vote( user , article ){
    // try to add the fact that bob voted on this article
    db.votes.update( { _id : user , voted_on : { $ne : article } } , { $push : { voted_on : article } } , true );
    
    // check to see if it succeeded
    // if it did, then bob can vote
    // otherwise, he's cheating
    last = db.getLastErrorObj();
    if ( last.n == 0 ){
        print( user + " is trying to cheat!" );
        return false;
    }
    db.articles.update( { _id : article } , { $inc : { votes : 1 } } );
    return true;
}

function getvotes( article ){
    return db.articles.findOne( { _id : article } ).votes;
}

function printvotes( msg ){
    print()
    print( msg );
    var all = {}
    db.articles.find( {} , { _id : 1 , votes : 1 } ).forEach( function(z){ all[z._id] = z.votes} );
    printjson( all )
}

printvotes( "make sure all votes are 0" );

// now lets say user "bob" wants to vote
vote( "bob" , 1 )
printvotes( "article 1 should have 1 vote" )

vote( "bob" , 1 )
printvotes( "article 1 should still have 1 vote" )

vote( "bob" , 2 )
printvotes( "not a vote for 1 and 2" )

vote( "joe" , 1 )
printvotes( "joe voted for 1, which is allowed" )



