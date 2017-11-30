import * as selectors from './selectors';

export const { canUndoSelector } = selectors;

export const handler = state => {
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

export default { canUndoSelector, handler };
