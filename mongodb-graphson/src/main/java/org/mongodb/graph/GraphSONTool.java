package org.mongodb.graph;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.List;

import com.beust.jcommander.JCommander;
import com.beust.jcommander.Parameter;
import com.beust.jcommander.Parameters;
import com.mongodb.DB;
import com.mongodb.MongoClient;
import com.mongodb.MongoClientURI;

public class GraphSONTool {

	static class MainArgs {
		
		private static final String DEFAULT_MONGODB_ENDPOINT = "mongodb://localhost:27017/";
		@Parameter(names = "--dburi", description = "MongoDB URI for target database")
		private String dburi = DEFAULT_MONGODB_ENDPOINT + GraphSON.GRAPH;

		@Parameter(names = "--vc", description = "Name of collection for storing vertex data")
		private String vertexCollectionName = GraphSON.VERTICES;

		@Parameter(names = "--ec", description = "Name of collection for storing edge data")
		private String edgeCollectionName = GraphSON.EDGES;

		@Parameter(names = "--help", help = true, description = "Print this message")
		private boolean help;
	}


	@Parameters(separators = "=", commandDescription = "Import GraphSON files")
	static class CommandImport {

		@Parameter(description = "The list of files to import")
		private List<String> files;

		@Parameter(names = "--duplicates", description = "Mode used for handling duplicates in existing data. Must be ignore, update or fail")
		private DuplicateMode duplicateMode = DuplicateMode.IGNORE;

		@Parameter(names = "--drop", description = "Drop existing any existing data in graph collections")
		private boolean drop = false;
	}


	@Parameters(separators = "=", commandDescription = "Export MongoDB database to GraphSON")
	static class CommandExport {

		@Parameter(description = "Path of exported data file")
		private List<String> target;
	}

	public static void main(String[] args){
		
		// Setup the arg parser
		MainArgs mainArgs = new MainArgs();
		JCommander argParser = new JCommander(mainArgs);
		argParser.setProgramName(GraphSONTool.class.getSimpleName());

		// Add the import and export commands
		CommandExport exportCmd = new CommandExport();
		argParser.addCommand("export", exportCmd);
		CommandImport importCmd = new CommandImport();
		argParser.addCommand("import", importCmd);

		try{
			// Parse args and show help if requested
			argParser.parse(args);					
			if(mainArgs.help){
				argParser.usage();
				System.exit(0);
			}
			
			// Get a reference to the database
	    	MongoClientURI uri = new MongoClientURI(mainArgs.dburi);
	    	MongoClient client = new MongoClient(uri);
	    	DB database = client.getDB(uri.getDatabase());	
			
			if(argParser.getParsedCommand() == null){
				System.err.println("No command specified, try --help");
				
			} else if(argParser.getParsedCommand().equals("export")){
		    	
				// Export command, create the writer
				GraphSONWriter writer = new GraphSONWriter(database, 
		    			mainArgs.vertexCollectionName, mainArgs.edgeCollectionName);
		    	
				// If there are multiple target files, write to each of them
		    	for(String jsonPath : exportCmd.target ){
		    		OutputStream jsonStream = new FileOutputStream(jsonPath);
					System.out.println("Exporting " + uri.toString() + " to " + jsonPath + "...");
		    		writer.writeGraph(jsonStream);
		    		jsonStream.close();
		    	}
				
			} else if(argParser.getParsedCommand().equals("import")){
				
		    	// Create the graph listener for the mongodb database				
		    	MongoDBListener listener = new MongoDBListener(
		    			database, importCmd.drop, importCmd.duplicateMode,
		    			mainArgs.vertexCollectionName, mainArgs.edgeCollectionName);
		    	GraphSONReader reader = new GraphSONReader(listener);

		    	// Use the reader to import all specified files
		    	for(String jsonPath : importCmd.files ){
					InputStream jsonStream = new FileInputStream(new File(jsonPath));
					System.out.println("Importing " + jsonPath + " into " + uri.toString() + "...");
			    	reader.readGraph(jsonStream);
			    	jsonStream.close();
		    	}
		    	
		    	listener.close();
			} 
			
		} catch(Exception pex){
			System.err.println("Error running tool : " + pex.getMessage());
		}
	}
}

