mongodb-graphson
================

This project provides examples of importing/exporting GraphSON data files to/from MongoDB.

## Javascript / Mongo Shell

Simple transformations between GraphSON data files and vertex/edge collections in MongoDB can be implemented using basic javascript executed via the MongoDB shell utility. 
For example, to load the provided test GraphSON file into a local instance of MongoDB, the following can be executed from the repository root directory :

    $ mongo --eval fileName=\"javascript/test.txt\" ./javascript/load-graphson.js 

To export the graph data stored in the local MongoDB instance, the export script can be executed as follows :

    $ mongo --quiet ./javascript/export-graphson.js > output.json

## Java Import/Export Tool

While the MongoDB shell utility is ideal for small import/export tasks, larger datasets are typically better handled using a dedicated MongoDB client. This project contains a MongoDB Java application that can be used for streaming to/from large GraphSON files.

Prerequisites are Maven and Java 6 or later JDK, the tool can be built, tested and packaged as follows :

    $ mvn package

This generates a self contained JAR, to see full usage, use the --help option :

    $ java -jar ./target/mongodb-graphson-0.1.0-SNAPSHOT.jar --help
    
    Usage: GraphSONTool [options] [command] [command options]
      Options:
        --dburi  MongoDB URI for target database
                 Default: mongodb://localhost:27017/graph
        --ec     Name of collection for storing edge data
                 Default: edges
        --vc     Name of collection for storing vertex data
                 Default: vertices
        --help   Print this message
  
      Commands:
    
      export      Export MongoDB database to GraphSON
        Usage: export [options] Path of exported data file

      import      Import GraphSON files
        Usage: import [options] The list of files to import
        Options:
          --drop        Drop existing any existing data in graph collections
                        Default: false
          --duplicates  Mode used for handling duplicates in existing data. Must be ignore, update or fail
                        Default: ignore
     
The tool has commands for import/export and options for handling existing/duplicate data during import. For example, the following command can be used to import the test GraphSON file and update any vertex/edge objects that already exist with the new data in the file :

    $ java -jar ./target/mongodb-graphson-0.1.0-SNAPSHOT.jar import --duplicates=update javascript/test.txt 
    Importing javascript/test.txt into mongodb://localhost:27017/graph...

