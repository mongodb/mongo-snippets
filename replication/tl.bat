mkdir \data\a
mkdir \data\b
start mongod --master --dbpath c:\data\a
start mongod --slave  --dbpath c:\data\b --port 27000 --source localhost
mongo --shell localhost:27000 test_latency.js
