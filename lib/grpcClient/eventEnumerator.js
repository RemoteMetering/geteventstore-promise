import connectionManager from './connectionManager';
import mapEvents from './utilities/mapEvents';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:eventEnumerator');
const baseErr = 'Event Enumerator - ';

const getNextBatch = async (config, streamName, state, count, direction, resolveLinkTos) => {
	state.isFirstEnumeration = false;
	assert(streamName, `${baseErr}Stream Name not provided`);

	const connection = await connectionManager.create(config);

	function handleResult(result) {
		debug('', 'Result: %j', result);

		state.nextEventNumber = result.nextEventNumber.toNumber ? result.nextEventNumber.toNumber() : result.nextEventNumber;
		return {
			isEndOfStream: result.isEndOfStream,
			events: mapEvents(result.events)
		};
	}

	try {
		if (direction === 'forward') return await connection.readStreamEventsForward(streamName, state.nextEventNumber, count, resolveLinkTos, config.credentials).then(handleResult);
		return await connection.readStreamEventsBackward(streamName, state.nextEventNumber, count, resolveLinkTos, config.credentials).then(handleResult);
	} catch (err) {
		throw err;
	} finally {
		connection.releaseConnection();
	}
};

const esDirectionWorkaroundHandler = direction => {
	let wasSwopped = false;

	if (direction === 'forward') {
		wasSwopped = true;
		direction = 'backward';
	}

	return {
		direction,
		swopResult(state, count, result) {
			if (wasSwopped) {
				state.nextEventNumber += count + 1;
				result.events.reverse();
			}
			return result;
		}
	};
};

const stateHandler = direction => {
	class Handler {
		constructor() {
			this.isFirstEnumeration = true;
			this.setToFirst();
		}

		setToFirst() {
			this.nextEventNumber = direction === 'forward' ? 0 : -1;
		}

		setToLast(count) {
			this.nextEventNumber = direction === 'forward' ? -1 : count - 1;
		}

		setToPrevious(count) {
			if (!this.isFirstEnumeration)
				this.adjustByLength(count);
		}

		keepInBoundsAdjustment(count) {
			if (direction === 'backward')
				return count;

			let adjustment = count;
			if (this.nextEventNumber < -1) {
				adjustment -= Math.abs(this.nextEventNumber);
				this.nextEventNumber = 0;
			}

			return adjustment;
		}

		adjustByLength(count) {
			this.nextEventNumber += direction === 'forward' ? count * -1 : count;
		}
	}

	return new Handler();
};

export default (config) => (streamName, direction, resolveLinkTos) => {
	direction = direction || 'forward';
	resolveLinkTos = resolveLinkTos === undefined ? true : resolveLinkTos;
	const state = stateHandler(direction);

	return {
		first(count) {
			state.setToFirst();
			return getNextBatch(config, streamName, state, count, direction, resolveLinkTos);
		},
		last(count) {
			state.setToLast(count);

			const handler = esDirectionWorkaroundHandler(direction);
			return getNextBatch(config, streamName, state, count, handler.direction, resolveLinkTos).then(result => handler.swopResult(state, count, result));
		},
		previous(count) {
			state.setToPrevious(count);
			count = state.keepInBoundsAdjustment(count);

			return getNextBatch(config, streamName, state, count, direction, resolveLinkTos).then(result => {
				state.adjustByLength(count);
				return result;
			});
		},
		next(count) {
			return getNextBatch(config, streamName, state, count, direction, resolveLinkTos);
		}
	};
};