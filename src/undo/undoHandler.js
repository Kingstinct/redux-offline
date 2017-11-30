import canUndoSelector from './canUndoSelector';

export default state => {
  if (canUndoSelector({ offline: state })) {
    const outbox = state.outbox.slice(0, -1);
    const lastTransaction = state.lastTransaction - 1;
    if (outbox.length === 0) {
      return {
        ...state,
        outbox,
        lastTransaction,
        retryScheduled: false,
        retryCount: 0
      };
    }
    return { ...state, outbox, lastTransaction };
  }
  return state;
};
