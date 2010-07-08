#!/usr/bin/env python

import pymongo
import pymongo.json_util
import datetime
import subprocess
import sys
import threading

from pymongo.son import SON
from time import sleep

if sys.version_info < (2, 6):
    #TODO fix this
    print "This script requires python 2.6 or higher"
    sys.exit(1)

try:
    import json
except ImportError:
    import simplejson as json

conn = pymongo.Connection() #TODO connection config. need to support multiple connections
conn.document_class = SON

printLock = threading.Lock()
def print_(s):
    with printLock:
        print s


def toJSON(obj):
    return json.dumps(obj, indent=4, default=pymongo.json_util.default)

all_threads = []
def runInThreadNow(func):
    t = threading.Thread(target=func)
    t.start()
    all_threads.append(t)

cmd_output = SON()
def runOnce(cmd):
    print_("running %s"%cmd)
    output = []
    cmd_output[str(cmd)] = output

    @runInThreadNow
    def runner():
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, shell=isinstance(cmd, basestring))
        proc.wait()
        output.append(proc.stdout.read())
    

def runForAWhile(cmd, secs=30):
    print_("running %s"%cmd)
    output = []
    cmd_output[str(cmd)] = output

    @runInThreadNow
    def runner():
        timeout = datetime.timedelta(seconds=secs)

        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, shell=isinstance(cmd, basestring))
        start = datetime.datetime.now()
        while ((datetime.datetime.now() - start) < timeout):
            #print (datetime.datetime.now() - start)
            output.append(proc.stdout.readline()) #TODO timestamp?
        proc.terminate() # python 2.6 only

admin = conn.admin

statuses = []
status_diffs = []
status_times = []
@runInThreadNow
def getStatuses():
    for i in range(4): # 30 secs
        if i != 0:
            sleep(10)

        print_("fetching serverStatus #%s"%(i+1))

        stat = admin.command('serverStatus')
        statuses.append(stat)
        status_times.append(str(datetime.datetime.now()))

        if i == 0:
            status_diffs.append(None)
        else:
            last = statuses[i-1]
            time = (stat['uptime'] - last['uptime']) * 1.0 # just to be safe

            diff = SON()
            diff['ops_per_sec'] = SON()
            diff['ops_per_sec']['insert'] = (stat['opcounters']['insert'] - last['opcounters']['insert']) / time
            diff['ops_per_sec']['query']  = (stat['opcounters']['query'] - last['opcounters']['query']) / time
            diff['ops_per_sec']['update'] = (stat['opcounters']['update'] - last['opcounters']['update']) / time
            diff['ops_per_sec']['delete'] = (stat['opcounters']['delete'] - last['opcounters']['delete']) / time
            diff['ops_per_sec']['getmore'] = (stat['opcounters']['getmore'] - last['opcounters']['getmore']) / time
            diff['ops_per_sec']['command'] = (stat['opcounters']['command'] - last['opcounters']['command']) / time

            diff['btree_miss_per_sec'] = (stat['indexCounters']['btree']['misses'] - last['indexCounters']['btree']['misses']) / time

            try:
                diff['heap_change'] = stat['extra_info']['heap_usage_bytes'] - last['extra_info']['heap_usage_bytes']
                diff['pflts_per_sec'] = (stat['extra_info']['page_faults'] - last['extra_info']['page_faults']) / time
            except KeyError:
                pass # these fields are only on linux

            status_diffs.append(diff)
        
#TODO db.stats() db.c.stats() for all dbs
#TODO fetch http output

runForAWhile('iostat -x 2')
runForAWhile('mongostat') #TODO connection config

runOnce('df -h')
runOnce('du -sh /mnt/external/data/') #TODO dbpath config
runOnce('ls -lh /mnt/external/data/') #TODO dbpath config
runOnce('sar')
runOnce('sar -b')


# TODO need to catch ctrl-c and kill all threads
for t in all_threads:
    t.join()


# TODO dump to files in tarfile rather than just printing
for i in range(len(statuses)):
    print
    print "------------"
    print status_times[i]
    print toJSON(statuses[i])
    print toJSON(status_diffs[i])

for cmd, output in cmd_output.iteritems():
    print
    print "------------"
    print '$', cmd
    print ''.join(output)


