#!/usr/bin/env python

import atexit
import optparse
import os
from select import select
import shutil
from socket import (error,
                    socket,
                    AF_INET,
                    SOCK_STREAM)
from subprocess import (Popen,
                        PIPE,
                        STDOUT)
import sys
from threading import Thread
from time import sleep

from pymongo import Connection
from pymongo.errors import AutoReconnect

parser = optparse.OptionParser()
parser.add_option("--mongo_path",
                  help="Path to MongoDB executables (%default)",
                  default="~/10gen/mongo/")
parser.add_option("--dbpath",
                  help="Base data directory - will be wiped each run (%default)",
                  default="/data/db/replset/")
parser.add_option("-n", "--set_size", type="int",
                  help="Number of nodes in the set (%default)",
                  default=3)
parser.add_option("--arbiters", type="int",
                  help="Number of arbiter nodes - "
                  "must be less than the set size (%default)",
                  default=0)
parser.add_option("--port", type="int",
                  help="First port number to use (%default)", default=27017)
parser.add_option("--name",
                  help="Replica set name (%default)", default="foo")
(options, args) = parser.parse_args()
if args:
    print("error: no positional arguments accepted")
    parser.print_help()
    exit(1)
if options.arbiters >= options.set_size:
    print("error: `arbiters` must be less than `set_size`")
    exit(2)

if os.path.exists(options.dbpath):
    shutil.rmtree(options.dbpath)

mongod = os.path.join(os.path.expanduser(options.mongo_path), "mongod")

# Just get a different color code to use based on n.
# See http://pueblo.sourceforge.net/doc/manual/ansi_color_codes.html
def get_color(n):
    return n % 6 + 31

# fixed "colors"
RESET = 0
INVERSE = 7

fds = {}
procs = []

def killAllSubs():
    for proc in procs:
        try:
            proc.terminate()
        except OSError:
            pass #already dead
atexit.register(killAllSubs)

def mkcolor(colorcode):
    base = "\x1b[%sm"
    return (base*2) % (1, colorcode)

def ascolor(color, text):
    return mkcolor(color) + text + mkcolor(RESET)

def waitfor(proc, port):
    trys = 0
    while proc.poll() is None and trys < 40: # ~10 seconds
        trys += 1
        s = socket(AF_INET, SOCK_STREAM)
        try:
            try:
                s.connect(("localhost", port))
                return
            except (IOError, error):
                sleep(0.25)
        finally:
            s.close()

    #extra prints to make line stand out
    print
    print proc.prefix, ascolor(INVERSE, "failed to start")
    print

    sleep(1)
    killAllSubs()
    sys.exit(1)


def printer():
    while not fds: sleep(0.01) # wait until there is at least one fd to watch

    while fds:
        (files, _ , errors) = select(fds.keys(), [], fds.keys(), 1)
        for file in set(files + errors):
            # try to print related lines together
            while select([file], [], [], 0)[0]:
                line = file.readline().rstrip()
                if line:
                    print fds[file].prefix, line
                else:
                    if fds[file].poll() is not None:
                        print fds[file].prefix, ascolor(INVERSE, "EXITED"), fds[file].returncode
                        del fds[file]
                        break

printer_thread = Thread(target=printer)
printer_thread.start()


nodes = []
for i in range(options.set_size):
    path = os.path.join(options.dbpath, "rs_" + str(i))
    os.makedirs(path)
    port = str(options.port + i)
    seed = options.name + "/" + ",".join(nodes)

    command = [mongod, "--port", port, "--dbpath", path, "--replSet", seed]
    if i < options.arbiters:
        command += ["--oplogSize", "1"]
        prefix = "A" + str(i)
    else:
        prefix = "R" + str(i - options.arbiters)
    node = Popen(command, stdout=PIPE, stderr=STDOUT)
    node.prefix = ascolor(get_color(i), prefix) + ":"

    fds[node.stdout] = node
    procs.append(node)
    waitfor(node, options.port + i)
    nodes.append("localhost:%s" % port)

config = {"_id": options.name,
          "members": []}
for i in range(len(nodes)):
    member = {"_id": i, "host": nodes[i]}
    if i < options.arbiters:
        member["arbiterOnly"] = True
    config["members"].append(member)

Connection(nodes[0], slave_okay=True).admin.command("replSetInitiate", config)
while (True):
    try:
        print Connection(nodes).admin.command("replSetGetStatus")
        break
    except AutoReconnect:
        sleep(1)

print "*** READY ***"
print

try:
    printer_thread.join()
except KeyboardInterrupt:
    pass


