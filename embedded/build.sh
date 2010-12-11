# THIS IS EXPERIMENTAL.
# YMMV

# todo: make this a make or scons file

cd ../../mongo

# first run "scons mongod" in ../../mongo to make all the .o files needed for libmongod.a
#
echo scons mongod...
scons -j 4 mongod

# now make libmongod.a
#
echo libmongod.a...
ar rc libmongod.a pch.o buildinfo.o db/common.o db/jsobj.o bson/oid.o db/json.o db/lasterror.o db/nonce.o db/queryutil.o db/projection.o shell/mongo.o util/background.o util/mmap.o util/sock.o util/util.o util/message.o util/assert_util.o util/log.o util/httpclient.o util/md5main.o util/base64.o util/concurrency/vars.o util/concurrency/task.o util/debug_util.o util/concurrency/thread_pool.o util/password.o util/version.o util/signal_handlers.o util/histogram.o util/concurrency/spin_lock.o util/text.o util/stringutils.o util/processinfo.o util/concurrency/synchronization.o util/md5.o client/connpool.o client/dbclient.o client/dbclientcursor.o client/model.o client/syncclusterconnection.o client/distlock.o s/shardconnection.o util/mmap_posix.o util/processinfo_darwin.o db/commands.o util/message_server_port.o client/parallel.o util/miniwebserver.o db/dbwebserver.o db/matcher.o db/indexkey.o db/dbcommands_generic.o db/stats/counters.o db/stats/service_stats.o db/stats/snapshots.o db/stats/top.o scripting/engine.o scripting/utils.o scripting/bench.o scripting/engine_spidermonkey.o util/logfile.o util/alignedbuilder.o db/mongommf.o db/dur.o db/durop.o db/dur_recover.o db/dur_journal.o db/query.o db/update.o db/introspect.o db/btree.o db/clientcursor.o db/tests.o db/repl.o db/repl/rs.o db/repl/consensus.o db/repl/rs_initiate.o db/repl/replset_commands.o db/repl/manager.o db/repl/health.o db/repl/heartbeat.o db/repl/rs_config.o db/repl/rs_rollback.o db/repl/rs_sync.o db/repl/rs_initialsync.o db/oplog.o db/repl_block.o db/btreecursor.o db/cloner.o db/namespace.o db/cap.o db/matcher_covered.o db/dbeval.o db/restapi.o db/dbhelpers.o db/instance.o db/client.o db/database.o db/pdfile.o db/cursor.o db/security_commands.o db/security.o db/queryoptimizer.o db/extsort.o db/cmdline.o db/index.o db/geo/2d.o db/geo/haystack.o db/dbcommands.o db/dbcommands_admin.o db/commands/distinct.o db/commands/group.o db/commands/isself.o db/commands/mr.o db/driverHelpers.o s/config.o s/grid.o s/chunk.o s/shard.o s/shardkey.o s/d_logic.o s/d_writeback.o s/d_migrate.o s/d_state.o s/d_split.o client/distlock_test.o s/d_chunk_manager.o s/d_background_splitter.o db/module.o db/modules/mms.o

cd ../mongo-snippets/embedded

# eventually, embedded.o could/should be in the above .a file
#

# see embedded.h for how to use
#
echo embedded.o...
g++ -c -Wnon-virtual-dtor -fPIC -fno-strict-aliasing -ggdb -pthread -Wall -Wsign-compare -Wno-unknown-pragmas -Winvalid-pch -O3 -D_SCONS -DMONGO_EXPOSE_MACROS -DXP_UNIX -I../../mongo -I../../mongo/db -I/opt/local/include embedded.cpp

echo helloworld.o...
g++ -c -Wnon-virtual-dtor -fPIC -fno-strict-aliasing -ggdb -pthread -Wall -Wsign-compare -Wno-unknown-pragmas -Winvalid-pch -O3 -I/opt/local/include helloworld.cpp

echo helloworld...
g++ -o helloworld -L/opt/local/lib -lstdc++ -lboost_system-mt -lboost_thread-mt -lboost_filesystem-mt -lboost_program_options-mt -lpcrecpp -lpcre -ljs -lmongod -L../../mongo helloworld.o embedded.o

echo build done
