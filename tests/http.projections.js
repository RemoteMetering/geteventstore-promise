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
            var client = eventstore.http({
                hostname: 'localhost',
                protocol: 'http',
                port: 2113,
                auth: 'admin:changeit'
            });

            return client.projections.assert(assertionProjection, assertionProjectionContent).then(function(response) {
                assert.equal(response.name, assertionProjection);
            });
        });

        it('Should update existing projection', function() {
            var client = eventstore.http({
                hostname: 'localhost',
                protocol: 'http',
                port: 2113,
                auth: 'admin:changeit'
            });

            return client.projections.assert(assertionProjection, assertionProjectionContent).then(function(response) {
                assert.equal(response.name, assertionProjection);
            });
        });

        it('Should stop projection', function() {
            var client = eventstore.http({
                hostname: 'localhost',
                protocol: 'http',
                port: 2113,
                auth: 'admin:changeit'
            });

            return client.projections.stop(assertionProjection).then(function(response) {
                assert.equal(response.name, assertionProjection);
                return client.projections.getInfo(assertionProjection).then(function(projectionInfo) {
                    assert.equal(projectionInfo.status, 'Stopped');
                });
            });
        });

        it('Should start projection', function() {
            var client = eventstore.http({
                hostname: 'localhost',
                protocol: 'http',
                port: 2113,
                auth: 'admin:changeit'
            });

            return client.projections.start(assertionProjection).then(function(response) {
                assert.equal(response.name, assertionProjection);
                return client.projections.getInfo(assertionProjection).then(function(projectionInfo) {
                    assert.equal(projectionInfo.status, 'Running');
                });
            });
        });

        it('Should reset projection', function() {
            var client = eventstore.http({
                hostname: 'localhost',
                protocol: 'http',
                port: 2113,
                auth: 'admin:changeit'
            });

            return client.projections.reset(assertionProjection).then(function(response) {
                assert.equal(response.name, assertionProjection);
                return client.projections.getInfo(assertionProjection).then(function(projectionInfo) {
                    assert.equal(projectionInfo.status, 'Preparing/Stopped');
                });
            });
        });

        it('Should remove continous projection', function(done) {
            var client = eventstore.http({
                hostname: 'localhost',
                protocol: 'http',
                port: 2113,
                auth: 'admin:changeit'
            });
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

        it('Should create one-time projection with all settings enabled', function() {
            var client = eventstore.http({
                hostname: 'localhost',
                protocol: 'http',
                port: 2113,
                auth: 'admin:changeit'
            });
            return client.projections.assert(assertionProjection, assertionProjectionContent, 'onetime', true, true, true).then(function(response) {
                assert.equal(response.name, assertionProjection);
            });
        });

        it('Should remove one-time projection', function(done) {
            var client = eventstore.http({
                hostname: 'localhost',
                protocol: 'http',
                port: 2113,
                auth: 'admin:changeit'
            });

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

    describe('Global Projections Operations', function() {
        it('Should enable all projections', function(done) {
            this.timeout(10 * 1000);

            var client = eventstore.http({
                hostname: 'localhost',
                protocol: 'http',
                port: 2113,
                auth: 'admin:changeit'
            });
            client.projections.enableAll().then(function(response) {
                setTimeout(function() {
                    client.projections.getAllProjectionsInfo().then(function(projectionsInfo) {
                        _.each(projectionsInfo.projections, function(projection) {
                            assert.equal(projection.status, 'Running');
                        });
                        done();
                    }).catch(done);
                }, 1000);
            }).catch(done);
        });

        it('Should disable all projections', function(done) {
            this.timeout(10 * 1000);

            var client = eventstore.http({
                hostname: 'localhost',
                protocol: 'http',
                port: 2113,
                auth: 'admin:changeit'
            });

            client.projections.disableAll().then(function(response) {
                setTimeout(function() {
                    client.projections.getAllProjectionsInfo().then(function(projectionsInfo) {
                        _.each(projectionsInfo.projections, function(projection) {
                            assert.equal(projection.status, 'Stopped');
                        });
                        done();
                    }).catch(done);
                }, 1000);
            }).catch(done);
        });
    });
});