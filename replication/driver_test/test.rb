require 'rubygems'
require 'mongo'

host, port = ARGV[0].split(":")
port = port.to_i

@con  = Mongo::Connection.new(host, port)

@con.nodes.each { |node| puts "#{node[0]}:#{node[1]}" }

@db = @con['replset']

x = 0
while x < 5 do
  begin
    doc = @db['test'].find_one
    x   = doc['a']
    puts x
  rescue Mongo::ConnectionFailure
    puts "E"
  end
end
