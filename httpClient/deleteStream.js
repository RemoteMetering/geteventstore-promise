var debug = require('debug')('geteventstore:deleteStream'),
    req = require('request-promise'),
    Promise = require('bluebird'),
    assert = require('assert'),
    url = require('url');

var baseErr = 'Delete Stream - ';

module.exports = function(config) {
    var checkStreamExists = require('./checkStreamExists')(config);

    var buildUrl = function(streamName) {
        var urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = '/streams/' + streamName;
        return url.format(urlObj);
    };

    return function(streamName, hardDelete) {
        return new Promise(function(resolve, reject) {
            assert(streamName, baseErr + 'Stream Name not provided');

            checkStreamExists(streamName).then(function(exists) {
                if (!exists) return reject('Stream does not exist');

                var options = {
                    uri: buildUrl(streamName),
                    method: 'DELETE',
                    resolveWithFullResponse: true
                };
                
                if(hardDelete){
                    options = Object.assign({}, options, {'ES-HardDelete':true});
                }

                return req(options).then(resolve);
            }).catch(reject);
        });
    };
};
