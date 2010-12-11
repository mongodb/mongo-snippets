/** embedded.h

    embedded todos:

    _ power management: there are some places in the code where it does not go completely idle, but rather 
      almost idle, when there are no db requests coming in.  this is not good on battery device.  this is 
      not too hard to change.
    _ --dur should be on automatically for embedded (when dur is ready)
    _ elegant/automatic handling of broken database files
    _ lots of cleanup in embedded.cpp
*/

namespace mongo { 

    /** call at program startup.  under normal circumstances returns fairly quickly after starting 
        a thread.

        typically command line is inapplicable for embedded.  however for dev/qa purposes it is still 
        here.
    */
    int initEmbeddedMongo(int argc, char* argv[]);

    /** call to shutdown with datafiles closed cleanly */
    void endEmbeddedMongo();

    /** include the normal mongodb client/ libraries to use this. The direct client is allocated with new 
        and should be freed with the delete operator when you are done (or placed in a scoped ptr).

        DBDirectClient's can also be directly instantiated, but then you pull in a lot of extra header files...
    */
    class DBClientBase;
    DBClientBase * makeDirectClient();

}
