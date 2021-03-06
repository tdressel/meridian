define([
    './locator-publisher',
    'typeahead',
    'bootstrap'
], function (publisher) {
    var context,
        timeout,
        selectedLocation = null,
        dataByName = {},
        $locator,
        $locatorButton,
        $locatorInput,
        COORDINATE_REGEX = /(^-?)\d+(\.\d+)?,[\s-]*-?\d+(\.\d+)?\s*$/; //Useful regex

    var exposed = {
        init: function(thisContext) {
            context = thisContext;
            $locator = context.$('#locator');
            $locatorButton = context.$('#locator .btn');
            $locatorInput = context.$('#locator input');
            $locatorButton.attr('disabled', true);      /*Valid location must be selected before button is enabled.*/

            $locatorButton.on('click', function(event) {
                var input = $locatorInput.val();
                event.preventDefault();

                if(input.match(COORDINATE_REGEX)) { 
                    var coordinates = input.split(',');
                    coordinates = {
                        lon: parseFloat(coordinates[0], 10),
                        lat: parseFloat(coordinates[1], 10)
                    };

                    exposed.markLocation(coordinates);
                }else if(selectedLocation === null) {/*Extra precaution, button should be disabled anyways.*/
                    publisher.publishMessage({
                        messageType: 'warning',
                        messageTitle: 'Search',
                        messageText: 'No valid location selected. Please try again.'
                    });
                }else {
                    exposed.goToLocation();
                }
            });

            $locatorInput.on('keydown', function(e) {
                if (e.keyCode === 13) {
                    var input = $locatorInput.val();
                    if(input.match(COORDINATE_REGEX)) { 
                        var coordinates = input.split(',');
                        coordinates = {
                            lon: parseFloat(coordinates[0], 10),
                            lat: parseFloat(coordinates[1], 10) 
                        };

                        exposed.markLocation(coordinates);
                    }else if(selectedLocation === null) {
                        publisher.publishMessage({
                            messageType: 'warning',
                            messageTitle: 'Search',
                            messageText: 'No valid location selected. Please try again.'
                        });
                    }else {
                        exposed.goToLocation();
                    }
                }
            });

            //Needed for typeahead functionality.
            $locatorInput.attr('data-provide', 'typeahead');
            $locatorInput.typeahead({
                items: 15,

                /* Source occurs after a new character is added. Defaults to 1.
                 * change selectedLocation to null after evey key event and disable search button.
                 * To prevent the ajax call from happening after every new character, a
                 * timeout delay has been added.*/
                source: function(query,process) {
                    selectedLocation = null;
                    $locatorButton.attr('disabled', true);

                    if(timeout) {
                        clearTimeout(timeout);
                    }
                    timeout = setTimeout(function() {
                        var content = $locatorInput.val().length || null;

                        /*No need to query empty input*/
                        if(content !== null) {

                            //Handle both coordinates and places
                            if(query.match(/^-/) || query.match(/^-?\d/)) {
                                if(query.match(COORDINATE_REGEX)) { 
                                    $locatorButton.attr('disabled', false);
                                }
                            }else { 
                                publisher.publishMessage({
                                    messageType: 'info',
                                    messageTitle: 'Looking up suggestions',
                                    messageText: 'Validating ...'
                                });
                                context.sandbox.locator.query(query, function(data){
                                   var formattedData = context.sandbox.locator.formatData(data);
                                    if(formattedData.names === []) {
                                        publisher.publishMessage({
                                            messageType: 'warning',
                                            messageTitle: 'Search Results',
                                            messageText: 'No results/suggestions found.'
                                        });
                                    } else {
                                        dataByName = formattedData.data;
                                    }
                                    process(formattedData.names); 
                                }); 
                                
                            }                            
                        }
                    }, 800);
                },

                /* Called by bootstrap once the user selects an item.
                 * Must return item.
                 * Item is added to the input box.*/
                updater:function(item) {
                    selectedLocation = dataByName[item];
                    publisher.publishMessage({
                        messageType: 'success',
                        messageTitle: 'Search',
                        messageText: 'Valid location selected.'
                    });

                    $locatorButton.attr('disabled', false);
                    return item;
                }
            });
        },
        goToLocation: function() {
            publisher.zoomToLocation({
                minLon: selectedLocation.minLon,
                minLat: selectedLocation.minLat,
                maxLon: selectedLocation.maxLon,
                maxLat: selectedLocation.maxLat
            });
            $locatorInput.val('');
            $locatorButton.attr('disabled',true);
        },//end of goToLocation
        markLocation: function(coordinates) {
            publisher.markLocation(context.sandbox.utils.createGeoJson(coordinates));
            publisher.setMapCenter(coordinates);
        },
        clear: function() {
            clearTimeout(timeout);
            $locatorInput.val('');
        }
    };

    return exposed;
});