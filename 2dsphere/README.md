# MongoDB 2dsphere demo

## Requirements and Setup

This simple test requires you have a running mongod loaded with whatever geo data you'd like to query for, and a simple python server.

 * mongod 2.3.2 or higher
 * python 2.6 or higher

### Setting up MongoDB
Create a database named geo with a collection called ny if you're loading the ny data.
Create an index on geo using this command:
    db.ensureIndex( { geo : '2dsphere' } )
    
This needs to be done before loading data due to some issues with some of the objects.

### Loading the geo data

Inside the data directory of this project's root there are three files containing geojson data for ny state.  Use the mongoimport application to import this geo data.  In this case we're using a database called `geo` and a collection called `ny`.  Run this command once for each file `ny-lines.json`, `ny-nodes.json`, and `ny-polygons.json`

    $ mongoimport -d geo -c ny --file data/ny-lines.json
    $ mongoimport -d geo -c ny --file data/ny-nodes.json
    $ mongoimport -d geo -c ny --file data/ny-polygons.json

### Setup the python requirements

To install the python dependencies required for the web server, we recomend scoping them with `virtualenv`.  So make sure that in addition to python youshould install `pip` and `virtualenv` through package management.  Once they are installed, go ahead and run the following commands to setup the virtual python environment.

    $ virtualenv venv
    $ source venv/bin/activate
    $ pip install -r requirements.txt


You also need to create a `config.yml` file in the projects root directory.  Consider `config.yml.sample` for the format and expected configuration details.

## Running the demo

Once you have satisfied all the above requirements, you can run the python server with:

    $ python www.py

The terminal will echo the url at which it is hosting the demo - unless you have made any changes this will be `localhost:8080`.  Point your browser to that url.

### Troubleshooting

If you installed the python requirements in a different shell session, you first need to re-activate the virtaul environment by running `$ source venv/bin/activate`.

## Using the demo

Click the map to place points at that lat/lng coordinate.  When you have selected 3 or more points, the server will consider those points as vertices of a polygon, and will return a list of points within that polygon.
