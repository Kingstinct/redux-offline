// @flow
/* global $Shape */

import type {
  OfflineStatusChangeAction,
  OfflineScheduleRetryAction,
  PersistRehydrateAction,
  OfflineAction,
  OfflineState,
  ResultAction,
  Config
} from './types';
import {
  OFFLINE_BUSY,
  OFFLINE_COMPLETE_RETRY,
  OFFLINE_SCHEDULE_RETRY,
  OFFLINE_STATUS_CHANGED,
  OFFLINE_UNDO,
  RESET_STATE,
  PERSIST_REHYDRATE
} from './constants';
import undoHandler from './undo/undoHandler';

const initialState: OfflineState = {
  busy: false,
  lastTransaction: 0,
  online: false,
  outbox: [],
  retryCount: 0,
  retryScheduled: false,
  netInfo: {
    isConnectionExpensive: null,
    reach: 'NONE'
  }
};

const buildOfflineUpdater = (dequeue, enqueue, config) =>
  function offlineUpdater(
    state: OfflineState = initialState,
    action:
      | OfflineStatusChangeAction
      | OfflineScheduleRetryAction
      | ResultAction
      | PersistRehydrateAction
  ): OfflineState {
    // Update online/offline status
    if (action.type === OFFLINE_STATUS_CHANGED) {
      return {
        ...state,
        online: action.payload.online,
        netInfo: action.payload.netInfo
      };
    }

    if (action.type === PERSIST_REHYDRATE && action.payload) {
      return {
        ...state,
        ...action.payload.offline,
        online: state.online,
        netInfo: state.netInfo,
        retryScheduled: initialState.retryScheduled,
        retryCount: initialState.retryCount,
        busy: initialState.busy
      };
    }

    if (action.type === OFFLINE_UNDO) {
      return undoHandler(state, action);
    }

    if (action.type === OFFLINE_SCHEDULE_RETRY) {
      return {
        ...state,
        busy: false,
        retryScheduled: true,
        retryCount: state.retryCount + 1
      };
    }

    if (action.type === OFFLINE_COMPLETE_RETRY) {
      return { ...state, retryScheduled: false };
    }

    if (
      action.type === OFFLINE_BUSY &&
      action.payload &&
      typeof action.payload.busy === 'boolean'
    ) {
      return { ...state, busy: action.payload.busy };
    }

    // Add offline actions to queue
    if (action.meta && action.meta.offline) {
      const waitForUndoMs =
        action.meta && action.meta.offline && action.meta.offline.waitForUndoMs
          ? action.meta.offline.waitForUndoMs
          : config.waitForUndoMs;

      const waitForUndoUntil = new Date(
        Date.now().valueOf() + waitForUndoMs
      ).toISOString();

      const transaction = state.lastTransaction + 1;
      const stamped = (({
        ...action,
        meta: {
          ...action.meta,
          offline: { ...action.meta.offline, waitForUndoUntil },
          transaction
        }
      }: any): OfflineAction);
      const { outbox } = state;
      return {
        ...state,
        lastTransaction: transaction,
        outbox: enqueue(outbox, stamped)
      };
    }

    // Remove completed actions from queue (success or fail)
    if (action.meta && action.meta.completed === true) {
      const { outbox } = state;
      return {
        ...state,
        outbox: dequeue(outbox, action),
        retryCount: 0,
        busy: false
      };
    }

    if (action.type === RESET_STATE) {
      return {
        ...initialState,
        online: state.online,
        netInfo: state.netInfo
      };
    }

    return state;
  };

export const enhanceReducer = (reducer: any, config: $Shape<Config>) => {
  const { dequeue, enqueue } = config.queue;
  const offlineUpdater = buildOfflineUpdater(dequeue, enqueue, config);

  return (state: any, action: any): any => {
    let offlineState;
    let restState;
    if (typeof state !== 'undefined') {
      offlineState = config.offlineStateLens(state).get;
      restState = config.offlineStateLens(state).set();
    }

    return config
      .offlineStateLens(reducer(restState, action))
      .set(offlineUpdater(offlineState, action));
  };
};
