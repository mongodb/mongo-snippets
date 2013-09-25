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

def is_polygon(list):
    n = len(list)
    if n < 4:
        return False
    elif list[0][0] != list[n - 1][0]:
            return False
    elif list[0][1] != list[n - 1][1]:
        return False
    return True

class GeoDemo(object):

    def GET(self):
        return render.mapstest()


class GeoSearch(object):

    def GET(self):
        collection = db[geo_collection['collection_name']]
        # Web.py doesn't support arrays of objects, so we use two 
        # arrays, one with lats, one with lngs.

        input = web.input(point_lats=[], point_lngs=[]) # must fix...
        mode = input['mode']
        path_count = int(input['path_count'])
        
        point_lats = input['point_lats']
        point_lngs = input['point_lngs']    
    
        final_points = []
        a = 0
        for j in range(0, path_count):

            length = int(input['length_' + str(j)])
            final_points.append([])
            for i in range(0, length):
                final_points[j].append([float(point_lngs[a]), float(point_lats[a])])
                a += 1

        # don't bring back _id, because it makes json encoding uglier.
        if mode == "$within":
            for i in range(0, path_count):
                final_points[i] = [final_points[i]]
            poly = {
                "type": "MultiPolygon",
                "coordinates": final_points
            }

            within = collection.find({"geo": { "$geoWithin": {"$geometry": poly} } }, 
                                     {"_id": False, "name": True, "geo": True})
            within.limit(500)
            places = [place for place in within]
        elif mode == "$geoIntersects":
            # step 1: make everything a geo collection
            geometries = []
            for i in range(0, path_count):
                doc = {}
                if len(final_points[i]) == 1:
                    doc["type"] = "Point"
                    doc["coordinates"] = final_points[i][0]
                elif is_polygon(final_points[i]):
                    doc["type"] = "Polygon"
                    doc["coordinates"] = [final_points[i]]
                else:
                    doc["type"] = "LineString"
                    doc["coordinates"] = final_points[i]
                geometries.append(doc)
            # step 2: add logic to find things that are all one type
            # step 3: make multipoint, multiline, multigon docs.
            coll = {
                    "type": "GeometryCollection",
                    "geometries": geometries
                    }
            inter = collection.find({"geo": { "$geoIntersects": {"$geometry": coll} } },
                    {"_id": False, "name": True, "geo": True})
            inter.limit(50)
            places = [place for place in inter]
        elif mode == "$near":
            point = {
                    "type": "Point",
                    "coordinates": final_points[0][0]
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
