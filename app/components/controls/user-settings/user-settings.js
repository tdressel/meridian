define([
    './user-settings-publisher',
    'text!./user-settings-basemapList.hbs',
    'bootstrap',
    'bootstrapDialog',
    'handlebars'
], function (publisher,userSettingsListHBS) {

    var context,
        MENU_DESIGNATION = 'user-settings',
        menuDisabled, //If the whole menu is disabled
        drawOnDefault = true,
        $minLat,
        $minLon,
        $maxLat,
        $maxLon,
        $buttonToggleContainer,
        $userSettingsDialog;
    
    var exposed = {
        init:function(thisContext) {
            context = thisContext;
            $userSettingsDialog = context.$("#userSettingsDialog");

            if(context.options.label && context.options.label === true) {
                exposed.makeUserLabel();
                menuDisabled = true;
            }
            else{
                exposed.loadUserSettings();
                menuDisabled = false;
            }            
        },
        makeUserLabel: function() {
            //removed unwanted html and adds the required css files that give the looc and location of the button.
            context.$('.caret').remove();
            $userSettingsDialog.remove(); //to have a cleaner html.
            context.$('#userSettings').addClass('disabled');
        },
        loadUserSettings: function() {
            drawOnDefault = true;

            if(context.sandbox.queryConfiguration && 
                typeof context.sandbox.queryConfiguration.drawOnDefault !== undefined) {
                drawOnDefault = context.sandbox.queryConfiguration.drawOnDefault; 
            }

            /**
             * Creates the list of available base maps. 
             * 'option value=' is the base map name used for base map switches. e.g landscape, imagery, etc.
             * options.fn looks up the property specified in the hbs, in our case the 'label' property.
             * @param  {Array of JSON} items  Represents the base map array found in map-configuration.js
             * @param  {HandleBar Object} options  Contains: {Object}data, {function}fn, {Object}hash and {function}inverse.
             * @return {null}  Registers the Handlebar helper. 
             */
            Handlebars.registerHelper('list', function(items, options) {
                var out = '<select id="basemap-list" name="basemap-list" class="form-control">';
                for(var i= 0; i<items.length; i++) {
                    out = out +  '<option value=' +
                     context.sandbox.mapConfiguration.basemaps[i].basemap +
                     '>'+options.fn(items[i])+ '</option>';
                }
                return out + '</select>';
            });

            var userSettingsListTemplate = Handlebars.compile(userSettingsListHBS);

            /**
             * Set all the values of the template.
             * 'baseMaps' must contain 'label' property that will be
             * used as the value of the drop down option. e.g. OSM Landscape, etc.
             */
            var html = userSettingsListTemplate({
                "baseMaps": context.sandbox.mapConfiguration.basemaps,
                "minLon": context.sandbox.mapConfiguration.initialMinLon,
                "maxLat": context.sandbox.mapConfiguration.initialMaxLat,
                "maxLon": context.sandbox.mapConfiguration.initialMaxLon,
                "minLat": context.sandbox.mapConfiguration.initialMinLat
            });
            $userSettingsDialog.append(html);

            //After the html is populated, grab jquery objects
            $minLat = context.$('#user-settings-minLat');
            $minLon = context.$('#user-settings-minLon');
            $maxLat = context.$('#user-settings-maxLat');
            $maxLon = context.$('#user-settings-maxLon');
            $buttonToggleContainer = context.$('.btn-toggle-container');

            //auto-select the loaded base map in the drop down.
            context.$('option[value='+
                context.sandbox.mapConfiguration.defaultBaseMap +
                ']').attr('selected', 'selected');

            /**
             * user-settings button listener.
             */
            context.$('#userSettings').on('click', function(event) {
                event.preventDefault();
                $userSettingsDialog.dialog('toggle');
            });

            //Publish when shown
            $userSettingsDialog.on('shown.bs.dialog', function(){
                publisher.publishOpening({"componentOpening": MENU_DESIGNATION});
            });

            /**
             * user-settings cancel button listener.
             */
            context.$('.form-horizontal button[type="cancel"]').on('click', function(event) {
                event.preventDefault();

                $userSettingsDialog.dialog('hide');
                resetDialog();
            });

            /**
             * user-settings close 'x' button listener.
             */
            context.$('.dialog-header button[type="button"].close').on('click', function(event) {
                //TODO publish on channel
                exposed.closeMenu();
            });

            /**
             * user-settings submit button listener.
             */
            context.$('#userSettingsDialog button[type="save"]').on('click', function(event) {
                event.preventDefault();

                var preferencesSaveStatus,
                    minLon = $minLon.val() || '',
                    maxLat = $maxLat.val() || '',
                    maxLon = $maxLon.val() || '',
                    minLat = $minLat.val() || '',
                    errorFree = true;

                if(isNaN(minLon) || !isFinite(minLon) || minLon === ''){
                    $minLon.parent().addClass('has-error');
                    errorFree = false;
                }
                if(isNaN(maxLat) || !isFinite(maxLat) || maxLat === ''){
                    $maxLat.parent().addClass('has-error');
                    errorFree = false;
                }
                if(isNaN(maxLon) || !isFinite(maxLon) || maxLon === ''){
                    $maxLon.parent().addClass('has-error');
                    errorFree = false;
                }
                if(isNaN(minLat) || !isFinite(minLat) || minLat === ''){
                    $minLat.parent().addClass('has-error');
                    errorFree = false;
                }

                if($buttonToggleContainer.find('.btn-on').hasClass('btn-primary')) {
                    drawOnDefault = true;
                }else {
                    drawOnDefault = false;
                }

                if(errorFree) {
                    removeCssError();
                    $userSettingsDialog.dialog('hide');
                    //save contents to memory
                    preferencesSaveStatus = context.sandbox.utils.preferences.set('john', {
                        "mapConfiguration": {
                            "initialMinLon": minLon,
                            "initialMaxLat": maxLat,
                            "initialMaxLon": maxLon,
                            "initialMinLat": minLat,
                            "defaultBaseMap": context.$('#basemap-list').val()
                        },
                        "queryConfiguration": {
                            "drawOnDefault": drawOnDefault
                        }
                    });

                    if(preferencesSaveStatus) {
                        publisher.publishMessage({
                            "messageType": "success",
                            "messageTitle": "User Settings",
                            "messageText": "User settings saved."
                        });
                    }else {
                        publisher.publishMessage({
                            "messageType": "error",
                            "messageTitle": "User Settings",
                            "messageText": "User settings failed to save."
                        });
                    }
                }else {
                    publisher.publishMessage({
                        "messageType": "error",
                        "messageTitle": "User Settings",
                        "messageText": "Invalid coordinates."
                    });
                }
            });

            /**
             * user-settings getExtent button listener.
             */
            context.$('.form-horizontal button[type="extent"]').on('click', function(event) {
                event.preventDefault();
                publisher.getExtent({"target":"userSettings"});
            });

            /**
             * user-settings default query tool button listener.
             */
            $buttonToggleContainer.find('.btn-toggle').on('click', function(event) {
                event.preventDefault();
                if(context.$(this).find('.btn-primary').size()>0) {
                    context.$(this).find('.btn').toggleClass('btn-primary');
                }
            });

            if(drawOnDefault) {
                $buttonToggleContainer.find('.btn-on').addClass('btn-primary');
                $buttonToggleContainer.find('.btn-off').removeClass('btn-primary');
            } else {
                $buttonToggleContainer.find('.btn-on').removeClass('btn-primary');
                $buttonToggleContainer.find('.btn-off').addClass('btn-primary');
            }
        },
        populateCoordinates: function(args) {
            if(args.target === 'userSettings') {
                removeCssError();
                $minLon.val(args.minLon);
                $maxLat.val(args.maxLat);
                $maxLon.val(args.maxLon);
                $minLat.val(args.minLat);

                publisher.publishMessage({
                    "messageType": "success",
                    "messageTitle": "User Settings",
                    "messageText": "Extent loaded. Remember to save."
                });
            }
        },
        closeMenu: function(){
            if(menuDisabled){
                return;
            }
            $userSettingsDialog.dialog('hide');

            resetDialog();
        },
        handleMenuOpening: function(args){
            if(args.componentOpening === MENU_DESIGNATION){
                return;
            }else{
                exposed.closeMenu();
            }
        }
    };

    /**
     * Remove error css class from coordinate fields.
     * @return {null} Visual changes to HTML.
     */
    function removeCssError(){
        context.$('.has-error').removeClass('has-error');
    }

    /**
     * Clears and set fields to default values.
     * @return {null} Visual changes to HTML.
     */
    function resetDialog() {
        //clear any css error classes applied to any field.
        removeCssError();

        //set all coordinate fields to their default value.         
        $minLon.val(context.sandbox.mapConfiguration.initialMinLon);
        $maxLat.val(context.sandbox.mapConfiguration.initialMaxLat);
        $maxLon.val(context.sandbox.mapConfiguration.initialMaxLon);
        $minLat.val(context.sandbox.mapConfiguration.initialMinLat);
        //set the default dropdown basemap value.
        context.$('option[value=' + context.sandbox.mapConfiguration.defaultBaseMap + ']').attr('selected', 'selected');
        //set the correct state of the query tool toggle button.
        if(drawOnDefault) {
            $buttonToggleContainer.find('.btn-on').addClass('btn-primary');
            $buttonToggleContainer.find('.btn-off').removeClass('btn-primary');
        }else {
            $buttonToggleContainer.find('.btn-on').removeClass('btn-primary');
            $buttonToggleContainer.find('.btn-off').addClass('btn-primary');
        }
    }

    return exposed;
});