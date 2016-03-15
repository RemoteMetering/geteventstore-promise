var httpConfig = require('./support/httpConfig');
var assert = require('assert');
var eventstore = require('../index.js');
var uuid = require('node-uuid');

describe('Http Client - Get All Projections Info', function() {
    it('Should return content with all eventstore projections information', function() {
        var client = eventstore.http(httpConfig);

        return client.projections.getAllProjectionsInfo().then(function(projectionsInfo) {
            assert.notEqual(projectionsInfo, undefined);
            assert(projectionsInfo.projections.length > 0);
        });
    });
});