const debug = require('debug')('geteventstore:deleteStream');
const req = require('request-promise');
const Promise = require('bluebird');
const assert = require('assert');
const url = require('url');

const baseErr = 'Delete Stream - ';

module.exports = config => {
    const checkStreamExists = require('./checkStreamExists')(config);

    const buildUrl = streamName => {
        const urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = `/streams/${streamName}`;
        return url.format(urlObj);
    };

    return (streamName, hardDelete) => new Promise((resolve, reject) => {
        assert(streamName, `${baseErr}Stream Name not provided`);

        return checkStreamExists(streamName).then(exists => {
            if (!exists) return reject(new Error('Stream does not exist'));

            let options = {
                uri: buildUrl(streamName),
                method: 'DELETE',
                resolveWithFullResponse: true,
                timeout: config.timeout
            };

            if (hardDelete) {
                options = Object.assign({}, options, {
                    "headers": {
                        "ES-HardDelete": "true"
                    }
                });
            }

            debug('', 'Options: %j', options);
            return req(options).then(response => {
                debug('', 'Response: %j', response);
                resolve();
            });
        }).catch(reject);
    });
};