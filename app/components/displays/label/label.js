define([
    'bootstrap',
    'bootstrapDialog',
    'jqueryUI'
], function () {
    var context;

	var exposed = {
        init: function(thisContext) {
            context = thisContext;
            context.$("#labelContainer").draggable({ handle: ".dialog-header" });
        },
        createLabel: function(args) {
            var labelTitle = args.title;
            var labelDescription = args.description;

            if(labelTitle === undefined){
                labelTitle = "No Title";
            }
            
            if(labelDescription === undefined){
                labelDescription = "No Description";
            }

            context.$('.dialog-title').html(labelTitle);
            context.$('.dialog-body').html(labelDescription);    
            context.$('#labelContainer').dialog('show');
        },
        removeLabel: function(){
            context.$('#labelContainer').dialog('hide');
        }
    };

    return exposed;
});