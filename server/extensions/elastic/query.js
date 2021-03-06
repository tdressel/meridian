var config = require('../utils/Config').getConfig();
var client = require('./client').newClient();
var stream = require('./stream');

var getJSONByQuery = function(routing, index, type, query, callback){

    var searchObj = {};
    searchObj.index = index;
    if (routing) { searchObj.routing = routing; }
    searchObj.body = query;


    client.search(searchObj).then(function(resp){
        callback(null, resp);
    }, function(err){
        callback(err, null);
    });
};

var getJSONById = function(routing, index, type, id, callback){

    var req = {
        index: index,
        type: type || '_all',
        id: id
    };

    if (routing){ req.routing = routing; }

    client.get(req).then(function(resp){
        callback(null, resp);
    }, function(err){
        callback(err, null);
    });
};

exports.executeQuery = function(userName, sessionId, query, callback){

   var newQuery = {
       query: {
           filtered: {
               query: query.query,
               filter: {
                   term: {
                       userName: userName,
                       sessionId: sessionId
                   }
               }
           }
       }
   };

   if (query.sort) {newQuery.sort = query.sort; }

   getJSONByQuery(userName+""+sessionId, config.index.data, null, newQuery, callback);

};

exports.streamQuery = function(userName, sessionId, query, pageSize, pageCallback){

    var newQuery = {
        query: {
            filtered: {
                query: query.query,
                filter: {
                    term: {
                        userName: userName,
                        sessionId: sessionId
                    }
                }
            }
        }
    };

    stream.stream(null, config.index.data, null, newQuery, pageSize, pageCallback);
};

exports.getByFeatureId = function(userName, sessionId, featureId, callback){
    var routingStr = userName+""+sessionId;
    getJSONById(routingStr, config.index.data, null, featureId, callback);
};

exports.getMetadataByQueryId = function(queryId, callback){
    getJSONById(null, config.index.metadata, null, queryId, callback);
};

exports.getMetadataBySessionId = function(sessionId, callback){
    var query = {query:{match:{sessionId:sessionId}}};
    getJSONByQuery(null, config.index.metadata, null, query, callback);
};