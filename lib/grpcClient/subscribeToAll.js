import debugModule from 'debug';
import connectionManager from './connectionManager.js';
import wireSubscription from './utilities/wireSubscription.js';
import wireLiveProcessing from './utilities/wireLiveProcessing.js';

const debug = debugModule('metronomic-kurrentdb-client:subscribeToAll');
const baseErr = 'Subscribe to All - ';

// Parses the $all start position: 'start', 'end', or a { commit, prepare } object.
const parsePosition = (fromPosition) => {
  if (fromPosition == null || fromPosition === 'start') return 'start';
  if (fromPosition === 'end') return 'end';
  if (typeof fromPosition === 'object') {
    if (fromPosition.commit === undefined || fromPosition.prepare === undefined) {
      throw new Error(`${baseErr}'fromPosition' not valid. Needs to be an object with 'commit' and 'prepare'`);
    }
    return { commit: BigInt(fromPosition.commit), prepare: BigInt(fromPosition.prepare) };
  }
  throw new Error(
    `${baseErr}'fromPosition' not valid. Needs to be 'start', 'end' or an object with 'commit' and 'prepare'`
  );
};

const readHeadCommit = async (connection) => {
  for await (const resolvedEvent of connection.readAll({ direction: 'backwards', fromPosition: 'end', maxCount: 1 })) {
    return commitOf(resolvedEvent);
  }
  return null;
};

const commitOf = (resolvedEvent) =>
  resolvedEvent.commitPosition ?? resolvedEvent.event?.position?.commit ?? resolvedEvent.link?.position?.commit;

export default (config) => async (fromPosition, onEventAppeared, onLiveProcessingStarted, onDropped, settings) => {
  settings = settings || {};
  const _fromPosition = parsePosition(fromPosition);

  const connection = await connectionManager.getOrCreate(config);
  // Read the head before subscribing, so any event appended in between counts as live.
  const headCommit = onLiveProcessingStarted && _fromPosition !== 'end' ? await readHeadCommit(connection) : null;

  let onCheckpoint = () => {};
  let { filter } = settings;
  if (filter && onLiveProcessingStarted) {
    const callerCheckpointReached = filter.checkpointReached;
    filter = {
      ...filter,
      checkpointReached: async (subscription, position) => {
        if (callerCheckpointReached) await callerCheckpointReached(subscription, position);
        onCheckpoint(position);
      }
    };
  }

  const subscription = await connection.subscribeToAll({
    fromPosition: _fromPosition,
    resolveLinkTos: settings.resolveLinkTos,
    filter
  });
  const { afterDelivered } = wireSubscription(subscription, onEventAppeared, onDropped, config.includeDeleted);
  if (onLiveProcessingStarted) {
    const startsAtHead =
      _fromPosition === 'end' ||
      headCommit === null ||
      (typeof _fromPosition === 'object' && _fromPosition.commit >= headCommit);
    ({ onCheckpoint } = wireLiveProcessing(subscription, onLiveProcessingStarted, afterDelivered, {
      startsAtHead,
      isAtHead: (resolvedEvent) => {
        const commit = commitOf(resolvedEvent);
        return commit !== undefined && commit >= headCommit;
      },
      isPositionAtHead: (position) => position.commit >= headCommit
    }));
  }

  debug('', 'Subscription: %j', subscription);
  return subscription;
};
