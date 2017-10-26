import './_globalHooks';

import tcpConfig from './support/tcpConfig';
import eventstore from '../index';
import assert from 'assert';

describe('TCP Client - Config', () => {
    it('Should return assertion error when config is undefined', done => {
        try {
            eventstore.tcp();
            done('Config should not pass assertion');
        } catch (err) {
            assert.equal(err === undefined, false);
            assert.equal(err.message, 'geteventstore-promise - TCP client - config not provided');
            done();
        }
    });

    it('Should return assertion error when hostname is undefined', done => {
        try {
            const config = {
                port: 1113,
                credentials: {
                    username: 'admin',
                    password: 'changeit'
                }
            };
            eventstore.tcp(config);
            done();
        } catch (err) {
            assert.equal(err === undefined, false);
            assert.equal(err.message, 'geteventstore-promise - TCP client - hostname property not provided');
            done();
        }
    });

    it('Should return assertion error when credentials are undefined', done => {
        try {
            const config = {
                hostname: 'localhost',
                port: 1113
            };
            eventstore.tcp(config);
            done();
        } catch (err) {
            assert.equal(err === undefined, false);
            assert.equal(err.message, 'geteventstore-promise - TCP client - credentials property not provided');
            done();
        }
    });

    it('Should return tcp client when config is complete', done => {
        try {
            const client = eventstore.tcp(tcpConfig);
            assert.equal(client !== undefined, true);
            done();
        } catch (err) {
            done(err);
        }
    });
});