import './_globalHooks';

import generateEventId from '../lib/utilities/generateEventId';
import tcpConfig from './support/tcpConfig';
import sleep from './utilities/sleep';
import EventStore from '../lib';
import assert from 'assert';

const eventFactory = new EventStore.EventFactory();

describe('TCP Client - Subscribe To Stream From', () => {
	it('Should get all events written to a subscription stream', function (done) {
		this.timeout(15 * 1000);
		const client = new EventStore.TCPClient(tcpConfig);
		const testStream = `TestStream-${generateEventId()}`;
		let processedEventCount = 0;
		let hasPassed = false;

		function onEventAppeared() {
			processedEventCount++;
		}

		function onDropped() {
			if (!hasPassed) done('should not drop');
		}

		const events = [];
		for (let k = 0; k < 10; k++) {
			events.push(eventFactory.newEvent('TestEventType', { id: k }));
		}

		client.writeEvents(testStream, events).then(() =>
			client.subscribeToStreamFrom(testStream, 0, onEventAppeared, undefined, onDropped)
			.then(sub => sleep(3000).then(() => {
				assert.equal(10, processedEventCount);
				assert(sub, 'Subscription Expected');
				hasPassed = true;
				done();
				client.close();
			}))
		).catch(done);
	});

	it('Should get all resolved events read from a linked stream', function (done) {
		this.timeout(9 * 1000);

		const client = new EventStore.TCPClient(tcpConfig);
		const testStream = `TestStream-${generateEventId()}`;
		let doDone = true;
		let hasPassed = false;

		function onEventAppeared(sub, ev) {
			assert(ev.positionEventId, 'Position link event id expected');
			if (doDone) {
				hasPassed = true;
				done();
				client.close();
			}
			doDone = false;
		}

		function onDropped() {
			if (!hasPassed) done('should not drop during test');
		}

		const events = [];
		for (let k = 0; k < 10; k++) {
			events.push(eventFactory.newEvent('TestEventType', { id: k }));
		}

		client.writeEvents(testStream, events).then(() => {
			const settings = {
				resolveLinkTos: true
			};
			return client.subscribeToStreamFrom('$ce-TestStream', 5, onEventAppeared, undefined, onDropped, settings);
		}).catch(done);
	});
});