define([
	'./cluster-toggle'
], function (clusterToggle) {

    var context;

	var exposed = {
        init: function(thisContext){
            context = thisContext;
            context.sandbox.on('notification.confirm', clusterToggle.checkConfirmation);
            context.sandbox.on('system.clear', clusterToggle.clear);
        }
    };	

    return exposed;

});