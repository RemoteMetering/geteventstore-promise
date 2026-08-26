export default (resolvedEvent) => (resolvedEvent.link || resolvedEvent.event || {}).revision;
