// Servers older than 22 (the 21.10 image among them) never send the caughtUp notification, so
// onLiveProcessingStarted would never fire there. Alongside caughtUp this watches for the head
// that was read before subscribing: live starts on confirmation when there is nothing to catch up
// on, or once an event at or past the head arrives. Whichever signal comes first wins and the
// callback runs once.
export default (
  subscription,
  onLiveProcessingStarted,
  afterDelivered,
  { startsAtHead, isAtHead, isPositionAtHead }
) => {
  let reported = false;
  const reportLive = () => {
    if (reported) return;
    reported = true;
    onLiveProcessingStarted(subscription);
  };
  const reportLiveWhenDelivered = () => {
    if (!reported) afterDelivered(reportLive);
  };

  subscription.once('caughtUp', reportLiveWhenDelivered);

  if (startsAtHead) {
    subscription.once('confirmation', reportLiveWhenDelivered);
    return { onCheckpoint: () => {} };
  }

  const onData = (resolvedEvent) => {
    if (!isAtHead(resolvedEvent)) return;
    subscription.off('data', onData);
    reportLiveWhenDelivered();
  };
  subscription.on('data', onData);

  return {
    onCheckpoint: (position) => {
      if (isPositionAtHead && isPositionAtHead(position)) reportLiveWhenDelivered();
    }
  };
};
