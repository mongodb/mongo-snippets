require 'rubygems'
require 'mongo'

include Mongo
master = Connection.new('localhost', 27017)
slave  = Connection.new('localhost', 9999, :slave_ok => true)

master_local = master.db('local')
slave_local  = slave.db('local')

master_oplog = master_local["oplog.$main"].find.sort([["ts", -1]]).to_a.first

slave_oplog = slave_local.collection("sources").find_one

diff = master_oplog['ts'][1] - slave_oplog['syncedTo'][1]

puts "Slave is behind master by #{diff} seconds"
