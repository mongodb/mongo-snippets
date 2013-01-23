# -*- coding: utf-8 -*-
import os
import web
import pymongo
import simplejson as json
import yaml

_here = os.path.dirname(os.path.abspath(__file__))
_config_file = file(os.path.join(_here, 'config.yml'), 'r')

render = web.template.render('templates')
config = yaml.load(_config_file)
geo_collection = config['geo_collection']

conn = pymongo.connection.Connection(geo_collection['host'], port=geo_collection['port'])

db = conn[geo_collection['db_name']]

db.write_concern = {'w': 1}

class GeoDemo(object):

    def GET(self):
        return render.mapstest()


class WithinSearch(object):

    def GET(self):
        collection = db[geo_collection['collection_name']]
        # Web.py doesn't support arrays of objects, so we use two 
        # arrays, one with lats, one with lngs.
        input = web.input(point_lats=[], point_lngs=[])
        point_lats = input['point_lats']
        point_lngs = input['point_lngs']
        poly = {
            "type": "Polygon",
            "coordinates": []
        }
        final_points = []
        for i in range(0, len(point_lats)):
            final_points.append([float(point_lngs[i]), float(point_lats[i])])
        final_points.append([float(point_lngs[0]), float(point_lats[0])])
        poly['coordinates'].append(final_points)
        # don't bring back _id, because it makes json encoding uglier.
        within = collection.find({"geo": { "$within": {"$geometry": poly} } }, 
                {"_id": False, "name": True, "geo": True})
        within.limit(500)
        found = within.count()
        places = [place for place in within]
        return json.dumps(places)

urls = (
    "/", GeoDemo,
    "/withinSearch", WithinSearch
    )

# setup web env
app = web.application(urls)

if __name__ == "__main__":
        app.run()
