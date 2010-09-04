/* See http://www.mongodb.org/display/DOCS/Tailable+Cursors

   to compile, something like:

          (boost loc)           (mongohdrloc)            
   g++ -I /opt/local/include -I ~/mongo/      tail.cpp

   This is a partial example (no main, no connect etc.)
*/

#include "client/dbclient.h"
#include "util/goodies.h"

using namespace mongo;

/* "tail" the namespace, outputting elements as they are added.
   For this to work _id values should be increasing when items are
   added.
*/
void tail(DBClientBase& conn, const char *ns) {
  BSONElement lastId = minKey.firstElement(); // minKey is smaller than any other possible value
  Query query = Query().sort("_id");
  while( 1 ) {
    auto_ptr<DBClientCursor> c =
      conn.query(ns, query, 0, 0, 0, QueryOption_CursorTailable);
    while( 1 ) {
      if( !c->more() ) {
		if( c->isDead() ) {
		  // we need to requery
		  break;
		}
		sleepsecs(1); // all data (so far) exhausted, wait for more
      }
      BSONObj o = c->next();
      lastId = o["_id"];
      cout << o.toString() << endl;
    }

    // prepare to requery
    query = QUERY( "_id" << GT << lastId ).sort("_id");
  }
}
