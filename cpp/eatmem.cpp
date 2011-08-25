/** to compile: g++ -o eatmem eatmem.cpp

    this utility reserves an amount of memory from physical ram (by locking it) 
    which is then unavailable for use by other processes including the file system 
    cache.  this can be used to verify that a given system can run with less RAM
    than the total capacity of the server.  this could be used simply for testing 
    or run continuously in production; if the latter, one would kill it if more 
    memory were needed on an emergency basis.
*/

#include <iostream>
#include <stdlib.h>
#include <assert.h>
#include <string.h>
#include <sys/mman.h>
#include <errno.h>

using namespace std;

int main(int argc, char *argv[]) { 
  if( argc != 2 ) {
    cout << "usage: eatmem <MB>" << endl;
    return 1;
  }
  int mb = atoi(argv[1]);
  cout << "reserving " << mb << "MB of RAM" << endl;
  void *p = malloc(mb * 1024 * 1024);
  if( p == 0 ) { 
    cout << "malloc failed" << endl;
    return 2;
  }

  if( mlockall(MCL_CURRENT) ) { 
    cout << "mlockall failed errno:" << errno << endl;
    cout << "use sudo if you did not" << endl;
    return 3;
  }

  cout << "reserved ok, sleeping" << endl;
  while( 1 ) { 
    sleep(1024);
  }

  return 0;
}
