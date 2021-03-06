var mock = require('./mock.js');
var uuid = require('node-uuid');
var save = require('../../extensions/elastic/save');
var auth = require('../../extensions/authorization/Auth');
var _ = require("underscore");

/**
 * curl -XPOST https://localhost:8000/query/bbox/mock -d'{"minLat":"40","maxLat":"50","minLon":"40","maxLon":"50"}' --cert sean.pines.p12:schemaless --insecure --header "Content-Type:application/json"
 * @param app
 */
exports.init = function(app){
    app.post('/query/bbox/:source', auth.verifyUser, auth.verifySessionHeaders, function(req, res){
        var minLat = parseFloat(req.body.minLat);
        var minLon = parseFloat(req.body.minLon);
        var maxLat = parseFloat(req.body.maxLat);
        var maxLon = parseFloat(req.body.maxLon);
        var start = parseInt(req.body.start);
        var pageSize = parseInt(req.body.pageSize);
        var throttleMs = req.body.throttleMs ? parseInt(req.body.throttleMs) : 0;
        var userName = res.get('Parsed-User');
        var sessionId = res.get('Parsed-SessionId');
        var source = req.params.source;

        var queryId = req.body.queryId || uuid.v4();


        mock.query(minLat, maxLat, minLon, maxLon, start, pageSize, throttleMs, function(page){

            if (!page || page.length === 0){
                res.status(204);
                res.send();
                return;
            }

            save.writeGeoJSON(userName, sessionId, queryId, 'mock', page, function(err, results){
                if (err){
                    res.status(500);
                    res.send(err);

                } else {
                    res.status(200);
                    res.send(page);
                }
            });
        });

    });

    app.post('/query/bbox/mock/dummy', auth.verifyUser, auth.verifySessionHeaders, function(req, res){
        var queryId = uuid.v4();

        mock.query(40, 50, 40, 50, 0, 1000, 0, function(page){

            page.forEach(function(record){
                record.properties.queryId = queryId;
            });

            var userName = res.get('Parsed-User');
            var sessionId = res.get('Parsed-SessionId');
            save.writeGeoJSON(userName, sessionId, queryId, 'mock', page, function(err){
                if (err){
                    console.log('error: ' + err);
                    res.status(500);
                    res.send();
                } else {
                    console.log('ingest complete');
                    res.send();
                }
            });
        });

    });
};