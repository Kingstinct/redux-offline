import undoEffectDecorator from '../../undo/undoEffectDecorator';

describe('undoEffectDecorator', () => {
  it('Should throw undo error if waitForUndoUntil is in the future', () => {
    const effect = jest.fn();
    const decoratedEffect = undoEffectDecorator(effect);

    let error;
    try {
      decoratedEffect(
        {},
        {
          meta: {
            offline: {
              waitForUndoUntil: new Date(
                new Date().valueOf() + 1000
              ).toISOString()
            }
          }
        }
      );
    } catch (e) {
      error = e;
    }
    expect(error).toHaveProperty('message', 'WaitForUndoError');
    expect(error.delay).toBeGreaterThan(900);
    expect(effect).toHaveBeenCalledTimes(0);
  });

  it('Should ignore if waitForUndoUntil is not specified', () => {
    const effect = jest.fn();
    const decoratedEffect = undoEffectDecorator(effect);

    decoratedEffect(
      {},
      {
        meta: {}
      }
    );

    expect(effect).toHaveBeenCalledTimes(1);
  });

  it('Should run the effect if waitForUndoUntil has past', () => {
    const effect = jest.fn();
    const decoratedEffect = undoEffectDecorator(effect);
    decoratedEffect(
      {},
      {
        meta: {
          offline: {
            waitForUndoUntil: new Date(new Date().valueOf()).toISOString()
          }
        }
      }
    );
    expect(effect).toHaveBeenCalled();
  });
});
