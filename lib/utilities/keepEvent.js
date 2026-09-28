// Decides whether a mapped event should be yielded. Deleted (unresolved) events are only
// dropped when includeDeleted is explicitly false. Live events are always kept.
export default (mappedEvent, includeDeleted) =>
  !!mappedEvent && (includeDeleted !== false || mappedEvent.isResolved !== false);
