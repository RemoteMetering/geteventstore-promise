import debugModule from 'debug';
import assert from 'assert';
import connectionManager from './connectionManager.js';
import mapEvents from './utilities/mapEvents.js';

const debug = debugModule('metronomic-kurrentdb-client:eventEnumerator');
const baseErr = 'Event Enumerator - ';

const getNextBatch = async (config, streamName, state, count, direction, resolveLinkTos) => {
  state.isFirstEnumeration = false;
  assert(streamName, `${baseErr}Stream Name not provided`);

  const connection = await connectionManager.create(config);
  const read = direction === 'forward' ? 'readStreamEventsForward' : 'readStreamEventsBackward';

  try {
    const result = await connection[read](streamName, state.nextEventNumber, count, resolveLinkTos, config.credentials);
    debug('', 'Result: %j', result);

    state.nextEventNumber = result.nextEventNumber.toNumber
      ? result.nextEventNumber.toNumber()
      : result.nextEventNumber;
    return {
      isEndOfStream: result.isEndOfStream,
      events: mapEvents(result.events, config.includeDeleted)
    };
  } finally {
    connection.releaseConnection();
  }
};

const esDirectionWorkaroundHandler = (direction) => {
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

class StateHandler {
  constructor(direction) {
    this.direction = direction;
    this.isFirstEnumeration = true;
    this.setToFirst();
  }

  setToFirst() {
    this.nextEventNumber = this.direction === 'forward' ? 0 : -1;
  }

  setToLast(count) {
    this.nextEventNumber = this.direction === 'forward' ? -1 : count - 1;
  }

  setToPrevious(count) {
    if (!this.isFirstEnumeration) this.adjustByLength(count);
  }

  keepInBoundsAdjustment(count) {
    if (this.direction === 'backward') return count;

    let adjustment = count;
    if (this.nextEventNumber < -1) {
      adjustment -= Math.abs(this.nextEventNumber);
      this.nextEventNumber = 0;
    }

    return adjustment;
  }

  adjustByLength(count) {
    this.nextEventNumber += this.direction === 'forward' ? count * -1 : count;
  }
}

export default (config) =>
  (streamName, direction, resolveLinkTos = true) => {
    direction = direction || 'forward';
    const state = new StateHandler(direction);

    return {
      first(count) {
        state.setToFirst();
        return getNextBatch(config, streamName, state, count, direction, resolveLinkTos);
      },
      last(count) {
        state.setToLast(count);

        const handler = esDirectionWorkaroundHandler(direction);
        return getNextBatch(config, streamName, state, count, handler.direction, resolveLinkTos).then((result) =>
          handler.swopResult(state, count, result)
        );
      },
      previous(count) {
        state.setToPrevious(count);
        count = state.keepInBoundsAdjustment(count);

        return getNextBatch(config, streamName, state, count, direction, resolveLinkTos).then((result) => {
          state.adjustByLength(count);
          return result;
        });
      },
      next(count) {
        return getNextBatch(config, streamName, state, count, direction, resolveLinkTos);
      }
    };
  };
