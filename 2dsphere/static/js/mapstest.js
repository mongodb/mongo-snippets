function init(){
    /*
     * These lists are used for storing the map elements we store on the map
     * so that we can clean them up between searches
     */
	var pointLists = [[]];
    var pointList = pointLists[0];
    var markerList = [];
    var infoList = [];
    var lineList = [];
    var polygons = [];
    var lines = [];
    var mapOptions = {
        center: new google.maps.LatLng(40.663973,-73.947807), //Brooklyn!
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var map = new google.maps.Map(document.getElementById("map"), mapOptions);
    var mode = "$within";
	var polymode = "polygon";
    setupCustomControls();
    function setupCustomControls(){
        var controlDiv = setupOptionsControl();
        map.controls[google.maps.ControlPosition.TOP_CENTER].push(controlDiv);
        var clearDiv = setupClearControl();
        map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(clearDiv);
    }

    function setupClearControl(){
        var controlDiv = document.createElement('div');
        var $controlDiv = $(controlDiv);
        controlUI = createButton("Clear", $controlDiv, true);
        google.maps.event.addDomListener(controlUI, 'click', function(){
            clearMapAndInteractions();
        });
        return controlUI;
    }
    function setupOptionsControl(){
        var options = ["$within", "$geoIntersects", "$near"];
        var controlDiv = document.createElement('div');
        var $controlDiv = $(controlDiv);
        for(var i = 0; i < options.length; i++){
            createOption(options[i], $controlDiv);
        }
		var geos = ["line", "polygon"];
		for(var i = 0; i < geos.length; i++) {
			addGeoButton(geos[i], $controlDiv);
		}
		addPlusButton("+", $controlDiv);
        return controlDiv;
    }
    function createOption(option, $controlDiv){
        var controlUI = createButton(option, $controlDiv, mode === option);
        google.maps.event.addDomListener(controlUI, 'click', function(){
            mode = option;
            $(".maps-ui-options").css("background-color", "#ffffff");
            $(".maps-ui-options").removeClass("maps-ui-control-select");
			$(controlUI).css("background-color", "#e0e0e0");
			$(controlUI).addClass("maps-ui-control-select");
            clearMapAndInteractions();
			
			// toggle geometry buttons
			if (option != "$geoIntersects") {
				$(".maps-ui-geo-button").hide();
			}
			else {
				$(".maps-ui-geo-button").show();
			}

			// set correct shape mode
			if (mode == "$within") polymode = "polygon";
			if (mode == "$near") polymode = "point";
			//		if (mode == "$geoIntersects") polymode = "line";

			// reset the pointlists
			pointLists = [[]];
			pointList = pointLists[0];
        });
		if (option == "$within") {
			$(controlUI).css("background-color", "#e0e0e0");
		}
    };
	function addGeoButton(option, $controlDiv) {
		// when a user clicks, set some polymode
        var controlUI = document.createElement('div');
        var $controlUI = $(controlUI);
        $controlUI.addClass("maps-ui");
        $controlUI.addClass("maps-ui-geo-button");
		$controlUI.css("background-color", "#ABE096");
		$controlUI.hide(); // hide unless in $geoIntersect mode
        $controlUI.text(option);
		$controlDiv.append($controlUI);

        google.maps.event.addDomListener(controlUI, 'click', function(){
				$(".maps-ui-geo-button").css("background-color", "#ABE096");
				$(controlUI).css("background-color", "#83BA6E");
				newGeometry(polymode);
				polymode = option;
				console.log("polymode: " + polymode);
        });
		if (option == "line") $(controlUI).css("background-color", "#83BA6E");
        return controlUI;
	};
	function newGeometry(type) {
		// type is the kind of the previous geometry, to be closed.
		var length = pointList.length;
		if (length == 0) return;

		// if incomplete polygon, degenerate into line
		if (type == "polygon" && length > 2) {
			pointList.push(pointList[0]); // close the polygon
		}
		pointLists.push([]);
		pointList = pointLists[pointLists.length - 1];
	};

	function addPlusButton(option, $controlDiv) {
		// when user clicks, start new path in same query
        var controlUI = document.createElement('div');
        var $controlUI = $(controlUI);
        $controlUI.addClass("maps-ui");
        $controlUI.addClass("maps-ui-plus-button");
        $controlUI.text(option);
		$controlUI.css("background-color", "#F7EC97");
		$controlDiv.append($controlUI);

        google.maps.event.addDomListener(controlUI, 'click', function(){
				if (mode == "$near") return;
				if (pointList.length == 0) return;
				newGeometry(polymode);
        });
	}
    function createButton(text, $wrapperDiv, selected){
        var controlUI = document.createElement('div');
        var $controlUI = $(controlUI);
        $controlUI.addClass("maps-ui");
        $controlUI.addClass("maps-ui-options");
        $controlUI.text(text);
        $wrapperDiv.append($controlUI);
        if (selected){
            $controlUI.addClass("maps-ui-control-select");
        }
        return controlUI;
    }
    function clearMapAndInteractions(){
        pointLists = [[]];
		pointList = pointLists[0];
        clearMap();
    }
    function clearMap(){
        // Clear global polygon and line objects
		for (var i = 0; i < polygons.length; i++) {
            polygons[i].setMap(null);
        }
		polygons = [];
		for (var i = 0; i < lines.length; i++) {
            lines[i].setMap(null);
        }
		lines = [];
        clearInfos();
        clearMarkers();
        clearLines();
    }
    function clearInfos(){
        for(var i=0; i < infoList.length; i++){
            infoList[i].close();
        }
        infoList = [];
    }
    function clearMarkers(){
        for(var i=0; i < markerList.length; i++){
             marker = markerList[i];
             marker.setMap(null);
         }
         markerList = [];
    }
    function clearLines(){
        for(var i=0; i < lineList.length; i++){
            line = lineList[i];
            line.setMap(null);
        }
        lineList = [];
    }
    function drawPolygon(list){
		console.log("drawing polygon on " + list);
		polyOptions = {
			paths: list,
			strokeColor: '#0000000',
			strokeOpacity: 0.8,
			fillOpacity: 0.0
		};
		var newgon = new google.maps.Polygon(polyOptions);
		polygons.push(newgon);
		newgon.setMap(map);
	}
    function drawSearchLine(list){
		options = {	
			path: list,
			strokeColor: "#000000",
			strokeOpacity: 1.0,
			strokeWeight: 2
		};
		var newline = new google.maps.Polyline(options);
		lines.push(newline);
		newline.setMap(map);
    }
	function drawSearchPoint(coords) {
		var marker = new google.maps.Marker({
				position:coords
			});
		marker.setMap(map);
		markerList.push(marker);
	}
    function queryString(){
        // This is a pretty lousy way to encode these points, but
        // web.py is awkward with array parsing, and this is a
        // quick and dirty way around that.
        var queryString = "?mode=" + mode + "&";
		queryString += "path_count=" + pointLists.length;
		for (var j = 0; j < pointLists.length; j++) {
			queryString += "&";
			var list = pointLists[j];

			// close current polygon
			if ((j == pointLists.length - 1) &&
				(mode == "$within" || polymode == "polygon")) { 
				queryString += "length_" + j + "=" + (list.length + 1) + "&";
				for(i=0; i < list.length; i++){
					if(i != 0){ queryString += "&"}
					queryString += "point_lats=" + list[i].lat() + "&";
					queryString += "point_lngs=" + list[i].lng();
				}
				queryString += "&";
				queryString += "point_lats=" + list[0].lat() + "&";
				queryString += "point_lngs=" + list[0].lng();
			}
			else {
				queryString += "length_" + j + "=" + list.length + "&";
				for(i=0; i < list.length; i++){
					if(i != 0){ queryString += "&"}
					queryString += "point_lats=" + list[i].lat() + "&";
					queryString += "point_lngs=" + list[i].lng();
				}
			}
		}
		console.log(queryString);
		return queryString;
    }
    function drawPoint(coordinate, name){
		// results from the query
        var marker = new google.maps.Marker({
            position: new google.maps.LatLng(coordinate[1], coordinate[0]),
            icon: "static/images/point.gif"
        });
        marker.setMap(map);
        google.maps.event.addListener(marker, 'click', function(){
            clearInfos();
            info = new google.maps.InfoWindow({
                position: marker.getPosition(),
                content: name
            });
            info.open(map);
            infoList.push(info);
        });
        markerList.push(marker);
    }
    function drawLine(coordinates){
		// results from the query
        var linePath = [];
        var line;
        var point;
        for(var i = 0; i < coordinates.length; i++){
            point = coordinates[i];
            linePath.push(new google.maps.LatLng(point[1], point[0]));
        }
        line = new google.maps.Polyline({
            path: linePath,
            strokeColor: "#FF0000",
            strokeOpacity: 1.0,
            strokeWeight: 2
        });
        line.setMap(map);
        lineList.push(line);
    }
    function drawMapData(data){
        var geo_elem;
        var name;
        for(var i=0;i<data.length;i++){
            name = data[i]['name']
            geo_elem = data[i]['geo'];
            if(geo_elem['type'] === "Point"){
                drawPoint(geo_elem['coordinates'], name);
            }else if(geo_elem['type'] === "LineString"){
                drawLine(geo_elem['coordinates']);
            }
        }
    }
	function isPolygon(list) {
		// just to be super careful...
		var p1 = list[0];
		var p2 = list[list.length - 1];
		if (p1.lat() != p2.lat()) return false;
		if (p1.lng() != p2.lng()) return false;
		return true;
	}
	function drawAllClosedPaths() {
		// does not handle open path (in pointList) 
		for (var i = 0; i < (pointLists.length - 1); i++) {
			var length = pointLists[i].length;
			if (length == 1) {
				drawSearchPoint(pointLists[i][0]);
			}
			else if (length == 2) {
				drawSearchLine(pointLists[i]);
			}
			else {
				if (isPolygon(pointLists[i])) {
					drawPolygon(pointLists[i]);
				}
				else {
					drawSearchLine(pointLists[i]);			
				}
			}
		}
	}

    google.maps.event.addListener(map, 'click', function(event){
			// $near: toss previous shapes, draw current point, query
			// $within: draw existing gons, draw current gon, run query
			// $geoIntersects: check mode:
			//       polygon: draw existing shapes, current shape, run query
			//       line: draw existing shapes, current shape, run query
			//       point: draw existing shapes, current shape, close current shape, query
			if(mode == "$within" || polymode == "polygon"){
				pointList.push(event.latLng);
				if(pointList.length < 3){
					//If there aren't yet 3 points on the map, draw markers.
					drawSearchPoint(event.latLng);
				}else{
					//We have a polygon!
					clearMap();
					drawAllClosedPaths();
					drawPolygon(pointList); 
					$.getJSON("geoSearch" + queryString(), drawMapData);
				}
			}
			else if(polymode === "line"){
				pointList.push(event.latLng);
				if(pointList.length < 2){
					//If there aren't yet 2 points on the map, draw markers.
					drawSearchPoint(event.latLng);
				}
				else{
					//We have a line!
					clearMap();
					drawAllClosedPaths();
					drawSearchLine(pointList);
					$.getJSON("geoSearch" + queryString(), drawMapData);
				}
			}
			else if(mode === "$near") {
				clearMap();
				pointLists = [[]];
				pointList = pointLists[0]
				pointList.push(event.latLng);
				drawSearchPoint(event.latLng);
				$.getJSON("geoSearch" + queryString(), drawMapData);
			}
		});

}
