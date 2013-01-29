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


class GeoSearch(object):

    def GET(self):
        collection = db[geo_collection['collection_name']]
        # Web.py doesn't support arrays of objects, so we use two 
        # arrays, one with lats, one with lngs.
        input = web.input(point_lats=[], point_lngs=[])
        mode = input['mode']
        point_lats = input['point_lats']
        point_lngs = input['point_lngs']
        final_points = []
        for i in range(0, len(point_lats)):
            final_points.append([float(point_lngs[i]), float(point_lats[i])])
        # don't bring back _id, because it makes json encoding uglier.
        if mode == "$within":
            final_points.append(final_points[0])
            poly = {
                "type": "Polygon",
                "coordinates": [final_points]
            }
            within = collection.find({"geo": { "$within": {"$geometry": poly} } }, 
                    {"_id": False, "name": True, "geo": True})
            within.limit(500)
            places = [place for place in within]
        elif mode == "$geoIntersects":
            line = {
                    "type": "LineString",
                    "coordinates": final_points
                    }
            inter = collection.find({"geo": { "$geoIntersects": {"$geometry": line} } },
                    {"_id": False, "name": True, "geo": True})
            inter.limit(50)
            print line
            places = [place for place in inter]
        elif mode == "$near":
            point = {
                    "type": "Point",
                    "coordinates": final_points[0]
                    }
            near = collection.find({"geo": { "$near": {"$geometry": point} } }, 
                    {"_id": False, "name": True, "geo": True})
            near.limit(10)
            places = [place for place in near]

        return json.dumps(places)

urls = (
    "/", GeoDemo,
    "/geoSearch", GeoSearch
    )

# setup web env
app = web.application(urls)

if __name__ == "__main__":
        app.run()
