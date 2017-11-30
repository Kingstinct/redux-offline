import WaitForUndoError from './WaitForUndoError';

const undoEffectDecorator = effectHandler => (effect, action) => {
  const diff =
    action &&
    action.meta &&
    action.meta.offline &&
    action.meta.offline.waitForUndoUntil
      ? new Date(action.meta.offline.waitForUndoUntil) - new Date()
      : 0;
  if (diff > 0) {
    throw new WaitForUndoError(diff);
  }
  return effectHandler(effect, action);
};

export default undoEffectDecorator;
