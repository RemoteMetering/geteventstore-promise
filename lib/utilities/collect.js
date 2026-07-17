// Drains an async iterable into an array. Lets the buffering read methods reuse
// the iterator implementations rather than duplicating the read logic.
export default async (iterable) => {
  const items = [];
  for await (const item of iterable) {
    items.push(item);
  }
  return items;
};
