var debug = require('debug')('geteventstore:getEventsPersistentSubscription');
var req = require('request-promise');
var Promise = require('bluebird');
var assert = require('assert');
var _ = require('lodash');
var url = require('url');

var baseErr = 'Get persistent subscriptions events - ';

var createRequest = function(name, streamName, count, embed, config) {
    var urlObj = JSON.parse(JSON.stringify(config));
    urlObj.pathname = '/subscriptions/' + streamName + '/' + name + '/' + count + '?embed=' + embed;

    var uri = url.format(urlObj);
    var request = {
        uri: uri,
        method: 'GET',
        json: true,
        headers: {
            'Accept': 'application/vnd.eventstore.competingatom+json',
        }
    };
    return request;
};

var postUrl = function(uri) {
    return function() {
        var postRequest = {
            uri: uri,
            method: 'POST',
            json: true,
            headers: {
                'Content-Type': 'application/json',
            }
        };
        return req(postRequest);
    };
};

var appendLinkFunctions = function(resultObject, links) {
    _.each(links, function(link) {
        resultObject[link.relation] = postUrl(link.uri);
    });
};

var buildResultObject = function(response) {
    debug('', 'Response: %j', response);
    var result = {
        entries: []
    };

    appendLinkFunctions(result, response.links);

    result.entries = _.map(response.entries, function(entry) {
        if (entry.data) entry.data = JSON.parse(entry.data);

        var formattedEntry = {
            event: entry
        };
        appendLinkFunctions(formattedEntry, entry.links);
        return formattedEntry;
    });

    debug('', 'Result: %j', result);
    return result;
};

module.exports = function(config) {
    return function(name, streamName, count, embed) {
        return Promise.resolve().then(function() {
            assert(name, baseErr + 'Persistent Subscription Name not provided');
            assert(streamName, baseErr + 'Stream Name not provided');

            count = count === undefined ? 1 : count;
            embed = embed || 'Body';

            var options = createRequest(name, streamName, count, embed, config);
            debug('', 'Options: %j', options);
            return req(options).then(buildResultObject);
        });
    };
};