
# MongoDB sample LDAP user/role mapping sync script

MongoDB 2.6 will integrate LDAP authentication, allowing users to authenticate in MongoDB through a call to LDAP.  MongoDB 2.6, however, will not automate syncing of MongoDB user and role mappings between MongoDB and LDAP; customers will still have to manually update user credentials within MongoDB.

To simplify this, MongoDB will provide a sample script that will allow users to synch changes made to LDAP user and role mappings with their corresponding definitions in MongoDB.   The script will be provided to work with a simple LDAP hierarchy that defines a MongoDB group and underlying users:

## Requirements and Setup



 * mongod 2.6 or higher
 * Ruby driver 1.10.0 or higher
 * Ruby 1.9 or higher 


### Loading the ldap data
Are these meant to be samples for the example in running thje script?

LDAP Organization - acme
LDAP MongoDB Group - MongoDB_dbAdminAnyDatabase
LDAP MongoDB User - Bob Jones

Users can then customize to meet their specific LDAP structures or requirements.

## Running the sample sync scipt

script: 

ruby mongo-ldap.rb mongodb://<username>:<password>@<server:port>\$external ldap://cn=Admin,dc=nodomain:testtesttest@10gensyd1.syd:389/ou=MongoDB,dc=nodomain
The way the script is invoked has to do with the configuration of the users in LDAP. The sample LDIF file creates the hierarchy in LDAP. 

ruby mongo-ldap.rb "mongodb://username:password@host:port/db" "ldap://user:password@host:port/mongoDN"

An example:

ruby mongo-ldap.rb 'mongodb://dbadmin:password@localhost/admin?authSource=$external&authMechanism=PLAIN' 'ldap://cn=Manager,dc=10gen,dc=me:password@localhost:389/ou=MongoDB,dc=10gen,dc=me'
