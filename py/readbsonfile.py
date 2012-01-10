
import pymongo
import bson
import sys
import struct

def readBSONFile( fileName , callback ):
    inp = open( fileName )

    while True:
        x = inp.read(4)

        if len(x) == 0:
            break

        if len(x) < 4:
            raise Exception( "bad - need int for lenght and only got %d bytes " % len(x) )
            
        obj_size = struct.unpack( "<i" , x )[0]

        elements = inp.read( obj_size - 5 )
        callback( bson._elements_to_dict( elements , dict , True ) )

        # this is because of the -5 above
        inp.read(1)



if __name__ == "__main__":
    
    def p(x):
        print(x)
    
    readBSONFile( sys.argv[1] , p )
