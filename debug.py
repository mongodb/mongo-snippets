#!/usr/bin/env python

import pymongo
import pymongo.json_util
import datetime
import subprocess
import sys
import threading

from pymongo.son import SON
from pymongo.errors import OperationFailure
from time import sleep

try:
    import json
except ImportError:
    import simplejson as json

printLock = threading.Lock()
def print_(s):
    with printLock:
        print >> sys.stderr, s

if sys.version_info < (2, 6):
    #TODO fix this
    print_("This script requires python 2.6 or higher")
    sys.exit(1)

if map(int, pymongo.version.split('.')) < [1,7]:
    print_("This script requires pymongo 1.7 or higher")
    sys.exit(1)

print_("This will take about 30 seconds...please be patient")
print_("===================================================")
print_("")

PORT = 27017
if len(sys.argv) >= 2:
    PORT = int(sys.argv[1])

print_("using port: %s"%PORT)

conn = pymongo.Connection(port=PORT)
conn.document_class = SON
admin = conn.admin

DBPATH = '/data/db'
cmdline_opts = admin.command('getCmdLineOpts')['argv']
config_file = []
for i in range(len(cmdline_opts)):
    if cmdline_opts[i] == '--logpath':
        pass # TODO something
    elif cmdline_opts[i] == '--dbpath':
        DBPATH = cmdline_opts[i+1]
    elif cmdline_opts[i] in ['-f', '--config']:
        config_file = open(cmdline_opts[i+1]).readlines()

for line in config_file:
    line = [part.strip() for part in line.split('=')]
    if len(line) != 2:
        continue
    if line[0] == 'logpath':
        pass # TODO something
    elif line[0] == 'dbpath':
        DBPATH = line[1]

def toJSON(obj):
    return json.dumps(obj, indent=4, default=pymongo.json_util.default)

all_threads = []
def runInThreadNow(func):
    t = threading.Thread(target=func)
    t.start()
    all_threads.append(t)

def cmdName(cmd):
    if isinstance(cmd, basestring):
        return cmd
    else:
        return ' '.join(cmd)

cmd_output = SON()
def runOnce(cmd):
    print_("running %s"%cmdName(cmd))
    output = []
    cmd_output[cmdName(cmd)] = output

    @runInThreadNow
    def runner():
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, shell=isinstance(cmd, basestring))
        if proc.wait() != 0:
            print_("#### '%s' failed to execute properly. check output for details"%cmdName(cmd))
        output.append(proc.stdout.read())
    

def runForAWhile(cmd, secs=30):
    print_("running %s"%cmdName(cmd))
    output = []
    cmd_output[cmdName(cmd)] = output

    @runInThreadNow
    def runner():
        timeout = datetime.timedelta(seconds=secs)

        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, shell=isinstance(cmd, basestring))
        start = datetime.datetime.now()
        while (proc.poll() is None #still running
               and (datetime.datetime.now() - start) < timeout): #not timed out
            output.append(proc.stdout.readline()) #TODO timestamp?

        if proc.poll() != 0:
            print_("#### '%s' failed to execute properly. check output for details"%cmdName(cmd))

        try:
            proc.terminate() # python 2.6 only
        except OSError:
            pass #already dead

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

db_stats = SON()
@runInThreadNow
def getDBDetails():
    print_("fetching db and collection stats")
    for dbname in sorted(conn.database_names()):
        #print_("fetching stats for '%s'"%dbname)
        db = conn[dbname]

        try:
            db_stats[dbname] = SON()
            db_stats[dbname]['stats'] = db.command('dbstats')
            db_stats[dbname]['colls'] = SON()

            for collname in sorted(db.collection_names()):
                #print_("fetching stats for '%s.%s'"%(dbname, collname))
                try:
                    db_stats[dbname]['colls'][collname] = db.command('collstats', collname)
                except OperationFailure:
                    db_stats[dbname]['colls'][collname] = 'FAILED'

        except OperationFailure:
            db_stats[dbname] = 'FAILED'
        
#TODO fetch http output


#note: anything not in standard installs should use shell syntax, not array

#TODO find OSX versions of some of these tools
runForAWhile('iostat -x 2')
runForAWhile('mongostat --host localhost:%s'%PORT) # PORT is an int so this is ok

runOnce('free -m') # dup data with top, but easier to read
runOnce('top -b -n1 | head -n17')
runOnce('ps -Ao comm,pmem,thcount,pid,user,rssize,vsize --sort=-rssize | head -n11')
runOnce('uname -a')
runOnce('mount')
runOnce('df -h')
runOnce(['du', '-sh', DBPATH])
runOnce(['ls', '-lhR', DBPATH])
runOnce('sar')
runOnce('sar -b')


# blocking statements ok after here, but nothing slow
buildinfo = admin.command('buildinfo')


# TODO need to catch ctrl-c and kill all threads
for t in all_threads:
    t.join()

# BEGIN output
# TODO dump to files in tarfile rather than just printing

print
print "------------"
print "buildinfo"
print toJSON(buildinfo)

print
print "------------"
print "cmdline opts"
print toJSON(cmdline_opts)

if config_file:
    print
    print "------------"
    print "config_file"
    print ''.join(config_file)

for i in range(len(statuses)):
    print
    print "------------"
    print status_times[i]
    print toJSON(statuses[i])
    if status_diffs[i]:
        print toJSON(status_diffs[i])

print
print "------------"
print "stats"
print toJSON(db_stats)

for cmd, output in cmd_output.iteritems():
    print
    print "------------"
    print '$', cmd
    print ''.join(output)


