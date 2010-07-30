from optparse import OptionParser
import os
import random
import subprocess
import threading


parser = OptionParser("usage: %prog [options] test executable")
parser.add_option("-m", "--mongo_path", dest="mongo_path",
                  help="Path to MongoDB executables",
                  default="~/10gen/mongo/")
(options, args) = parser.parse_args()

mongo_path = os.path.expanduser(options.mongo_path)
mongo = os.path.join(mongo_path, "mongo")
replset = subprocess.Popen([mongo, "--nodb", os.path.abspath("driver_replset_test.js")],
                           stdout=subprocess.PIPE, cwd=mongo_path)

def receive_line(process, prefix=""):
    while True:
        line = process.stdout.readline()
        if line and line.startswith(prefix):
            return line[len(prefix):].strip()

count = int(receive_line(replset, "MAGIC"))
nodes = []
for _ in range(count):
    nodes.append(receive_line(replset, "MAGIC"))

print "Known nodes %r" % nodes

seed = random.choice(nodes)

print "Using seed %r" % seed


driver = subprocess.Popen(args + [seed], stdout=subprocess.PIPE)
driver_nodes = []
for _ in range(count):
    driver_nodes.append(receive_line(driver))
if set(driver_nodes) != set(nodes):
    raise Exception("didn't detect nodes properly")
print "Driver connected properly, testing failover"

class Printer(threading.Thread):
    def __init__(self, process, prefix=""):
        threading.Thread.__init__(self)
        self.process = process
        self.prefix = prefix
        self.alive = True

    def die(self):
        self.alive = False

    def run(self):
        while (self.alive):
            line = self.process.stdout.readline()
            if line and line.startswith(self.prefix):
                print line[len(self.prefix):].strip()


printer = Printer(replset, "MAGIC")
printer.start()

old = -1
while(old < 5):
    d = driver.stdout.readline().strip()
    if d and d != "E":
        d = int(d)
        if d != old:
            assert d == old + 1
            old = d
            print old

print "Failover tests successful"
printer.die()
printer.join()
driver.wait()
replset.wait()
