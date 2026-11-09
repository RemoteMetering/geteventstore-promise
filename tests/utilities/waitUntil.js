// Polls condition until it returns truthy, then resolves. Returns as soon as the
// condition holds instead of waiting a fixed duration, which keeps tests fast while
// still failing loudly if the condition never becomes true within the timeout.
export default async (condition, { timeout = 5000, interval = 50 } = {}) => {
  const start = Date.now();
  while (true) {
    if (await condition()) return;
    if (Date.now() - start > timeout) throw new Error('waitUntil timed out');
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
};
