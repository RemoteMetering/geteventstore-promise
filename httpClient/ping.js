var debug = require('debug')('geteventstore:ping'),
    req = require('request-promise'),
    assert = require('assert'),
    url = require('url'),
    q = require('q');

var baseErr = 'Ping - ';

module.exports = function(config) {
    var buildUrl = function() {
        var urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = '/ping';
        return url.format(urlObj);
    };

    return function() {
        return q.Promise(function(resolve, reject){
            var options = {
                uri: buildUrl(),
                method: 'GET'
            };

            return req(options).then(function(response){
                return resolve();
            }).catch(function(err){
                return reject(err);
            });
        });
    };
};