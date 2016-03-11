var assert = require('assert');
var eventstore = require('../index.js');
var uuid = require('node-uuid');

describe('Http Client - Get All Projections Info', function() {
    it('Should return content with all eventstore projections information', function() {
        var client = eventstore.http({
            http: {
                hostname: 'localhost',
                protocol: 'http',
                port: 2113,
                credentials: {
                    username: 'admin',
                    password: 'changeit'
                }
            }
        });

        return client.projections.getAllProjectionsInfo().then(function(projectionsInfo) {
            assert.notEqual(projectionsInfo, undefined);
            assert(projectionsInfo.projections.length > 0);
        });
    });
});