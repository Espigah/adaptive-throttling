/* --- */

import ThrottledEception from './ThrottledEception';

// Multiplier that determines aggressiveness of throttling
// Higher value is less agressive, 2 is recommended
const K = 2;

// Determines how many seconds wide the requestWindow is.
// Default is 120 seconds i.e rejection probability is based on how well the backend has been performing in the last 2 minutes
const HISTORY_TIME_MINUTE = 120;

// Determines how often requestsMap is cleaned (delete old keys), default 60 seconds
const UPPER_LIMITE_TO_REJECT = 60;

const defaultOptions = {
  historyTimeMinute: HISTORY_TIME_MINUTE,
  k: K,
  upperLimiteToReject: UPPER_LIMITE_TO_REJECT,
};

interface AdaptiveThrottlingOptions {
  historyTimeMinute: number;
  k: number;
  upperLimiteToReject: number;
}

function createAdaptiveThrottlingHistory(
  historyTimeMinute = HISTORY_TIME_MINUTE,
  k = K,
  upperLimiteToReject = UPPER_LIMITE_TO_REJECT,
) {
  let requestsHistory: number[] = [];
  let acceptsHistory: number[] = [];
  let cutoffIsReached: boolean;

  const checkDate = (historyTimeMinute: number): number => {
    return Date.now() - historyTimeMinute * 60000;
  };

  const filterOldestHistory = (value: number): boolean => {
    const date = checkDate(historyTimeMinute);
    return value > date;
  };

  return {
    addRequests() {
      requestsHistory.push(Date.now());
      return this;
    },
    addAccepts() {
      acceptsHistory.push(Date.now());
      return this;
    },
    refresh() {
      requestsHistory = requestsHistory.filter(filterOldestHistory);
      acceptsHistory = acceptsHistory.filter(filterOldestHistory);

      const requests = requestsHistory.length;
      const accepts = acceptsHistory.length;

      const p0 = Math.max(0, (requests - k * accepts) / (requests + 1)); // https://sre.google/sre-book/handling-overload/#eq2101
      const p1 = Math.min(p0, upperLimiteToReject); // https://rafaelcapucho.github.io/2016/10/enhance-the-quality-of-your-api-calls-with-client-side-throttling/

      return (cutoffIsReached = p1 >= upperLimiteToReject);
    },
    getCutoffIsReached() {
      return cutoffIsReached;
    },
  };
}

/**
 *
 * @param {Number} AdaptiveThrottlingOptions.historyTimeMinute - Each client task keeps the following information for the last N minutes of its history. In case of "Out of quota" means time to wait for server recovery.
 * @param {Number} AdaptiveThrottlingOptions.k - Clients can continue to issue requests to the backend until requests is K times as large as accepts.  Google services and they suggest K = 2
 * @param {Number} AdaptiveThrottlingOptions.upperLimiteToReject - if the server goes down for more than 2 minutes, the P0 value will stand in 1, rejecting locally every new request to the server, so the client app won't be able to set up a new conection. As the result of it, the client app will never have another request reaching the server. 0.9 allowing the client to recover even in that worst scenario, when the service is down more than 2 minutes.
 * @returns
 */
export const AdaptiveThrottling = ({
  historyTimeMinute = HISTORY_TIME_MINUTE,
  k = K,
  upperLimiteToReject = UPPER_LIMITE_TO_REJECT,
}: AdaptiveThrottlingOptions = defaultOptions) => {
  const adaptiveThrottling = createAdaptiveThrottlingHistory(historyTimeMinute, k, upperLimiteToReject);

  return {
    getCutoffIsReached() {
      return adaptiveThrottling.getCutoffIsReached();
    },
    async execute(func: any) {
      if (adaptiveThrottling.getCutoffIsReached()) {
        adaptiveThrottling.refresh();
        throw new ThrottledEception();
      }

      adaptiveThrottling.addRequests();

      try {
        const result: any = await func();
        adaptiveThrottling.addAccepts().refresh();
        return result;
      } catch (error) {
        adaptiveThrottling.refresh();
        throw error;
      }
    },
  };
};

/**
 *
 * @param {Number} historyTimeMinute - Each client task keeps the following information for the last N minutes of its history. In case of "Out of quota" means time to wait for server recovery.
 * @param {Number} timesAsLargeAsAccepts- Clients can continue to issue requests to the backend until requests is K times as large as accepts.  Google services and they suggest K = 2
 * @param {Number} upperLimiteToChanceOfRejectingNewRequest - if the server goes down for more than 2 minutes, the P0 value will stand in 1, rejecting locally every new request to the server, so the client app won't be able to set up a new conection. As the result of it, the client app will never have another request reaching the server. 0.9 allowing the client to recover even in that worst scenario, when the service is down more than 2 minutes.
 * @returns
 * @deprecated prefer AdaptiveThrottling
 */
export const createAdaptiveThrottling = (
  historyTimeMinute = 2,
  timesAsLargeAsAccepts = 2,
  upperLimiteToChanceOfRejectingNewRequest = 0.9,
) => {
  return AdaptiveThrottling({
    historyTimeMinute,
    k: timesAsLargeAsAccepts,
    upperLimiteToReject: upperLimiteToChanceOfRejectingNewRequest,
  });
};
