import canUndoSelector from '../../undo/canUndoSelector';

describe('undo selector', () => {
  it('should be true if outbox is bigger than 2', () => {
    const state = { offline: { outbox: ['a', 'b'] } };

    const result = canUndoSelector(state);

    expect(result).toEqual(true);
  });

  it('should be false if outbox is 1 and busy is truthy', () => {
    const state = { offline: { outbox: ['a'], busy: true } };

    const result = canUndoSelector(state);

    expect(result).toEqual(false);
  });

  it('should be true if outbox is 1 and busy is falsy', () => {
    const state = { offline: { outbox: ['a'] } };

    const result = canUndoSelector(state);

    expect(result).toEqual(true);
  });
});
