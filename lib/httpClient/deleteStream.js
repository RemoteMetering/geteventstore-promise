import req from 'request-promise';
import debugModule from 'debug';
import Promise from 'bluebird';
import assert from 'assert';
import url from 'url';

const debug = debugModule('geteventstore:deleteStream');
const baseErr = 'Delete Stream - ';

export default (config) => {
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
                options.headers = {
                    "ES-HardDelete": "true"
                };
            }

            debug('', 'Options: %j', options);
            return req(options).then(response => {
                debug('', 'Response: %j', response);
                resolve();
            });
        }).catch(reject);
    });
};