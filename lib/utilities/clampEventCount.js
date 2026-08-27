// KurrentDB refuses reads above 4096 events, so clamp instead of failing the call.
export default (count, label = 'event count') => {
  const requested = count || 1000;
  if (requested <= 4096) return requested;

  console.warn(`WARNING: Max ${label} exceeded. Using the max of 4096`);
  return 4096;
};
