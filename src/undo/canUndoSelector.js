const canUndoSelector = ({ offline }) =>
  offline.outbox.length > 1 || (offline.outbox.length === 1 && !offline.busy);

export default canUndoSelector;
