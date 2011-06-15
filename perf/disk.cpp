// disk.cpp


#include <string.h>
#include <assert.h>
#include <stdlib.h>
#include <stdio.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <sys/mman.h>
#include <errno.h>
#include <sys/time.h>

#include <string>
#include <iostream>

using namespace std;

size_t fileSize;

unsigned long long curTimeMillis64() {
    timeval tv;
    gettimeofday(&tv, NULL);
    return ((unsigned long long)tv.tv_sec) * 1000 + tv.tv_usec / 1000;
}


void createFile( const string& file ){

    long z = 1024 * 1024 * 4; // this needs to be pretty big if we are doing O_DIRECT
    char buf[z];
    memset( buf , 0 , z );
    int nSets = fileSize / z;
    assert( fileSize % z == 0 );

    int fd = open( file.c_str() , O_CREAT | O_RDWR | O_NOATIME , S_IRUSR | S_IWUSR );
    if ( fd <= 0 )
        cout << strerror(errno) << endl;
    assert( fd > 0 );    
    size_t old = lseek( fd , 0 , SEEK_END );
    assert( old <= fileSize );
    if ( old != fileSize ){
        assert( fileSize - 1 == lseek( fd , fileSize - 1 , SEEK_SET ) );
        assert( lseek( fd , 0 , SEEK_SET ) == 0 );
        for ( int i=0; i<nSets; i++ ) {
            long w = write( fd , buf , z );
            if ( w < 0 )
                cout << strerror(errno) << endl;                
            else if ( w != z )
                cout << "w: " << w << endl;
            assert( z == w );
        }
    }
    
    close(fd);
}


int usage() {
    cout << "options" << endl;
    cout << " --dbpath [dbpath]" << endl;
    return 1;
}

unsigned long long align( unsigned long long val ) {
    return ( val >> 9 ) << 9;
}

/**
 * @return reads/sec
 */
double randomReads( const string& file , int seconds ) {
    int fd = open( file.c_str() , O_DIRECT | O_RDONLY | O_NOATIME , S_IRUSR | S_IWUSR );
    if ( fd <= 0 )
        cout << strerror(errno) << endl;
    assert( fd > 0 );    
    
    char x[1024];
    
    char* y = (char*)align( (unsigned long long)(x+513) );
    
    double total = 0;

    double start = curTimeMillis64();
    double end = 0;

    for ( int i=0; i<1000; i++ ) {
        for ( int j=0; j<1000; j++ ) {
            int r = pread( fd , y , 512 , align( rand() % fileSize ) );
            if ( r < 1 ) {
                cout << strerror( errno ) << endl;
            }
            total++;
        }
        
        end = curTimeMillis64();
        if ( ( end - start ) > ( seconds * 1000 ) )
            break;
    }

    close(fd);
    
    return ( 1000 * total / ( end - start ) );
}

int main( int argc , char* argv[] ) {
    
    string dbpath = "/data/db/";
    int seconds = 10;
    
    fileSize = 512 * 1024 * 1024;

    
    for ( int i=1; i<argc; i++ ) {
        if ( strcmp( argv[i] , "--dbpath" ) == 0 ) {
            if ( i + 1 == argc )
                return usage();
            dbpath = argv[i+1];
            i++;
            continue;
        }

        if ( strcmp( argv[i] , "--seconds" ) == 0 ) {
            if ( i + 1 == argc )
                return usage();
            seconds = atoi( argv[i+1] );
            i++;
            continue;
        }

        cout << "unknown option: " << argv[i] << endl;
        return usage();
    }

    // --- print setup
    
    cout << "dbpath:\t" << dbpath << endl;
    cout << "seconds:\t" << seconds << endl;
    
    // ----------  run the test ------------

    string file = dbpath + "/__test__";
    createFile( file );


    cout << " ops/sec: " << randomReads(file,2) << endl;

}
