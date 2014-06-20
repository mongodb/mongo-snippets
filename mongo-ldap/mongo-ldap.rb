#!/usr/bin/ruby

require 'net/ldap'	# gem install net-ldap
require 'mongo'		# gem install mongo

mongouri = ARGV[0]
ldapuri = ARGV[1]

#Temporary hard coding for ldap entries
#ldapstring = "10gensyd1.syd:389"
#ldapuser = "cn=Admin,dc=nodomain"
#ldappass = "testtesttest"
#ldapMongoDn = "ou=MongoDB,dc=nodomain"

#MongoDB URI Format mongodb://username:password@host:port/db
#mongouri = 'mongodb://mongoAdmin:password@10gensyd1.syd:27018/$external'

#LDAP URI Format ldap://user:password@host:port/mongoDN
#ldapuri = "ldap://cn=Admin,dc=nodomain:testtesttest@10gensyd1.syd:389/ou=MongoDB,dc=nodomain"

#Quick parse for the ldap details
ldapuser,ldappass,ldapstring,ldapMongoDn = /^ldap:\/\/(.+):(.+)@(.+)\/(.+)$/.match(ldapuri).captures

#Ldap Connection Information
ldap = Net::LDAP.new
ldap.host = ldapstring.split(":")[0]
ldap.port = ldapstring.split(":")[1]
ldap.auth ldapuser, ldappass
unless ldap.bind
  p ldap.get_operation_result
  exit(1)
end

#Filter, find all sub-units, but exclude the top level mongodb
filter = Net::LDAP::Filter.join(Net::LDAP::Filter.eq("ou", "*"), ~Net::LDAP::Filter.begins("ou", "MongoDB"))
#We want the cn entries which represent each 
permissionFilter = Net::LDAP::Filter.eq("cn", "*")
dbentries = []
permissionsStructure = {}
dbPermissions = {}
commandsToExecute = []

#Search the top level DN
ldap.search(:base => ldapMongoDn, :filter => filter) do |databaseOu|
  dbentries.push databaseOu.dn
end

dbentries.each do |dbentry|
  ldap.search(:base => dbentry, :filter => permissionFilter) do |databaseEntries|
    #We only care about the roleoccupants, so just iterate them out
    databaseEntries["roleoccupant"].each do |user|
      username = user.split(",")[0].split("=")[1]
      db = dbentry.split(",")[0].split("=")[1]
      role = databaseEntries.dn.split(",")[0].split("=")[1]
      dataHash = {"role" => role, "db" => db}
      (permissionsStructure[username] ||= []) << dataHash
    end
  end	
end
if permissionsStructure.empty?
  p "Failed to pull any permissions down from LDAP, this feels like an error. Cowardly bailing on doing anthing"
  exit(2)
end

#Connect to the MongoDB instance we want to mange
mongo = Mongo::MongoClient.from_uri(mongouri)
#Grab the users
col = mongo["admin"]["system.users"]
col.find({"_id" => /^\$external/ }).each do |user|
  #If this is an externally managed user, add it to our hash
  dbPermissions[user["user"]] = user
end

#Cant delete from an iterative loop mid-flight, so we need to maintain a list of things to delete
delUser1 = []
delUser2 = []

#First go through and remove any users which are to be deleted
dbPermissions.each_key do |userName|
  unless permissionsStructure.has_key? userName
    delUser1 << userName
    commandsToExecute << {"dropUser" => userName }
  end
end
#Delete any of these users which we dont need
delUser1.each do |del|
  dbPermissions.delete(del)
end


#Delta the two maps
permissionsStructure.each_key do |userName|
  unless dbPermissions.has_key? userName
  #Find anything which is 100% missing, we need to add it
  	commandsToExecute << {"createUser" => userName, "roles" => permissionsStructure[userName] }
  	permissionsStructure.delete(userName)
  else
  #Cant delete from an iterative loop mid-flight, so we need to maintain a list of things to delete
  tbd1 = []
  tbd2 = []

  #User exists, we should review it and see whats different
  	permissionsStructure[userName].each do |topIter|
      dbPermissions[userName]["roles"].each do |innerIter|
      	#Do we have this document represented in the hash?
  		if topIter["role"] == innerIter["role"] && topIter["db"] == innerIter["db"]
          #Have we checked for all the permissions? If so, delete them from our mapping
          tbd1 << topIter
          tbd2 << innerIter
  		end
  	  end
  	end
  	
  	tbd1.each do |del|
      permissionsStructure[userName].delete(del)
  	end
  	tbd2.each do |del|
      dbPermissions[userName]["roles"].delete(del)
  	end
  	if dbPermissions[userName]["roles"].empty?
  		delUser1 << userName
    end
  	if permissionsStructure[userName].empty?
  		delUser2 << userName
    end
  end
end

#Delete the finished users
delUser1.each do |del|
  dbPermissions.delete(del)
end
delUser2.each do |del|
  permissionsStructure.delete(del)
end

#From the remaining list build up the roles we need to grant and revoke
dbPermissions.each_key do |userName|
  dbPermissions[userName]["roles"].each do |role|
    commandsToExecute << { "revokeRolesFromUser" => userName, "roles" => [] << role }
  end
end
dbPermissions.clear

permissionsStructure.each_key do |userName|
  permissionsStructure[userName].each do |role|
    commandsToExecute << { "grantRolesToUser" => userName, "roles" => [] << role }
  end
end
permissionsStructure.clear

#Execute the commands needed to bring mongo into line
externalDB = mongo["$external"]
commandsToExecute.each do |cmd|
  p "Executing: #{cmd}"
  res = externalDB.command(cmd)
  if res["ok"] != 1
    p "Execution failed: #{res}"
  end
end