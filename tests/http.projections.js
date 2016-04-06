var httpConfig = require('./support/httpConfig');
var assert = require('assert');
var eventstore = require('../index.js');
var uuid = require('node-uuid');
var fs = require('fs');
var _ = require('underscore');

describe('Projections', function() {
    describe('Default Settings', function() {
        var assertionProjection = uuid.v4();
        var assertionProjectionContent = fs.readFileSync(__dirname + '/support/testProjection.js', {
            encoding: 'utf8'
        });

        it('Should create continous projection', function() {
            var client = eventstore.http(httpConfig);

            return client.projections.assert(assertionProjection, assertionProjectionContent).then(function(response) {
                assert.equal(response.name, assertionProjection);
            });
        });

        it('Should update existing projection', function() {
            var client = eventstore.http(httpConfig);

            return client.projections.assert(assertionProjection, assertionProjectionContent).then(function(response) {
                assert.equal(response.name, assertionProjection);
            });
        });

        it('Should stop projection', function() {
            var client = eventstore.http(httpConfig);

            return client.projections.stop(assertionProjection).then(function(response) {
                assert.equal(response.name, assertionProjection);
                return client.projections.getInfo(assertionProjection).then(function(projectionInfo) {
                    assert.equal(projectionInfo.status, 'Stopped');
                });
            });
        });

        it('Should start projection', function() {
            var client = eventstore.http(httpConfig);

            return client.projections.start(assertionProjection).then(function(response) {
                assert.equal(response.name, assertionProjection);
                return client.projections.getInfo(assertionProjection).then(function(projectionInfo) {
                    assert.equal(projectionInfo.status, 'Running');
                });
            });
        });

        it('Should reset projection', function() {
            var client = eventstore.http(httpConfig);

            return client.projections.reset(assertionProjection).then(function(response) {
                assert.equal(response.name, assertionProjection);
                return client.projections.getInfo(assertionProjection).then(function(projectionInfo) {
                    assert.equal(projectionInfo.status, 'Preparing/Stopped');
                });
            });
        });

        it('Should remove continous projection', function(done) {
            var client = eventstore.http(httpConfig);
            client.projections.stop(assertionProjection).then(function(stopResponse) {
                setTimeout(function() {
                    assert.equal(stopResponse.name, assertionProjection);
                    client.projections.remove(assertionProjection).then(function(removeResponse) {
                        assert.equal(removeResponse.name, assertionProjection);
                        done();
                    }).catch(done);
                }, 1000);
            }).catch(done);
        });
    });

    describe('Custom Settings', function() {
        var assertionProjection = uuid.v4();
        var assertionProjectionContent = fs.readFileSync(__dirname + '/support/testProjection.js', {
            encoding: 'utf8'
        });

        it('Should create one-time projection with all settings enabled', function(done) {
            this.timeout(1000 * 5);
            var client = eventstore.http(httpConfig);
            client.projections.assert(assertionProjection, assertionProjectionContent, 'onetime', true, true, true).then(function(response) {
                setTimeout(function() {
                    assert.equal(response.name, assertionProjection);
                    done();
                }, 2000);
            }).catch(done);
        });

        it('Should remove one-time projection', function() {
            var client = eventstore.http(httpConfig);
            return client.projections.stop(assertionProjection).then(function(stopResponse) {
                assert.equal(stopResponse.name, assertionProjection);
                return client.projections.remove(assertionProjection).then(function(removeResponse) {
                    assert.equal(removeResponse.name, assertionProjection);
                });
            });
        });
    });

    describe('Global Projections Operations', function() {
        it('Should enable all projections', function(done) {
            this.timeout(10 * 1000);

            var client = eventstore.http(httpConfig);
            client.projections.enableAll().then(function(response) {
                setTimeout(function() {
                    client.projections.getAllProjectionsInfo().then(function(projectionsInfo) {
                        _.each(projectionsInfo.projections, function(projection) {
                            assert.equal(projection.status.toLowerCase().indexOf('running') > -1, true);
                        });
                        done();
                    }).catch(done);
                }, 1000);
            }).catch(done);
        });

        it('Should disable all projections', function(done) {
            this.timeout(1000 * 10);
            var client = eventstore.http(httpConfig);
            client.projections.disableAll().then(function(response) {
                setTimeout(function() {
                    client.projections.getAllProjectionsInfo().then(function(projectionsInfo) {
                        _.each(projectionsInfo.projections, function(projection) {
                            assert.equal(projection.status.toLowerCase().indexOf('stopped') > -1, true);
                        });
                        done();
                    }).catch(done);
                }, 1000);
            }).catch(done);
        });
    });

    describe('General', function() {
        it('Should return content with all eventstore projections information', function() {
            var client = eventstore.http(httpConfig);

            return client.projections.getAllProjectionsInfo().then(function(projectionsInfo) {
                assert.notEqual(projectionsInfo, undefined);
                assert(projectionsInfo.projections.length > 0);
            });
        });

        it('Should return content for test projection state', function(done) {
            this.timeout(1000 * 5);
            var client = eventstore.http(httpConfig);

            var projectionName = 'TestProjection';
            var projectionContent = fs.readFileSync(__dirname + '/support/testProjection.js', {
                encoding: 'utf8'
            });

            client.projections.assert(projectionName, projectionContent).then(function() {
                setTimeout(function() {
                    var testStream = 'TestProjectionStream-' + uuid.v4();
                    client.writeEvent(testStream, 'TestProjectionEventType', {
                        something: '123'
                    }).then(function() {
                        setTimeout(function() {
                            client.projections.getState(projectionName).then(function(projectionState) {
                                assert.equal(projectionState.data.something, '123');

                                client.projections.stop(projectionName).then(function(response) {
                                    assert.equal(response.name, projectionName);
                                    client.projections.remove(projectionName).then(function(response) {
                                        assert.equal(response.name, projectionName);
                                        done();
                                    }).catch(done);
                                }).catch(done);
                            }).catch(done);
                        }, 1000);
                    }).catch(done);
                }, 500);
            });
        });

        it('Should return rejected promise for non-existant projection state', function() {
            var client = eventstore.http(httpConfig);

            return client.projections.getState('SomeProjectionNameThatDoesNotExist').catch(function(err) {
                assert(err.statusCode, 404);
            });
        });
    });
});