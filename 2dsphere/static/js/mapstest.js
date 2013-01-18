
function init(){
    function clearInfos(){
            for(i=0; i < infoList.length; i++){
                infoList[0].close();
            }
            markerList = [];
    }
    function clearMarkers(){
            for(i=0; i < markerList.length; i++){
                marker = markerList[i];
                marker.setMap(null);
            }
            markerList = [];
    }
    mapOptions = {
        center: new google.maps.LatLng(40.663973,-73.947807),
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("map"), mapOptions);

    pointList = [];
    markerList = [];
    infoList = [];
    polygon = undefined;

    google.maps.event.addListener(map, 'click', function(event){
        pointList.push(event.latLng);
        if(pointList.length < 3){
            markerOptions = {
                position: event.latLng
            };
            marker = new google.maps.Marker(markerOptions);
            marker.setMap(map);
            markerList.push(marker);
        }else{
            clearMarkers();
            if(polygon != undefined){
                polygon.setMap(null);
            }

            polyOptions = {
                paths: pointList,
                strokeColor: '#0000000',
                strokeOpacity: 0.8,
                fillOpacity: 0.0
            };
            polygon = new google.maps.Polygon(polyOptions);
            polygon.setMap(map);

            query_string = "?"
            for(i=0; i < pointList.length; i++){
                if(i != 0){ query_string += "&"}
                query_string += "point_lats=" + pointList[i].lat() + "&";
                query_string += "point_lngs=" + pointList[i].lng()
            }
            $.getJSON("withinSearch" + query_string, function(data){
                clearMarkers();
                clearInfos();
                for(i=0;i<data.length;i++){
                    geo_elem = data[i];
                    if(geo_elem['geo']['type'] === "Point"){
                        coord = geo_elem['geo']['coordinates']
                        pos = new google.maps.LatLng(coord[1], coord[0]);
                        markerOptions = {
                            position: pos
                        };
                        marker = new google.maps.Marker(markerOptions);
                        marker.setMap(map);
                        //Build me a closure, worthy of Mordor.
                        (function(marker, geo_elem){
                            google.maps.event.addListener(marker, 'click', function(){
                                clearInfos();
                                console.log(marker, geo_elem);
                                opts = {
                                    position: marker.getPosition(),
                                    content: geo_elem.name
                                }
                                info = new google.maps.InfoWindow(opts);
                                info.open(map);
                                infoList.push(info);
                            });
                        })(marker, geo_elem);
                        markerList.push(marker);
                    }
                }
            });
        }
    });

}
