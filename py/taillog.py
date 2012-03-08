
import pymongo
import sys
import time

class LineTailer:
    
    def __init__(self,host):
        self.host = host
        self.connection = pymongo.Connection( host , slave_okay = True )
        self.admin = self.connection.admin

        self.last = {}
        
    def _get_lines(self,log="global"):
        return self.admin.command( "getLog" , log )
    
    def get_next_lines(self,log="global"):
        cur = self._get_lines( log )

        lines = cur["log"]
        
        if log in self.last:
            try:
                idx = lines.index( self.last[log] )
                if idx == len(lines) - 1:
                    return []
                lines = lines[idx+1:]
            except:
                print( "****\nGAP GAP\n****" )

        self.last[log] = lines[len(lines)-1]

        return lines
            

if __name__ == "__main__":
    if len( sys.argv ) != 2:
        raise Exception( "need to give a single host" )
        
    lt = LineTailer( sys.argv[1] )

    while True:
        n = lt.get_next_lines()
        for x in n:
            print(x)
        time.sleep( 1 )
