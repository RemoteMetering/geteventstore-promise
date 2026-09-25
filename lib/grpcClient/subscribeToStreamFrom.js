import { StreamNotFoundError } from '@kurrent/kurrentdb-client';
import debugModule from 'debug';
import assert from 'assert';
import connectionManager from './connectionManager.js';
import wireSubscription from './utilities/wireSubscription.js';
import positionOf from './utilities/positionOf.js';
import isWhole from '../utilities/isWholeNumber.js';
import wireLiveProcessing from './utilities/wireLiveProcessing.js';

const debug = debugModule('metronomic-kurrentdb-client:subscribeToStreamFrom');
const baseErr = 'Subscribe to Stream From - ';

const readHeadRevision = async (connection, streamName) => {
  try {
    for await (const resolvedEvent of connection.readStream(streamName, {
      direction: 'backwards',
      fromRevision: 'end',
      maxCount: 1
    })) {
      return BigInt(positionOf(resolvedEvent));
    }
  } catch (err) {
    if (!(err instanceof StreamNotFoundError)) throw err;
  }
  return null;
};

const toFromRevision = (fromEventNumber) => {
  if (fromEventNumber == null || fromEventNumber === 'start' || fromEventNumber === '') return 'start';
  if (fromEventNumber === 'end') return 'end';
  if (!isWhole(fromEventNumber)) throw new Error(`${baseErr}'fromEventNumber' not valid: ${String(fromEventNumber)}`);

  const revision = BigInt(fromEventNumber);
  if (revision === 0n || revision === -1n) return 'start';
  if (revision < 0n) throw new Error(`${baseErr}'fromEventNumber' not valid: ${String(fromEventNumber)}`);
  return revision;
};

export default (config) =>
  async (streamName, fromEventNumber, onEventAppeared, onLiveProcessingStarted, onDropped, settings) => {
    assert(streamName, `${baseErr}Stream Name not provided`);

    settings = settings || {};
    const fromRevision = toFromRevision(fromEventNumber);

    const connection = await connectionManager.getOrCreate(config);
    // Read the head before subscribing, so any event appended in between counts as live when not at end
    const headRevision =
      onLiveProcessingStarted && fromRevision !== 'end' ? await readHeadRevision(connection, streamName) : null;
    const subscription = await connection.subscribeToStream(streamName, {
      fromRevision,
      resolveLinkTos: settings.resolveLinkTos
    });
    const { afterDelivered } = wireSubscription(subscription, onEventAppeared, onDropped, config.includeDeleted);
    if (onLiveProcessingStarted) {
      const startsAtHead =
        headRevision === null || fromRevision === 'end' || (fromRevision !== 'start' && fromRevision >= headRevision);
      wireLiveProcessing(subscription, onLiveProcessingStarted, afterDelivered, {
        startsAtHead,
        isAtHead: (resolvedEvent) => {
          const revision = positionOf(resolvedEvent);
          return revision !== undefined && BigInt(revision) >= headRevision;
        }
      });
    }

    debug('', 'Subscription: %j', subscription);
    return subscription;
  };
