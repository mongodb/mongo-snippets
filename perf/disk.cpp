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

struct Setup {
    int fd;
    bool active;
};




void* randomReads_thread( void * raw ) {
    unsigned long long total = 0;

    char x[1024];
    char* y = (char*)align( (unsigned long long)(x+513) );
    
    Setup * setup = (Setup*)raw;
    while ( setup->active ) {
        int r = pread( setup->fd , y , 512 , align( rand() % fileSize ) );
        if ( r < 1 ) {
            cout << strerror( errno ) << endl;
        }
        total++;
    }
    
    pthread_exit( (void*)total );
}

/**
 * @return reads/sec
 */
double randomReads( const string& file , int seconds , int numThreads ) {
    
    Setup setup;
    
    setup.fd = open( file.c_str() , O_DIRECT | O_RDONLY | O_NOATIME , S_IRUSR | S_IWUSR );
    if ( setup.fd <= 0 )
        cout << strerror(errno) << endl;
    assert( setup.fd > 0 );    
    
    setup.active = true;
    
    pthread_t threads[numThreads];
    
    pthread_attr_t attr;
    pthread_attr_init(&attr);
    pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_JOINABLE);
    

    double start = curTimeMillis64();
    
    for ( int i=0; i<numThreads; i++ ) {
        if ( pthread_create( &threads[i] , &attr , randomReads_thread , (void*)&setup ) ) {
            cerr << "pthread_create failed" << endl;
            throw 1;
        }
    }
    
    sleep( seconds );
    setup.active = false;
    
    double total = 0;
    for ( int i=0; i<numThreads; i++ ) {
        void * result;
        int rc = pthread_join( threads[i] , &result );
        total += (unsigned long long)result;
        
    }

    double end = curTimeMillis64();
    

    double result = ( 1000 * total / ( end - start ) );

    close(setup.fd);
    
    return result;
}

int main( int argc , char* argv[] ) {
    
    string dbpath = "/data/db/";
    int seconds = 10;
    int threads = 10;
    
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

        if ( strcmp( argv[i] , "--threads" ) == 0 ) {
            if ( i + 1 == argc )
                return usage();
            threads = atoi( argv[i+1] );
            i++;
            continue;
        }


        cout << "unknown option: " << argv[i] << endl;
        return usage();
    }

    // --- print setup
    
    cout << "dbpath: \t" << dbpath << endl;
    cout << "seconds:\t" << seconds << endl;
    cout << "threads:\t" << threads << endl;
    
    // ----------  run the test ------------

    string file = dbpath + "/__test__";
    createFile( file );


    cout << " ops/sec: " << randomReads(file,seconds,threads) << endl;

}
