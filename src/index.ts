function createAdaptiveThrottlingHistory(
  historyTime = 2,
  timesAsLargeAsAccepts = 2,
  chanceOfRejectingNewRequesLimit = 0.9,
) {
  let requestsHistory: Date[] = [];
  let acceptsHistory: Date[] = [];
  let cutoffIsReached: boolean;
  const checkDate = (historyTime: number) => {
    const currentDate = new Date();
    return new Date(currentDate.getTime() - historyTime * 60000);
  };

  const filterHistory = (value: Date) => {
    const date = checkDate(historyTime);
    return value > date;
  };

  return {
    addRequests() {
      requestsHistory.push(new Date(Date.now()));
      return this;
    },
    addAccepts() {
      acceptsHistory.push(new Date(Date.now()));
      return this;
    },
    refresh() {
      requestsHistory = requestsHistory.filter(filterHistory);
      acceptsHistory = acceptsHistory.filter(filterHistory);

      const requests = requestsHistory.length;
      const accepts = acceptsHistory.length;

      const p0 = Math.max(0, (requests - timesAsLargeAsAccepts * accepts) / (requests + 1)); // https://sre.google/sre-book/handling-overload/#eq2101
      const p1 = Math.min(p0, chanceOfRejectingNewRequesLimit); // https://rafaelcapucho.github.io/2016/10/enhance-the-quality-of-your-api-calls-with-client-side-throttling/

      //    console.log(p0, p1, cutoffIsReached, requests, accepts);

      return (cutoffIsReached = p1 >= chanceOfRejectingNewRequesLimit);
    },
    getCutoffIsReached() {
      return cutoffIsReached;
    },
  };
}

/**
 *
 * @param {Number} historyTime - Each client task keeps the following information for the last N minutes of its history:
 * @param {Number} timesAsLargeAsAccepts - Clients can continue to issue requests to the backend until requests is K times as large as accepts
 * @param {Number} chanceOfRejectingNewRequesLimit - Allowing the client to recover even in that worst scenario, when the service is down more than (historyTime) minutes.
 * @returns
 */
export const createAdaptiveThrottling = (
  historyTime = 2,
  timesAsLargeAsAccepts = 2,
  chanceOfRejectingNewRequesLimit = 0.9,
) => {
  const adaptiveThrottling = createAdaptiveThrottlingHistory(
    historyTime,
    timesAsLargeAsAccepts,
    chanceOfRejectingNewRequesLimit,
  );

  return {
    getCutoffIsReached() {
      return adaptiveThrottling.getCutoffIsReached();
    },
    async execute(func: any) {
      adaptiveThrottling.addRequests();

      if (adaptiveThrottling.getCutoffIsReached()) {
        adaptiveThrottling.addAccepts().refresh();
        throw new Error('Out of quota');
      }
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
