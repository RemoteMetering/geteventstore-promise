import { StreamNotFoundError } from '@kurrent/kurrentdb-client';
import debugModule from 'debug';
import assert from 'assert';
import connectionManager from './connectionManager.js';
import wireSubscription from './utilities/wireSubscription.js';
import positionOf from './utilities/positionOf.js';

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

// Servers older than 22 (the 21.10 image among them) never send the caughtUp notification, so
// onLiveProcessingStarted would never fire there. Fall back to the stream head read at subscribe
// time and report live once that revision arrives, or on confirmation when there is nothing to
// catch up on. Whichever signal comes first wins and the callback runs once.
const wireLiveProcessing = (subscription, onLiveProcessingStarted, headRevision, fromEventNumber) => {
  let reported = false;
  const reportLive = () => {
    if (reported) return;
    reported = true;
    onLiveProcessingStarted(subscription);
  };

  subscription.once('caughtUp', reportLive);

  // A numeric start is exclusive, so starting at or past the head leaves nothing to catch up on.
  const startsAtHead =
    headRevision === null ||
    fromEventNumber === 'end' ||
    (fromEventNumber !== 'start' && BigInt(fromEventNumber) >= headRevision);
  if (startsAtHead) {
    subscription.once('confirmation', reportLive);
    return;
  }

  const onData = (resolvedEvent) => {
    const revision = positionOf(resolvedEvent);
    if (revision === undefined || BigInt(revision) < headRevision) return;
    subscription.off('data', onData);
    reportLive();
  };
  subscription.on('data', onData);
};

export default (config) =>
  async (streamName, fromEventNumber, onEventAppeared, onLiveProcessingStarted, onDropped, settings) => {
    assert(streamName, `${baseErr}Stream Name not provided`);

    settings = settings || {};
    if (!fromEventNumber) fromEventNumber = 'start';

    const connection = await connectionManager.getOrCreate(config);
    // Read the head before subscribing, so any event appended in between counts as live.
    const headRevision = onLiveProcessingStarted ? await readHeadRevision(connection, streamName) : null;
    const subscription = await connection.subscribeToStream(streamName, {
      fromRevision: fromEventNumber,
      resolveLinkTos: settings.resolveLinkTos
    });
    wireSubscription(subscription, onEventAppeared, onDropped, config.includeDeleted);
    if (onLiveProcessingStarted)
      wireLiveProcessing(subscription, onLiveProcessingStarted, headRevision, fromEventNumber);

    debug('', 'Subscription: %j', subscription);
    return subscription;
  };
