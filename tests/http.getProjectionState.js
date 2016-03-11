var assert = require('assert');
var eventstore = require('../index.js');
var uuid = require('node-uuid');
var fs = require('fs');

describe('Http Client - Get Projection State', function() {
    it('Should return content for test projection state', function(done) {
        var eventStoreConfig = {
            http: {
                hostname: 'localhost',
                protocol: 'http',
                port: 2113,
                credentials: {
                    username: 'admin',
                    password: 'changeit'
                }
            }
        };
        var client = eventstore.http(eventStoreConfig);

        var projectionName = 'TestProjection';
        var projectionContent = fs.readFileSync(__dirname + '/support/testProjection.js', {
            encoding: 'utf8'
        });

        return client.projections.assert(projectionName, projectionContent).then(function() {
            var testStream = 'TestProjectionStream-' + uuid.v4();
            return client.writeEvent(testStream, 'TestProjectionEventType', {
                something: '123'
            }).then(function() {
                setTimeout(function() {
                    client.projections.getState(projectionName).then(function(projectionState) {
                        assert.equal(projectionState.data.something, '123');

                        return client.projections.stop(projectionName).then(function(response) {
                            assert.equal(response.name, projectionName);
                            return client.projections.remove(projectionName).then(function(response) {
                                assert.equal(response.name, projectionName);
                                done();
                            });
                        });
                    });
                }, 500);
            });
        });
    });

    it('Should return rejected promise for non-existant projection', function() {
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

        return client.projections.getState('SomeProjectionNameThatDoesNotExist').catch(function(err) {
            assert(err.statusCode, 404);
        });
    });
});