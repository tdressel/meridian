define([
], function() { 
  var pubConfiguration = {
    "channels":{
      "map.overlay.create":{
        valid:true
      },
      "map.overlay.remove":{
        valid: false
      },
      "map.overlay.hide":{
        valid: true
      },
      "map.overlay.show":{
        valid: true
      },
      "map.feature.plot":{
        valid: true,
        sample: {
           "overlayId":"2d882141-0d9e-59d4-20bb-58e6d0460699.1",
           "featureId":"example.geojson.1",
           "format":"geojson",
           "feature":{
              "type":"FeatureCollection",
              "features":[
                 {
                    "type": "Feature",
                    "geometry": {
                      "type": "Point",
                      "coordinates": [0.0, 10.0]
                    },
                    "properties": {
                       "style":{
                          "fillColor":"red"
                       }
                    }
                 }
              ]
           },
           "name":"Sample GeoJSON Feature Collection",
           "zoom":"true",
           "readOnly":"false"
        }
      }      
    }
  };

  return pubConfiguration;
});