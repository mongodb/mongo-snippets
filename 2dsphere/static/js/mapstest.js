function init(){
    /*
     * These lists are used for storing the map elements we store on the map
     * so that we can clean them up between searches
     */
    var pointList = [];
    var markerList = [];
    var infoList = [];
    var lineList = [];
    var polygon = undefined;
    var line = undefined;
    var mapOptions = {
        center: new google.maps.LatLng(40.663973,-73.947807), //Brooklyn!
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var map = new google.maps.Map(document.getElementById("map"), mapOptions);
    var mode = "$within";
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
        return controlDiv;
    }
    function createOption(option, $controlDiv){
        var controlUI = createButton(option, $controlDiv, mode === option);
        google.maps.event.addDomListener(controlUI, 'click', function(){
            mode = option;
            $(".maps-ui").removeClass("maps-ui-control-select");
            $(controlUI).addClass("maps-ui-control-select");
            clearMapAndInteractions();
        });
    }
    function createButton(text, $wrapperDiv, selected){
        var controlUI = document.createElement('div');
        var $controlUI = $(controlUI);
        $controlUI.addClass("maps-ui");
        $controlUI.text(text);
        $wrapperDiv.append($controlUI);
        if (selected){
            $controlUI.addClass("maps-ui-control-select");
        }
        return controlUI;
    }
    function clearMapAndInteractions(){
        pointList = [];
        clearMap();
    }
    function clearMap(){
        //Clear global polygon object
        if(polygon != undefined){
            polygon.setMap(null);
        }
        if(line != undefined){
            line.setMap(null);
        }
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
    function drawPolygon(){
        polyOptions = {
            paths: pointList,
            strokeColor: '#0000000',
            strokeOpacity: 0.8,
            fillOpacity: 0.0
        };
        polygon = new google.maps.Polygon(polyOptions);
        polygon.setMap(map);
    }
    function drawSearchLine(){
        line = new google.maps.Polyline({
            path: pointList,
            strokeColor: "#000000",
            strokeOpacity: 1.0,
            strokeWeight: 2
        });
        line.setMap(map);
    }
    function queryString(){
        // This is a pretty lousy way to encode these points, but
        // web.py is awkward with array parsing, and this is a
        // quick and dirty way around that.
        var queryString = "?mode=" + mode + "&";
        for(i=0; i < pointList.length; i++){
            if(i != 0){ queryString += "&"}
            queryString += "point_lats=" + pointList[i].lat() + "&";
            queryString += "point_lngs=" + pointList[i].lng()
        }
        return queryString;
    }
    function drawPoint(coordinate, name){
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
    google.maps.event.addListener(map, 'click', function(event){
        if(mode === "$within"){
            pointList.push(event.latLng);
            var marker;
            if(pointList.length < 3){
                //If there aren't yet 3 points on the map, draw markers.
                marker = new google.maps.Marker({
                    position: event.latLng
                });
                marker.setMap(map);
                markerList.push(marker);
            }else{
                //We have a polygon!
                clearMap();
                drawPolygon();
                $.getJSON("geoSearch" + queryString(), drawMapData);
            }
        }else if(mode === "$geoIntersects"){
            pointList.push(event.latLng);
            if(pointList.length < 2){
                //If there aren't yet 2 points on the map, draw markers.
                marker = new google.maps.Marker({
                    position: event.latLng
                });
                marker.setMap(map);
                markerList.push(marker);
            }else{
                //We have a line!
                clearMap();
                drawSearchLine();
                $.getJSON("geoSearch" + queryString(), drawMapData);
            }
        }else if(mode === "$near"){
            clearMap();
            if(pointList.length >= 1){
                pointList = [];
            }
            pointList.push(event.latLng);
            marker = new google.maps.Marker({
                position: event.latLng
            });
            marker.setMap(map);
            markerList.push(marker);
            $.getJSON("geoSearch" + queryString(), drawMapData);
        }
    });

}
