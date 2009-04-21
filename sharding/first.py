from pymongo.connection import Connection

c = Connection()

db = c.test
config = c.config
admin = c.admin

admin._command({"addserver": "localhost:9998"})
admin._command({"addserver": "localhost:9999"})

db.people.save({"name": "mike", "email": "someone@example.com"})
print "one record: %r" % db.people.find_one()
print "test database info %r" % config.databases.find_one({"name": "test"})

print "partition result: %r" % admin._command({"partition": "test"})
print "shard result: %r" % admin._command({"shard": "test.data", "key": {"num": 1}})

big_string = "this is 10" * 5000 # 50k string

for i in range(100):
    db.data.save({"num": i, "bigString": big_string})

print "should have 100: %d" % len(list(db.data.find()))
print "shard info (better be just one): %r" % config.shard.count()

for i in range(5000):
    db.data.save({"num": i, "bigString": big_string})

print "shard info (now more!): %r" % config.shard.count()
