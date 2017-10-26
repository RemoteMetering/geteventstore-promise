import './_globalHooks';

import httpConfig from './support/httpConfig';
import eventstore from '../index';

describe('Http Client - Send Scavenge Command', () => {
    it('Should send scavenge command', () => {
        const client = eventstore.http(httpConfig);
        return client.admin.scavenge();
    });
});