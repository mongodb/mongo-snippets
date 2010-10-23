// start this script as 'mongo chunk-checker.js --host config:port'

confirm = function(text){
    print(); // blank line
    print('########################################');
    print(text)
    print('Hit CTRL-C to cancel');

    for (var i=5; i; i--){
        print(i + ' seconds...');
        sleep(1000 /*ms*/);
    }

    print();
}

makeQuery = function(chunk){
    var key = Object.keySet(chunk.min)[0];
    var out = {};
    out[key] = {$gte: chunk.min[key], $lt: chunk.max[key]};
    return out;
}

confirm("If your data set doesn't fit in RAM, this script may take a long time to run and put significant stress your servers. Please do not run at peak times or if near operating capacity.");

//TODO: consider preventing migrates

config = db.getSisterDB('config')

shards = {}
config.shards.find().forEach(function(shard){
    shards[shard._id] = new Mongo(shard.host);
});


var curNS = '';
config.chunks.find().snapshot().forEach(function(chunk){
    if (chunk.ns != curNS){
        print();
        print('**** Starting to check ' + chunk.ns + ' ****');
        curNS = chunk.ns;

        var coll = config.collections.findOne({_id:curNS});
        assert(coll);
        assert(Object.keySet(coll.key).length == 1, "This script doesn't work with compound keys"); // count() ignores min() and max()
    }

    print();
    print("Current chunk: " + tojsononeline(chunk.min) + " -->> " + tojsononeline(chunk.max) + ' (on ' + chunk.shard + ')');

    var query = makeQuery(chunk);

    var onShards = [];
    for (var shard in shards){ // TODO: parallelize?
        var c = shards[shard].getCollection(curNS);
        var count = c.count(query);
        print('    ' + shard+ ' count: ' + count);
        if (count > 0)
            onShards.push(shard);
    }

    if (onShards.length == 0){
        var msg = 'WARNING: No shards have data for this chunk';
        if (friendlyEqual(chunk.min, MinKey))
            msg += ' (this may be OK)';
        confirm(msg);
    }else if (!Array.contains(onShards, chunk.shard)){
        confirm('WARNING: shard "' + chunk.shard + '" has no data for this chunk. Not running remove');
    }else{
        for (var i=0; i < onShards.length; i++){
            var shard = onShards[i];

            if (shard == chunk.shard)
                continue;

            confirm('About to remove data for this chunk from shard "' + shard + '"');

            var c = shards[shard].getCollection(curNS);
            c.remove(query);
        }
    }
});
    
