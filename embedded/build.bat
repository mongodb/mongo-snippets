@echo off

echo THIS IS EXPERIMENTAL.
echo YMMV
echo see embedded.h for how to use

echo todo: make this a make or scons file

echo vcvars.bat or the like should be ran before this file.  if done, the
echo following will print something reasonable:
echo CL.EXE
cl

pause

cd ../../mongo

echo first run "scons mongod" in ../../mongo to make all the ``.obj files needed for mongod.lib

cmd /C scons -j 4 mongod

pause

echo now make libmongod

echo libmongod...
lib /OUT:mongod.lib pch.obj buildinfo.obj db/common.obj db/jsobj.obj bson/oid.obj db/json.obj db/lasterror.obj db/nonce.obj db/queryutil.obj db/projection.obj shell/mongo.obj util/background.obj util/mmap.obj util/sock.obj util/util.obj util/message.obj util/assert_util.obj util/log.obj util/httpclient.obj util/md5main.obj util/base64.obj util/concurrency/vars.obj util/concurrency/task.obj util/debug_util.obj util/concurrency/thread_pool.obj util/password.obj util/version.obj util/signal_handlers.obj util/histogram.obj util/concurrency/spin_lock.obj util/text.obj util/stringutils.obj util/processinfo.obj util/concurrency/synchronization.obj util/md5.obj client/connpool.obj client/dbclient.obj client/dbclientcursor.obj client/model.obj client/syncclusterconnection.obj client/distlock.obj s/shardconnection.obj util/mmap_win.obj util/processinfo_win32.obj db/commands.obj util/message_server_port.obj client/parallel.obj util/miniwebserver.obj db/dbwebserver.obj db/matcher.obj db/indexkey.obj db/dbcommands_generic.obj db/stats/counters.obj db/stats/service_stats.obj db/stats/snapshots.obj db/stats/top.obj scripting/engine.obj scripting/utils.obj scripting/bench.obj scripting/engine_spidermonkey.obj util/logfile.obj util/alignedbuilder.obj db/mongommf.obj db/dur.obj db/durop.obj db/dur_recover.obj db/dur_journal.obj db/query.obj db/update.obj db/introspect.obj db/btree.obj db/clientcursor.obj db/tests.obj db/repl.obj db/repl/rs.obj db/repl/consensus.obj db/repl/rs_initiate.obj db/repl/replset_commands.obj db/repl/manager.obj db/repl/health.obj db/repl/heartbeat.obj db/repl/rs_config.obj db/repl/rs_rollback.obj db/repl/rs_sync.obj db/repl/rs_initialsync.obj db/oplog.obj db/repl_block.obj db/btreecursor.obj db/cloner.obj db/namespace.obj db/cap.obj db/matcher_covered.obj db/dbeval.obj db/restapi.obj db/dbhelpers.obj db/instance.obj db/client.obj db/database.obj db/pdfile.obj db/cursor.obj db/security_commands.obj db/security.obj db/queryoptimizer.obj db/extsort.obj db/cmdline.obj db/index.obj db/geo/2d.obj db/geo/haystack.obj db/dbcommands.obj db/dbcommands_admin.obj db/commands/distinct.obj db/commands/group.obj db/commands/isself.obj db/commands/mr.obj db/driverHelpers.obj s/config.obj s/grid.obj s/chunk.obj s/shard.obj s/shardkey.obj s/d_logic.obj s/d_writeback.obj s/d_migrate.obj s/d_state.obj s/d_split.obj client/distlock_test.obj s/d_chunk_manager.obj s/d_background_splitter.obj db/module.obj db/modules/mms.obj

cd ../mongo-snippets/embedded

pause

echo eventually, embedded.obj could/should be in the above lib file

echo embedded.obj...
cl /c /EHsc /I..\..\mongo\pcre-7.4 /I..\..\mongo /I..\..\mongo\db /IC:\boost /D_UNICODE /DUNICODE /DWIN32 /D_CONSOLE /D_CRT_SECURE_NO_WARNINGS /DHAVE_CONFIG_H /DPCRE_STATIC /DSUPPORT_UCP /DSUPPORT_UTF8 /DPSAPI_VERSION=1 /DNOEXECINFO "/IC:\Program Files (x86)\Microsoft SDKs\Windows\v7.0A\Include" /TP /W3 /wd4355 /wd4800 /wd4267 /wd4244 /DMONGO_EXPOSE_MACROS  embedded.cpp

pause

echo helloworld.obj...
cl /c /EHsc /I..\..\mongo\pcre-7.4 /I..\..\mongo /I..\..\mongo\db /IC:\boost /D_UNICODE /DUNICODE /DWIN32 /D_CONSOLE /D_CRT_SECURE_NO_WARNINGS /DHAVE_CONFIG_H /DPCRE_STATIC /DSUPPORT_UCP /DSUPPORT_UTF8 /DPSAPI_VERSION=1 /DNOEXECINFO "/IC:\Program Files (x86)\Microsoft SDKs\Windows\v7.0A\Include" /TP /W3 /wd4355 /wd4800 /wd4267 /wd4244 /DMONGO_EXPOSE_MACROS helloworld.cpp

pause

echo helloworld...
link /OUT:helloworld /NODEFAULTLIB:MSVCPRT /NODEFAULTLIB:MSVCRT /LIBPATH:C:\boost\lib\vs2010_32 "/LIBPATH:C:\Program Files (x86)\Microsoft SDKs\Windows\v7.0A\Lib" ws2_32.lib kernel32.lib advapi32.lib Psapi.lib user32.lib gdi32.lib winspool.lib comdlg32.lib shell32.lib ole32.lib oleaut32.lib odbc32.lib odbccp32.lib ..\..\mongo\mongod.lib embedded.obj helloworld.obj

echo build done

