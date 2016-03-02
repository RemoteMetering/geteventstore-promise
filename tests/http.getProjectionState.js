var assert = require('assert');
var eventstore = require('../index.js');
var uuid = require('node-uuid');
var createProjection = require('./helpers/createProjection');

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

        createProjection('testProjection.js', eventStoreConfig, function() {
            var testStream = 'TestProjectionStream-' + uuid.v4();
            return client.writeEvent(testStream, 'TestProjectionEventType', {
                something: '123'
            }).then(function() {
                setTimeout(function() {
                    client.getProjectionState('TestProjection').then(function(projectionState) {
                        assert.equal(projectionState.data.something, '123');
                        done();
                    });
                }, 250);
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

        client.getProjectionState('SomeProjectionNameThatDoesNotExist').catch(function(err) {
            assert(err.statusCode, 404);
        });
    });
});