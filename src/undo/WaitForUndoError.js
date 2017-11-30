class WaitForUndoError extends Error {
  constructor(delay = 0, message = 'WaitForUndoError', ...params) {
    super(message, ...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WaitForUndoError);
    }
    this.message = message;
    this.delay = delay;
  }
}

export default WaitForUndoError;
