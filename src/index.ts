function createAdaptiveThrottlingHistory(
  historyTimeMinute = 2,
  timesAsLargeAsAccepts = 2,
  upperLimiteToChanceOfRejectingNewRequest = 0.9,
) {
  let requestsHistory: number[] = [];
  let acceptsHistory: number[] = [];
  let cutoffIsReached: boolean;

  const checkDate = (historyTime: number): number => {
    return Date.now() - historyTime * 60000;
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

      const p0 = Math.max(0, (requests - timesAsLargeAsAccepts * accepts) / (requests + 1)); // https://sre.google/sre-book/handling-overload/#eq2101
      const p1 = Math.min(p0, upperLimiteToChanceOfRejectingNewRequest); // https://rafaelcapucho.github.io/2016/10/enhance-the-quality-of-your-api-calls-with-client-side-throttling/

      return (cutoffIsReached = p1 >= upperLimiteToChanceOfRejectingNewRequest);
    },
    getCutoffIsReached() {
      return cutoffIsReached;
    },
  };
}

/**
 *
 * @param {Number} historyTime - Each client task keeps the following information for the last N minutes of its history. In case of "Out of quota" means time to wait for server recovery.
 * @param {Number} timesAsLargeAsAccepts - Clients can continue to issue requests to the backend until requests is K times as large as accepts.  Google services and they suggest K = 2
 * @param {Number} upperLimiteToChanceOfRejectingNewRequest - if the server goes down for more than 2 minutes, the P0 value will stand in 1, rejecting locally every new request to the server, so the client app won't be able to set up a new conection. As the result of it, the client app will never have another request reaching the server. 0.9 allowing the client to recover even in that worst scenario, when the service is down more than 2 minutes.
 * @returns
 */
export const createAdaptiveThrottling = (
  historyTime = 2,
  timesAsLargeAsAccepts = 2,
  upperLimiteToChanceOfRejectingNewRequest = 0.9,
) => {
  const adaptiveThrottling = createAdaptiveThrottlingHistory(
    historyTime,
    timesAsLargeAsAccepts,
    upperLimiteToChanceOfRejectingNewRequest,
  );

  return {
    getCutoffIsReached() {
      return adaptiveThrottling.getCutoffIsReached();
    },
    async execute(func: any) {
      if (adaptiveThrottling.getCutoffIsReached()) {
        adaptiveThrottling.refresh();
        throw new Error('Out of quota');
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
