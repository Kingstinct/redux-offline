import { applyMiddleware, compose, createStore } from "redux";
import { KEY_PREFIX } from "redux-persist/lib/constants"
import { AsyncNodeStorage } from "redux-persist-node-storage";
import instrument from "redux-devtools-instrument";
import { createOffline, offline } from "../index";
import { applyDefaults } from "../config";
import { canUndoSelector } from '../undo/selectors';

const storage = new AsyncNodeStorage("/tmp/storageDir");
const storageKey = `${KEY_PREFIX}offline`;
function noop() {}

beforeEach(() => storage.removeItem(storageKey, noop) );

const defaultConfig = applyDefaults({
  effect: jest.fn(() => Promise.resolve()),
  persistOptions: { storage }
});

function defaultReducer(state = {
  offline: {
    busy: false,
    lastTransaction: 0,
    online: true,
    outbox: [],
    receipts: [],
    retryToken: 0,
    retryCount: 0,
    retryScheduled: false,
    netInfo: {
      isConnectionExpensive: null,
      reach: 'none'
    }
  }
}) {
  return state;
}

describe('undo handler', () => {
  const outboxItem = {
    type: "something",
    meta: {
      offline: {
        effect: {
          url: 'some endpoint',
        }
      }
    }
  };

  test("should undo latest action", () => {
    const store = offline(defaultConfig)(createStore)(defaultReducer);
    store.replaceReducer(defaultReducer);
    store.dispatch(outboxItem);
    store.dispatch({ type: "Offline/UNDO" });
    const { outbox } = store.getState().offline;
    expect(outbox).toHaveProperty("length", 0);
  });

  test("should not undo latest action when busy and only has 1 item left", () => {
    const store = offline(defaultConfig)(createStore)(defaultReducer);
    store.replaceReducer(defaultReducer);
    store.dispatch(outboxItem);
    store.dispatch({ type: "Offline/BUSY", payload: { busy: true } });
    store.dispatch({ type: "Offline/UNDO" });
    const { outbox } = store.getState().offline;
    expect(outbox).toHaveProperty("length", 1);
  });

  test("should undo latest action when busy and only has 1 item left", () => {
    const store = offline(defaultConfig)(createStore)(defaultReducer);
    store.replaceReducer(defaultReducer);

    store.dispatch(outboxItem);
    store.dispatch(outboxItem);
    store.dispatch({ type: "Offline/BUSY", payload: { busy: true } });
    store.dispatch({ type: "Offline/UNDO" });
    const { outbox } = store.getState().offline;
    expect(outbox).toHaveProperty("length", 1);
  });
});

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
