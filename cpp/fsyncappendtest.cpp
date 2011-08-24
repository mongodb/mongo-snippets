/* show time on the local device to do an append that is fsync'd.
   a series are done to check if a series of them are fast because the 
   heads are already there.

   g++ fsyncappendtest.cpp -lrt
*/

#include <time.h>
#include <errno.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <iostream>
#include <stdlib.h>
#include <assert.h>
#include <string.h>

using namespace std;

const string name = "testfile.dat";
int _fd;

void open() {
        _fd = open(name.c_str(),
                   O_APPEND
                   | O_CREAT | O_EXCL
                   | O_RDWR
#if defined(O_DIRECT)
                   | O_DIRECT
#endif
#if defined(O_NOATIME)
                   | O_NOATIME
#endif
#if defined(O_SYNC)
                   | O_SYNC
#endif
                   ,
                   S_IRUSR | S_IWUSR);
        if( _fd < 0 ) {
	  cout << "create " << name << " failed" << endl;
	  exit(1);
        }
}

void append(const void *b, size_t len) {
    const char *buf = (char *) b;
    assert(((size_t)buf)%4096==0); // aligned
    if( len % 4096 != 0 ) {
      cout << len << ' ' << len % 4096 << endl;
      assert(false);
    }
    ssize_t written = write(_fd, buf, len);
    if( written != (ssize_t) len ) {
      cout << "write fails written:" << written << " len:" << len << " buf:" << buf << " errno:" << errno << endl;
      exit(2);
    }
#if !defined(O_SYNC)
    if( fdatasync(_fd) < 0 ) {
      cout << "fdatasync failed " << endl;
      exit(3);
    }
#endif
}

int main() {
  void *p = malloc(16384);
  char *buf = (char*) p;
  buf += 4095;
  buf = (char*) (((size_t)buf)&(~0xfff));
  memset(buf, 'z', 8192);
  buf[8190] = '\n';
  buf[8191] = 'B';
  buf[0] = 'A';

  open();

  timespec ts, old;
  for( int i = 0; i < 300; i++ ) {
    clock_gettime(CLOCK_MONOTONIC, &ts);
    cout << ts.tv_sec << ' ' << ts.tv_nsec << " dt:" << (ts.tv_nsec-old.tv_nsec)/1000000.0 << "ms" << endl;
    old = ts;
    append(buf, 8192);
  }

  return 0;
}
