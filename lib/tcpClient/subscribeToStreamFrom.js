import client from 'node-eventstore-client';
import debugModule from 'debug';
import assert from 'assert';
import { mapEvent, keepEvent } from './utilities/mapEvents.js';
import connectionManager from './connectionManager.js';
import subscriptionCloser from './utilities/subscriptionCloser.js';

const debug = debugModule('metronomic-kurrentdb-client:subscribeToStreamFrom');
const baseErr = 'Subscribe to Stream From - ';

export default (config) =>
  (streamName, fromEventNumber, onEventAppeared, onLiveProcessingStarted, onDropped, settings) => {
    settings = settings || {};
    return new Promise((resolve, reject) => {
      const run = async () => {
        assert(streamName, `${baseErr}Stream Name not provided`);
        if (!fromEventNumber) fromEventNumber = -1;

        let connection;
        let closeSubscription;
        const onEvent = (sub, ev) => {
          const mappedEvent = mapEvent(ev);
          if (!onEventAppeared || !keepEvent(mappedEvent, config.includeDeleted)) return undefined;
          return onEventAppeared(sub, mappedEvent);
        };
        let dropped = false;
        const reportDropped = (sub, reason, error) => {
          if (dropped) return;
          dropped = true;
          if (onDropped) onDropped(sub, reason, error);
          if (closeSubscription)
            closeSubscription().catch((err) => debug('', 'Close after drop failed: %s', err?.message));
        };

        const onConnected = async () => {
          let subscription;
          try {
            subscription = await connection.subscribeToStreamFrom(
              streamName,
              fromEventNumber,
              settings.resolveLinkTos,
              onEvent,
              onLiveProcessingStarted,
              reportDropped,
              new client.UserCredentials(config.credentials.username, config.credentials.password),
              settings.readBatchSize
            );
          } catch (ex) {
            await connection.closePool().catch((err) => debug('', 'Close after failed subscribe: %s', err?.message));
            reject(ex);
            return;
          }

          closeSubscription = subscriptionCloser(connection, () => subscription.stop());
          subscription.close = closeSubscription;
          debug('', 'Subscription: %j', subscription);
          resolve(subscription);
        };

        connection = await connectionManager.create(config, onConnected, true);
      };

      run().catch(reject);
    });
  };
