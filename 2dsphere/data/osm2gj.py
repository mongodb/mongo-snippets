"""Script to convert osm file downloaded from openstreetmaps to
json that can then be imported into MongoDB. Note - currently
the script generates Nodes only. Set write_nodes_and_quit to false
after generating nodes to generate lines and polygons"""

import xml.parsers.expat
import os.path
import json

infile = "map.osm"
write_only_named = True
write_nodes_and_quit = True
write_ways_and_quit = True

node_id = ""
node_attr = {}

allowed_attr = set(['name', 'leisure', 'highway', 'natural', 'waterway', 'railway', 'wheelchair', 'oneway', 'lanes', 'landuse', 'name', 'place', 'shop', 'amenity'])

#nodes_written = 0

def makePoint(lon, lat):
    retVal = {}
    retVal["type"] = "Point"
    retVal["coordinates"] = [float(lon), float(lat)]
    #return [float(lon), float(lat)]
    return retVal

if write_nodes_and_quit:
    nodes = {}
    outputfile = open('nodes.json', 'w')
    def start_element(name, attrs):
        if "node" == name:
            global node_id
            node_id = attrs['id']
            nodes[node_id] = [attrs['lon'], attrs['lat']]
        if "tag" == name and attrs['k'] in allowed_attr:
            global node_attr
            node_attr[attrs['k']] = attrs['v']
    def end_element(name):
        if "node" == name:
            global node_id
            global node_attr
            if write_only_named and not node_attr.has_key('name'):
                return
            if len(node_attr['name']) <= 1:
                return
            outputkv = node_attr
            outputkv['geo'] = makePoint(nodes[node_id][0], nodes[node_id][1])
            outputkv['nodeid'] = "n" + node_id
            outputfile.write(json.dumps(outputkv).encode("utf-8"))
            outputfile.write("\n")
            node_id = ""
            node_attr = {}  
    p = xml.parsers.expat.ParserCreate()
    p.StartElementHandler = start_element
    p.EndElementHandler = end_element
    p.ParseFile(open(infile, 'r'))
    nodefile = open('nodedict', 'w')
    json.dump(nodes, open('nodedict', 'w'))
    exit(0)

print "reading node dictionary..."
nodes = json.load(open('nodedict', 'r'))
print "done!\n"

#global nodes_in_way
nodes_in_way = []
way_name  = ""
is_area = ""
if write_ways_and_quit:
    lineout = open('lines.json', 'w')
    polyout = open('polygons.json', 'w')
    def start_element(name, attrs):
        global nodes_in_way
        if "way" == name:
            nodes_in_way = []
        if "nd" == name:
            nodes_in_way.append(attrs['ref'])
        if "tag" == name:
            if "name" == attrs['k']:
                global way_name
                way_name = attrs['v']
            if "area" == attrs['k']:
                is_area = attrs['v']
    def end_element(name):
        global nodes_in_way
        if "way" == name and len(nodes_in_way)>1:
            global way_name
            if write_only_named and (way_name == ""):
                return
            is_poly = (nodes_in_way[0] == nodes_in_way[len(nodes_in_way)-1] and len(nodes_in_way)>=4)
            geojson = "{name: \"" + way_name + "\", geo: {type: '"
            if is_poly:
                geojson += "Polygon"
            else:
                geojson += "LineString"
            geojson += "', coordinates: ["
            if is_poly:
                geojson += "["
            for i in xrange(0, len(nodes_in_way)-1):
                nodeid = nodes_in_way[i]
                geojson += "[" + nodes[nodeid][0] + "," + nodes[nodeid][1]  + "],"
            nodeid = nodes_in_way[len(nodes_in_way) - 1]
            geojson += "[" + nodes[nodeid][0] + "," + nodes[nodeid][1]  + "]]"
            if is_poly:
                geojson += "]"
            geojson += "}}"
            if is_poly:
                polyout.write(geojson.encode('utf-8'))
                polyout.write("\n")
            else:
                lineout.write(geojson.encode('utf-8'))
                lineout.write("\n")
            nodes_in_way = []
            way_name = ""

    p = xml.parsers.expat.ParserCreate()
    p.StartElementHandler = start_element
    p.EndElementHandler = end_element
    p.ParseFile(open(infile, 'r'))
    exit(0)
