// @file helloworld.cpp embedded mongod a super basic example

#include <boost/scoped_ptr.hpp>
#include <iostream>
#include <vector>
#include "embedded.h"

using namespace std;

void doSomething();

int main(int argc, char *argv[]) { 
    cout << "hello" << endl;
    mongo::initEmbeddedMongo(argc, argv);

    cout << "\n\n\n" << endl;

    try { 
  	    doSomething();
    }
    catch(...) { 
        cout << "exception in doSomething()!" << endl;
    }

    cout << "\n\n\n" << endl;

    mongo::endEmbeddedMongo();
    return 0;
}

// headers / includes here not at the top just for demonstration purposes to show 
// what depends on what.  in a real program these would be separate .cpp files likely or else
// all at the top:

#include "../../mongo/client/dbclient.h"
using namespace bson;

void doSomething() {
    boost::scoped_ptr<mongo::DBClientBase> c( mongo::makeDirectClient() );    

    // make a BSON object
    bo obj = BSON( "x" << 3 << "y" << "abcdef" );

    // do some db operations
    const string ns = "test.mycollection"; // ns = 'namespace' = dbname+'.'+collectionname
    c->insert(ns, obj);
    cout << "count: " << c->count(ns) << endl;	
}
