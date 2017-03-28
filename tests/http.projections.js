require('./_globalHooks');

var httpConfig = require('./support/httpConfig');
var eventstore = require('../index.js');
var assert = require('assert');
var uuid = require('uuid');
var fs = require('fs');
var _ = require('lodash');

describe('Projections', () => {
    describe('Default Settings', () => {
        var assertionProjection = uuid.v4();
        var assertionProjectionContent = fs.readFileSync(`${__dirname}/support/testProjection.js`, {
            encoding: 'utf8'
        });

        it('Should create continous projection', function() {
            this.timeout(10 * 1000);
            var client = eventstore.http(httpConfig);

            return client.projections.assert(assertionProjection, assertionProjectionContent).then(response => {
                assert.equal(response.name, assertionProjection);
            });
        });

        it('Should update existing projection', function() {
            this.timeout(10 * 1000);
            var client = eventstore.http(httpConfig);

            return client.projections.assert(assertionProjection, assertionProjectionContent).then(response => {
                assert.equal(response.name, assertionProjection);
            });
        });

        it('Should stop projection', function() {
            this.timeout(10 * 1000);
            var client = eventstore.http(httpConfig);

            return client.projections.stop(assertionProjection).then(response => {
                assert.equal(response.name, assertionProjection);
                return client.projections.getInfo(assertionProjection).then(projectionInfo => {
                    assert.equal(projectionInfo.status, 'Stopped');
                });
            });
        });

        it('Should start projection', function() {
            this.timeout(10 * 1000);
            var client = eventstore.http(httpConfig);

            return client.projections.start(assertionProjection).then(response => {
                assert.equal(response.name, assertionProjection);
                return client.projections.getInfo(assertionProjection).then(projectionInfo => {
                    assert.equal(projectionInfo.status, 'Running');
                });
            });
        });

        it('Should reset projection', function() {
            this.timeout(10 * 1000);
            var client = eventstore.http(httpConfig);

            return client.projections.reset(assertionProjection).then(response => {
                assert.equal(response.name, assertionProjection);
                return client.projections.getInfo(assertionProjection).then(projectionInfo => {
                    assert.equal(projectionInfo.status, 'Preparing/Stopped');
                });
            });
        });

        it('Should remove continous projection', function() {
            this.timeout(10 * 1000);
            var client = eventstore.http(httpConfig);

            return client.projections.stop(assertionProjection).then(stopResponse => {
                setTimeout(() => {
                    assert.equal(stopResponse.name, assertionProjection);
                    return client.projections.remove(assertionProjection).then(removeResponse => {
                        assert.equal(removeResponse.name, assertionProjection);
                    });
                }, 1000);
            });
        });
    });

    describe('Custom Settings', () => {
        var assertionProjection = uuid.v4();
        var assertionProjectionContent = fs.readFileSync(`${__dirname}/support/testProjection.js`, {
            encoding: 'utf8'
        });

        it('Should create one-time projection with all settings enabled', function(done) {
            this.timeout(10 * 1000);
            var client = eventstore.http(httpConfig);

            client.projections.assert(assertionProjection, assertionProjectionContent, 'onetime', true, true, true).then(response => {
                setTimeout(() => {
                    assert.equal(response.name, assertionProjection);
                    done();
                }, 2000);
            }).catch(done);
        });

        it('Should remove one-time projection', function() {
            this.timeout(10 * 1000);
            var client = eventstore.http(httpConfig);

            return client.projections.stop(assertionProjection).then(stopResponse => {
                assert.equal(stopResponse.name, assertionProjection);
                return client.projections.remove(assertionProjection).then(removeResponse => {
                    assert.equal(removeResponse.name, assertionProjection);
                });
            });
        });
    });

    describe('Global Projections Operations', () => {
        it('Should enable all projections', function(done) {
            this.timeout(10 * 1000);
            var client = eventstore.http(httpConfig);

            client.projections.enableAll().then(() => {
                setTimeout(() => {
                    client.projections.getAllProjectionsInfo().then(projectionsInfo => {
                        _.each(projectionsInfo.projections, projection => {
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

            client.projections.disableAll().then(() => {
                setTimeout(() => {
                    client.projections.getAllProjectionsInfo().then(projectionsInfo => {
                        _.each(projectionsInfo.projections, projection => {
                            assert.equal(projection.status.toLowerCase().indexOf('stopped') > -1, true);
                        });
                        done();
                    }).catch(done);
                }, 1000);
            }).catch(done);
        });
    });

    describe('General', () => {
        it('Should return content with all eventstore projections information', function() {
            this.timeout(10 * 1000);
            var client = eventstore.http(httpConfig);

            return client.projections.getAllProjectionsInfo().then(projectionsInfo => {
                assert.notEqual(projectionsInfo, undefined);
                assert(projectionsInfo.projections.length > 0);
            });
        });

        it('Should return content for test projection state', function(done) {
            this.timeout(10 * 1000);
            var client = eventstore.http(httpConfig);

            var projectionName = 'TestProjection';
            var projectionContent = fs.readFileSync(`${__dirname}/support/testProjection.js`, {
                encoding: 'utf8'
            });

            client.projections.assert(projectionName, projectionContent).then(() => {
                setTimeout(() => {
                    var testStream = `TestProjectionStream-${uuid.v4()}`;
                    client.writeEvent(testStream, 'TestProjectionEventType', {
                        something: '123'
                    }).then(() => {
                        setTimeout(() => {
                            client.projections.getState(projectionName).then(projectionState => {
                                assert.equal(projectionState.data.something, '123');

                                return client.projections.stop(projectionName).then(response => {
                                    assert.equal(response.name, projectionName);
                                    return client.projections.remove(projectionName).then(response => {
                                        assert.equal(response.name, projectionName);
                                        done();
                                    });
                                });
                            }).catch(done);
                        }, 1000);
                    }).catch(done);
                }, 500);
            });
        });

        it('Should return content for test partioned projection', function(done) {
            this.timeout(1000 * 10);
            var client = eventstore.http(httpConfig);

            var projectionName = `TestProjection${uuid.v4()}`;
            var projectionContent = fs.readFileSync(`${__dirname}/support/testPartionedProjection.js`, {
                encoding: 'utf8'
            });

            client.projections.assert(projectionName, projectionContent).then(() => {
                setTimeout(() => {
                    var testStream = `TestProjectionStream-${uuid.v4()}`;
                    client.writeEvent(testStream, 'TestProjectionEventType', {
                        something: '123'
                    }).then(() => {
                        setTimeout(() => {
                            var options = {
                                partition: testStream
                            };

                            client.projections.getState(projectionName, options).then(projectionState => {
                                assert.equal(projectionState.data.something, '123');

                                return client.projections.stop(projectionName).then(response => {
                                    assert.equal(response.name, projectionName);
                                    return client.projections.remove(projectionName).then(response => {
                                        assert.equal(response.name, projectionName);
                                        done();
                                    });
                                });
                            }).catch(done);
                        }, 4000);
                    }).catch(done);
                }, 500);
            });
        });

        it('Should return rejected promise for non-existant projection state', function() {
            this.timeout(10 * 1000);
            var client = eventstore.http(httpConfig);

            return client.projections.getState('SomeProjectionNameThatDoesNotExist').catch(err => {
                assert(err.statusCode, 404);
            });
        });
    });
});