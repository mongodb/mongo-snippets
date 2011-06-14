/* See http://www.mongodb.org/display/DOCS/Tailable+Cursors

   to compile, something like:

          (boost loc)           (mongohdrloc)            
   g++ -I /opt/local/include -I ~/mongo/      tail.cpp

   This is a partial example (no main, no connect etc.)
*/

#include "client/dbclient.h"

using namespace mongo;

/* "tail" the namespace, outputting elements as they are added.  Cursor blocks waiting for data if
   no documents currently exist.
   For this to work something field -- _id in this case -- should be increasing
   when items are added.
*/
void tail(DBClientBase& conn, const char *ns) {
  BSONElement lastId = minKey.firstElement(); // minKey is smaller than any other possible value
  Query query = Query().sort("$natural"); // { $natural : 1 } means in forward capped collection insertion order
  while( 1 ) {
    auto_ptr<DBClientCursor> c =
      conn.query(ns, query, 0, 0, 0, QueryOption_CursorTailable | QueryOption_AwaitData );
    while( 1 ) {
      if( !c->more() ) {
		if( c->isDead() ) {
		  // we need to requery
		  break;
		}
		// No need to wait, cursor will block with _AwaitData
		continue; // we will try more() again
      }
      BSONObj o = c->next();
      lastId = o["_id"];
      cout << o.toString() << endl;
    }

    // prepare to requery from where we left off
    query = QUERY( "_id" << GT << lastId ).sort("$natural");
  }
}
